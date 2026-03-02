#!/usr/bin/env bash
# =============================================================================
# DMS Auto-Taller Pro — Script de actualización
# Descarga la última versión de GitHub, reconstruye y reinicia.
# Uso: sudo bash /opt/autotaller/scripts/update.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✔]${NC} $*"; }
info() { echo -e "${CYAN}[→]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*" >&2; exit 1; }

[[ $EUID -ne 0 ]] && err "Ejecuta como root: sudo bash update.sh"

APP_DIR="${APP_DIR:-/opt/autotaller}"
APP_USER="${APP_USER:-autotaller}"
ENV_FILE="${APP_DIR}/.env"

[[ -d "${APP_DIR}/.git" ]] || err "No se encuentra el repositorio en ${APP_DIR}. Ejecuta install.sh primero."
[[ -f "${ENV_FILE}" ]] || err "No se encuentra .env en ${APP_DIR}. Ejecuta install.sh primero."

echo -e "\n${BOLD}── DMS Auto-Taller Pro — Actualización ──${NC}\n"

# =============================================================================
# FASE 1: Git pull + reinicio con la versión nueva del script
# Bash lee el script en bloques; si git pull lo modifica en disco, el resto
# del script seguiría ejecutando la versión antigua ya en memoria.
# Solución: tras el pull hacemos `exec` para reemplazar este proceso con la
# versión recién descargada, pasando _SKIP_PULL=1 para evitar el bucle.
# =============================================================================
if [[ "${_SKIP_PULL:-}" != "1" ]]; then
  info "Guardando copia de .env..."
  cp "${ENV_FILE}" "${ENV_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

  info "Descargando últimos cambios de GitHub..."
  sudo -u "${APP_USER}" git -C "${APP_DIR}" fetch origin
  sudo -u "${APP_USER}" git -C "${APP_DIR}" pull --rebase origin main 2>/dev/null || \
    sudo -u "${APP_USER}" git -C "${APP_DIR}" pull origin main
  log "Código actualizado. Continuando con la versión recién descargada..."

  # Reemplazar este proceso con el script actualizado en disco
  exec env _SKIP_PULL=1 APP_DIR="${APP_DIR}" APP_USER="${APP_USER}" \
    bash "${APP_DIR}/scripts/update.sh"
fi

# =============================================================================
# FASE 2: A partir de aquí se ejecuta SIEMPRE la versión más reciente del script
# =============================================================================

# 1. Instalar/actualizar dependencias npm
info "Actualizando dependencias npm..."
sudo -u "${APP_USER}" bash -c "cd '${APP_DIR}' && npm install --silent"
log "Dependencias actualizadas."

# 2. Migración SQL: columna rol → roles[] (versiones anteriores a 2.0)
#    Usa SQL puro via psql con el DATABASE_URL del .env.
#    Si la columna ya es roles[], el bloque DO no hace nada.
info "Verificando migración de columna de roles de usuario..."
set -a; source "${ENV_FILE}"; set +a

MIGRATE_SQL="
DO \$\$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'rol'
  ) THEN
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS roles text[] NOT NULL DEFAULT ARRAY['recepcion'];
    UPDATE users SET roles = ARRAY[rol::text]
      WHERE roles = ARRAY['recepcion'];
    ALTER TABLE users DROP COLUMN rol;
    RAISE NOTICE 'Columna rol migrada a array roles correctamente.';
  ELSE
    RAISE NOTICE 'Esquema de roles ya actualizado. Sin cambios.';
  END IF;
END;
\$\$;
"

# Intentar con psql (disponible si postgresql-client está instalado)
if command -v psql &>/dev/null; then
  psql "${DATABASE_URL}" -c "${MIGRATE_SQL}" \
    && log "Migración de esquema verificada." \
    || warn "Error ejecutando la migración SQL. Continuando..."
else
  # Fallback: Node.js CommonJS (pg está en node_modules del proyecto)
  node --require "${APP_DIR}/node_modules/pg/lib/index.js" \
    -e "
      const { Pool } = require('${APP_DIR}/node_modules/pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      pool.query(\`${MIGRATE_SQL}\`)
        .then(() => { console.log('[✔] Migración completada.'); pool.end(); })
        .catch(e => { console.warn('[!] Aviso migración:', e.message); pool.end(); });
    " 2>/dev/null \
    || warn "No se pudo ejecutar la migración. Si hay errores de roles, ejecuta reset-admin.sh."
fi

# 3. Aplicar cambios de esquema con drizzle-kit (no-interactivo)
#    La migración SQL anterior garantiza que la BD ya tiene 'roles',
#    por lo que drizzle-kit no debería mostrar prompts.
#    Como seguridad extra, se acepta el prompt por defecto via stdin.
info "Aplicando migraciones de base de datos..."
sudo -u "${APP_USER}" bash -c "
  set -a; source '${ENV_FILE}'; set +a
  cd '${APP_DIR}'
  echo '' | npx drizzle-kit push 2>&1
" && log "Migraciones aplicadas." || warn "drizzle-kit push devolvió un aviso. Revisa si el esquema está correcto."

# 4. Reconstruir la aplicación
info "Reconstruyendo la aplicación..."
sudo -u "${APP_USER}" bash -c "cd '${APP_DIR}' && npm run build"
log "Build completado."

# 5. Reiniciar PM2
info "Reiniciando la aplicación..."
sudo -u "${APP_USER}" bash -c "
  set -a; source '${ENV_FILE}'; set +a
  pm2 reload autotaller --update-env
  pm2 save
"
log "Aplicación reiniciada."

echo ""
echo -e "${BOLD}${GREEN}Actualización completada con éxito.${NC}"
sudo -u "${APP_USER}" pm2 status autotaller
