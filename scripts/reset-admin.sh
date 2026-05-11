#!/usr/bin/env bash
# =============================================================================
# DMS Auto-Taller Pro — Crear / resetear usuario administrador
# Uso: sudo bash /opt/autotaller/scripts/reset-admin.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔]${NC} $*"; }
info() { echo -e "${CYAN}[→]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*" >&2; exit 1; }

[[ $EUID -ne 0 ]] && err "Ejecuta como root: sudo bash reset-admin.sh"

APP_DIR="${APP_DIR:-/opt/autotaller}"
APP_USER="${APP_USER:-autotaller}"
ENV_FILE="${APP_DIR}/.env"

[[ -f "${ENV_FILE}" ]] || err "No se encuentra ${ENV_FILE}. Verifica la ruta."
[[ -d "${APP_DIR}/node_modules" ]] || err "No se encuentran node_modules en ${APP_DIR}. Ejecuta update.sh primero."

# Cargar variables de entorno del fichero .env
set -a; source "${ENV_FILE}"; set +a

[[ -z "${DATABASE_URL:-}" ]] && err "DATABASE_URL no está definido en ${ENV_FILE}."

# ── Pedir credenciales ────────────────────────────────────────────────────────
echo -e "\n${BOLD}── DMS Auto-Taller Pro — Reset de administrador ──${NC}\n"
read -rp "  Nuevo usuario admin (Enter = 'admin'): " ADMIN_USER
ADMIN_USER="${ADMIN_USER:-admin}"

read -rsp "  Contraseña nueva (Enter = 'admin123'): " ADMIN_PASS
echo ""
ADMIN_PASS="${ADMIN_PASS:-admin123}"

read -rp "  Email (Enter = 'admin@taller.local'): " ADMIN_EMAIL
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@taller.local}"

info "Procesando usuario '${ADMIN_USER}'..."

# ── Crear script Node.js temporal ────────────────────────────────────────────
# Se escribe a un fichero temporal para evitar problemas con heredocs y sudo
TMPSCRIPT="$(mktemp /tmp/reset-admin-XXXXXX.mjs)"
chmod 644 "${TMPSCRIPT}"

# Escapar la contraseña para que sea segura dentro del string JS
# (reemplazar comilla simple por \' para el literal JS)
ADMIN_PASS_ESCAPED="${ADMIN_PASS//\'/\'}"

cat > "${TMPSCRIPT}" <<JSEOF
import bcrypt from '${APP_DIR}/node_modules/bcrypt/bcrypt.js';
import pg from '${APP_DIR}/node_modules/pg/lib/index.js';

const { Pool } = pg;
const pool = new Pool({ connectionString: '${DATABASE_URL}' });

try {
  // Asegurarse de que la tabla users existe con el esquema correcto
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT,
      password TEXT NOT NULL,
      nombre TEXT NOT NULL DEFAULT '',
      apellidos TEXT DEFAULT '',
      roles TEXT[] NOT NULL DEFAULT ARRAY['admin'],
      activo BOOLEAN NOT NULL DEFAULT true
    )
  \`);

  const hash = await bcrypt.hash('${ADMIN_PASS_ESCAPED}', 10);

  // Intentar actualizar primero; si no existe el usuario, insertar
  const updateResult = await pool.query(
    \`UPDATE users
     SET password = \$1, email = \$2, roles = ARRAY['admin'], activo = true
     WHERE username = \$3
     RETURNING id\`,
    [hash, '${ADMIN_EMAIL}', '${ADMIN_USER}']
  );

  if (updateResult.rowCount === 0) {
    await pool.query(
      \`INSERT INTO users (username, email, password, nombre, apellidos, roles, activo)
       VALUES (\$1, \$2, \$3, 'Administrador', 'Sistema', ARRAY['admin'], true)\`,
      ['${ADMIN_USER}', '${ADMIN_EMAIL}', hash]
    );
    console.log('CREADO');
  } else {
    console.log('ACTUALIZADO');
  }
} catch (e) {
  console.error('ERROR:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
JSEOF

# Ejecutar como el usuario de la aplicación, pasando explícitamente las vars necesarias
RESULT=$(sudo -u "${APP_USER}" \
  DATABASE_URL="${DATABASE_URL}" \
  NODE_PATH="${APP_DIR}/node_modules" \
  node "${TMPSCRIPT}" 2>&1) || {
    rm -f "${TMPSCRIPT}"
    echo -e "${RED}[✘] Error al ejecutar el script Node.js:${NC}"
    echo "    ${RESULT}"
    echo ""
    echo -e "${YELLOW}[!] Intentando con psql como alternativa...${NC}"
    _use_psql=1
  }

rm -f "${TMPSCRIPT}"

# ── Alternativa con psql si Node.js falló ────────────────────────────────────
if [[ "${_use_psql:-0}" == "1" ]]; then
  if ! command -v psql &>/dev/null; then
    err "psql tampoco está disponible. Instala postgresql-client: apt install -y postgresql-client"
  fi

  warn "Usando psql (sin bcrypt — la contraseña se guardará en texto plano temporalmente)."
  warn "CAMBIA LA CONTRASEÑA INMEDIATAMENTE desde el panel de administración."

  RESULT=$(psql "${DATABASE_URL}" <<SQLEOF 2>&1
INSERT INTO users (username, email, password, nombre, apellidos, roles, activo)
VALUES ('${ADMIN_USER}', '${ADMIN_EMAIL}', '${ADMIN_PASS}', 'Administrador', 'Sistema', ARRAY['admin'], true)
ON CONFLICT (username) DO UPDATE
  SET password = EXCLUDED.password,
      email = EXCLUDED.email,
      roles = ARRAY['admin'],
      activo = true;
SQLEOF
  ) && RESULT="ACTUALIZADO (sin hash)" || err "Fallo también con psql: ${RESULT}"
fi

echo ""
log "Acceso restaurado. Credenciales:"
echo -e "  ${BOLD}Usuario:${NC}    ${ADMIN_USER}"
echo -e "  ${BOLD}Contraseña:${NC} ${ADMIN_PASS}"
echo -e "  ${BOLD}Email:${NC}      ${ADMIN_EMAIL}"
echo -e "  ${BOLD}Estado:${NC}     ${RESULT}"
echo ""
warn "Cambia la contraseña desde Configuración > Usuarios tras el primer acceso."
