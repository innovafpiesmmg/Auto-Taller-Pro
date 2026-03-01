#!/usr/bin/env bash
# =============================================================================
# DMS Auto-Taller Pro — Crear nueva instancia de aula
#
# Levanta una instancia completamente independiente del taller en un puerto
# propio, con su propia base de datos, usuario y proceso PM2. Ideal para que
# cada docente/grupo trabaje de forma aislada en el mismo servidor.
#
# Uso:
#   sudo bash /opt/autotaller/scripts/nuevo-aula.sh <nombre-aula> [subdominio.dominio.com]
#
# Ejemplos:
#   sudo bash /opt/autotaller/scripts/nuevo-aula.sh daw2024
#   sudo bash /opt/autotaller/scripts/nuevo-aula.sh grupo-b aula-b.taller.midominio.com
#
# Requisitos:
#   - Instalación base ya realizada con install.sh (Node, PM2, PostgreSQL)
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✔]${NC} $*"; }
info() { echo -e "${CYAN}[→]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*" >&2; exit 1; }
step() { echo -e "\n${BOLD}── $* ──────────────────────────────────────────────${NC}"; }

# ── Validaciones previas ────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "Ejecuta como root: sudo bash nuevo-aula.sh <nombre-aula>"
[[ "$(uname -s)" != "Linux" ]] && err "Solo compatible con Linux."

command -v node  &>/dev/null || err "Node.js no encontrado. Ejecuta install.sh primero."
command -v pm2   &>/dev/null || err "PM2 no encontrado. Ejecuta install.sh primero."
command -v psql  &>/dev/null || err "PostgreSQL no encontrado. Ejecuta install.sh primero."

# ── Parámetros ──────────────────────────────────────────────────────────────
NOMBRE_AULA="${1:-}"
DOMINIO_AULA="${2:-}"

if [[ -z "${NOMBRE_AULA}" ]]; then
  echo ""
  echo -e "${BOLD}Uso:${NC} sudo bash nuevo-aula.sh <nombre-aula> [subdominio.dominio.com]"
  echo ""
  echo -e "  ${CYAN}nombre-aula${NC}  Identificador corto del aula (sin espacios)."
  echo -e "               Ejemplos: daw2024, grupo-a, turno-tarde"
  echo ""
  echo -e "  ${CYAN}subdominio${NC}   (Opcional) Dominio público para Cloudflare."
  echo -e "               Ejemplo: daw2024.taller.midominio.com"
  echo ""
  read -rp "  Nombre del aula: " NOMBRE_AULA
  [[ -z "${NOMBRE_AULA}" ]] && err "Debes indicar un nombre de aula."
fi

# Sanitizar nombre: solo letras, números y guiones
AULA_SLUG=$(echo "${NOMBRE_AULA}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
[[ -z "${AULA_SLUG}" ]] && err "Nombre de aula inválido: '${NOMBRE_AULA}'. Usa letras y números."

# Variables derivadas
REPO_URL="https://github.com/innovafpiesmmg/Auto-Taller-Pro.git"
BASE_DIR="/opt/autotaller"
APP_DIR="/opt/autotaller-${AULA_SLUG}"
APP_USER="autotaller"            # Mismo usuario del sistema que la instancia base
PM2_NAME="autotaller-${AULA_SLUG}"

# Sanitizar nombre para PostgreSQL (solo alfanumérico + guión bajo)
DB_SLUG=$(echo "${AULA_SLUG}" | tr '-' '_')
DB_NAME="autotaller_${DB_SLUG}"
DB_USER="at_${DB_SLUG}_u"
# Limitar a 63 chars (límite PostgreSQL)
DB_NAME="${DB_NAME:0:63}"
DB_USER="${DB_USER:0:63}"

_gen_secret() { openssl rand -hex "$1" 2>/dev/null || dd if=/dev/urandom bs="$1" count=1 2>/dev/null | od -An -tx1 | tr -d ' \n'; }
DB_PASS="$(_gen_secret 16)"
JWT_SECRET="$(_gen_secret 32)"
SESSION_SECRET="$(_gen_secret 32)"
ADMIN_PASS="${ADMIN_PASS:-admin123}"

# ── Buscar puerto libre ─────────────────────────────────────────────────────
find_free_port() {
  local port=3001
  while true; do
    # Comprobar si el puerto está en uso (ss o netstat)
    if ! ss -tlnp 2>/dev/null | grep -q ":${port} " && \
       ! grep -rq "^PORT=${port}$" /opt/autotaller*/.env 2>/dev/null; then
      echo "${port}"
      return
    fi
    (( port++ ))
    [[ ${port} -gt 4000 ]] && { echo ""; return; }
  done
}

APP_PORT="$(_find_port() {
  local port=3001
  while true; do
    local in_use=0
    ss -tlnp 2>/dev/null | grep -q ":${port} " && in_use=1
    grep -rq "^PORT=${port}$" /opt/autotaller*/.env 2>/dev/null && in_use=1
    [[ ${in_use} -eq 0 ]] && { echo "${port}"; return; }
    (( port++ ))
    [[ ${port} -gt 4000 ]] && { echo ""; return; }
  done
}; _find_port)"

[[ -z "${APP_PORT}" ]] && err "No se encontró un puerto libre entre 3001 y 4000."

# ── Cabecera ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       DMS Auto-Taller Pro  —  Nueva Instancia de Aula       ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Aula:${NC}          ${NOMBRE_AULA}"
echo -e "  ${BOLD}Directorio:${NC}    ${APP_DIR}"
echo -e "  ${BOLD}Puerto:${NC}        ${APP_PORT}"
echo -e "  ${BOLD}Base de datos:${NC} ${DB_NAME}"
echo -e "  ${BOLD}PM2:${NC}           ${PM2_NAME}"
[[ -n "${DOMINIO_AULA}" ]] && echo -e "  ${BOLD}Dominio:${NC}       ${DOMINIO_AULA}"
echo ""

# Confirmar
read -rp "  ¿Continuar con la instalación? [S/n]: " CONFIRM
[[ "${CONFIRM,,}" == "n" ]] && { echo "Cancelado."; exit 0; }

# ── Comprobar que no existe ya ──────────────────────────────────────────────
if [[ -d "${APP_DIR}" ]]; then
  warn "El directorio ${APP_DIR} ya existe."
  read -rp "  ¿Sobreescribir la instalación existente? [s/N]: " OVERWRITE
  if [[ "${OVERWRITE,,}" != "s" && "${OVERWRITE,,}" != "si" ]]; then
    echo "Cancelado."
    exit 0
  fi
  # Detener PM2 si está corriendo
  sudo -u "${APP_USER}" pm2 delete "${PM2_NAME}" 2>/dev/null || true
  rm -rf "${APP_DIR}"
fi

# ── PASO 1: Base de datos ─────────────────────────────────────────────────
step "1 — Base de datos PostgreSQL"

info "Creando usuario de base de datos '${DB_USER}'..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" \
  | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER \"${DB_USER}\" WITH PASSWORD '${DB_PASS}';"

info "Creando base de datos '${DB_NAME}'..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" \
  | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE \"${DB_NAME}\" TO \"${DB_USER}\";"
sudo -u postgres psql -d "${DB_NAME}" -c \
  "GRANT ALL ON SCHEMA public TO \"${DB_USER}\";" 2>/dev/null || true

log "Base de datos lista."

# ── PASO 2: Clonar repositorio ────────────────────────────────────────────
step "2 — Código fuente"

info "Clonando repositorio en ${APP_DIR}..."
git clone "${REPO_URL}" "${APP_DIR}"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
log "Código clonado."

# ── PASO 3: Archivo .env ─────────────────────────────────────────────────
step "3 — Configuración (.env)"

ENV_FILE="${APP_DIR}/.env"
cat > "${ENV_FILE}" <<ENVEOF
# Generado por nuevo-aula.sh — $(date '+%Y-%m-%d %H:%M:%S')
# Aula: ${NOMBRE_AULA}
NODE_ENV=production
PORT=${APP_PORT}

# Base de datos PostgreSQL
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
PGHOST=localhost
PGPORT=5432
PGDATABASE=${DB_NAME}
PGUSER=${DB_USER}
PGPASSWORD=${DB_PASS}

# Seguridad (generados aleatoriamente — no compartir)
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
ENVEOF

chown "${APP_USER}:${APP_USER}" "${ENV_FILE}"
chmod 600 "${ENV_FILE}"
log "Archivo .env creado (puerto ${APP_PORT})."

# ── PASO 4: Dependencias npm ─────────────────────────────────────────────
step "4 — Dependencias npm"

info "Instalando dependencias (puede tardar 1-2 minutos)..."
sudo -u "${APP_USER}" bash -c "cd '${APP_DIR}' && npm ci --silent" || \
sudo -u "${APP_USER}" bash -c "cd '${APP_DIR}' && npm install --silent"
log "Dependencias instaladas."

# ── PASO 5: Migraciones de base de datos ────────────────────────────────
step "5 — Migraciones de base de datos"

info "Aplicando esquema (Drizzle)..."
sudo -u "${APP_USER}" bash -c "
  set -a; source '${ENV_FILE}'; set +a
  cd '${APP_DIR}'
  npx drizzle-kit push 2>&1
"
log "Esquema de base de datos aplicado."

# ── PASO 6: Usuario administrador ────────────────────────────────────────
step "6 — Usuario administrador"

info "Creando usuario admin para el aula..."
ADMIN_HASH=$(cd "${APP_DIR}" && node -e \
  "require('./node_modules/bcrypt').hash('${ADMIN_PASS}',10).then(h=>{console.log(h);process.exit(0)})" \
  2>/dev/null) || ADMIN_HASH=""

if [[ -n "${ADMIN_HASH}" ]]; then
  sudo -u postgres psql -d "${DB_NAME}" -c \
    "INSERT INTO users (username,email,password,nombre,apellidos,rol,activo)
     VALUES ('admin','admin@${AULA_SLUG}.local','${ADMIN_HASH}','Administrador','${NOMBRE_AULA}','admin',true)
     ON CONFLICT (username) DO UPDATE SET password='${ADMIN_HASH}',activo=true;" \
    2>/dev/null && log "Usuario admin creado." \
    || warn "No se pudo crear el admin. Hazlo manualmente desde la aplicación."
else
  warn "No se generó el hash bcrypt. Crea el usuario admin desde la interfaz."
fi

# ── PASO 7: Build ────────────────────────────────────────────────────────
step "7 — Build de la aplicación"

info "Construyendo frontend y backend..."
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
sudo -u "${APP_USER}" bash -c "cd '${APP_DIR}' && npm run build"
log "Build completado."

# ── PASO 8: PM2 ──────────────────────────────────────────────────────────
step "8 — Proceso PM2"

LOG_DIR="/var/log/autotaller-${AULA_SLUG}"
mkdir -p "${LOG_DIR}"
chown "${APP_USER}:${APP_USER}" "${LOG_DIR}"

PM2_CONFIG="${APP_DIR}/ecosystem.config.cjs"
cat > "${PM2_CONFIG}" <<PM2EOF
module.exports = {
  apps: [{
    name: '${PM2_NAME}',
    script: 'dist/index.js',
    cwd: '${APP_DIR}',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: '${APP_PORT}'
    },
    env_file: '${ENV_FILE}',
    error_file: '${LOG_DIR}/err.log',
    out_file:   '${LOG_DIR}/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
PM2EOF
chown "${APP_USER}:${APP_USER}" "${PM2_CONFIG}"

info "Iniciando ${PM2_NAME} con PM2..."
sudo -u "${APP_USER}" bash -c "
  set -a; source '${ENV_FILE}'; set +a
  cd '${APP_DIR}'
  pm2 start ecosystem.config.cjs
  pm2 save
"
log "Proceso '${PM2_NAME}' activo en puerto ${APP_PORT}."

# ── PASO 9: Firewall ─────────────────────────────────────────────────────
step "9 — Firewall"

if command -v ufw &>/dev/null; then
  ufw allow "${APP_PORT}/tcp" comment "AutoTaller ${NOMBRE_AULA}" 2>/dev/null || true
  log "Puerto ${APP_PORT} abierto en UFW."
else
  warn "UFW no encontrado. Abre manualmente el puerto ${APP_PORT} si es necesario."
fi

# ── PASO 10: Cloudflare Tunnel ───────────────────────────────────────────
step "10 — Cloudflare Tunnel"

CF_CONFIG="/etc/cloudflared/config.yml"
CF_CONFIGURED=false

if [[ -n "${DOMINIO_AULA}" ]] && [[ -f "${CF_CONFIG}" ]]; then
  # Hay un tunnel existente — añadir el nuevo ingress automáticamente
  info "Túnel de Cloudflare detectado. Añadiendo ${DOMINIO_AULA}..."

  # Extraer el bloque ingress actual, insertar la nueva ruta antes del fallback 404
  if grep -q "hostname: ${DOMINIO_AULA}" "${CF_CONFIG}"; then
    warn "El dominio ${DOMINIO_AULA} ya existe en la configuración del túnel."
  else
    # Insertar nueva regla antes de la línea '- service: http_status:404'
    sed -i "/- service: http_status:404/i\\  - hostname: ${DOMINIO_AULA}\\n    service: http://localhost:${APP_PORT}" "${CF_CONFIG}"
    log "Ruta añadida: ${DOMINIO_AULA} → localhost:${APP_PORT}"
  fi

  # Crear registro DNS en Cloudflare (usando el nombre del túnel del config)
  TUNNEL_ID=$(grep '^tunnel:' "${CF_CONFIG}" | awk '{print $2}' | tr -d ' ')
  TUNNEL_NAME_CF=$(grep '^# Cloudflare Tunnel' "${CF_CONFIG}" | head -1 | awk '{print $NF}' || true)

  if [[ -n "${TUNNEL_ID}" ]]; then
    info "Creando registro DNS CNAME en Cloudflare..."
    sudo -u "${APP_USER}" cloudflared tunnel route dns "${TUNNEL_ID}" "${DOMINIO_AULA}" 2>&1 \
      && log "DNS CNAME creado: ${DOMINIO_AULA} → ${TUNNEL_ID}.cfargotunnel.com" \
      || warn "No se pudo crear el DNS automáticamente. Créalo manualmente en el panel de Cloudflare."
  fi

  # Reiniciar cloudflared para aplicar la nueva ruta
  systemctl restart cloudflared 2>/dev/null || true
  log "Cloudflared reiniciado con la nueva ruta."
  CF_CONFIGURED=true

elif [[ -n "${DOMINIO_AULA}" ]] && ! [[ -f "${CF_CONFIG}" ]]; then
  warn "No se encontró configuración de Cloudflare Tunnel en este servidor."
  warn "Configura el tunnel con:"
  echo -e "  ${BOLD}sudo bash ${APP_DIR}/scripts/setup-cloudflare.sh ${DOMINIO_AULA}${NC}"
fi

# ── Resumen final ────────────────────────────────────────────────────────
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "IP-DEL-SERVIDOR")

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║         Aula '${NOMBRE_AULA}' creada con éxito                      ${NC}${BOLD}${GREEN}║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Aula:${NC}              ${NOMBRE_AULA}"
echo -e "  ${BOLD}Puerto asignado:${NC}   ${APP_PORT}"
echo -e "  ${BOLD}URL local:${NC}         http://${SERVER_IP}:${APP_PORT}"
[[ "${CF_CONFIGURED}" == "true" ]] && \
echo -e "  ${BOLD}URL pública:${NC}       https://${DOMINIO_AULA}"
echo ""
echo -e "  ${BOLD}Base de datos:${NC}     ${DB_NAME}"
echo -e "  ${BOLD}Usuario BD:${NC}        ${DB_USER}"
echo -e "  ${BOLD}Contraseña BD:${NC}     ${DB_PASS}   ${YELLOW}← guarda esto${NC}"
echo -e "  ${BOLD}Directorio:${NC}        ${APP_DIR}"
echo -e "  ${BOLD}Config .env:${NC}       ${ENV_FILE}"
echo ""
echo -e "  ${BOLD}Acceso a la aplicación:${NC}"
echo -e "  Usuario:         admin"
echo -e "  Contraseña:      ${ADMIN_PASS}"
echo ""
echo -e "  ${BOLD}Gestión PM2:${NC}"
echo -e "  pm2 status                              — Estado de todos los procesos"
echo -e "  pm2 logs ${PM2_NAME}    — Logs en tiempo real"
echo -e "  pm2 restart ${PM2_NAME} — Reiniciar"
echo -e "  pm2 stop ${PM2_NAME}    — Detener"
echo ""

# Si no había Cloudflare configurado, mostrar instrucciones
if [[ -z "${DOMINIO_AULA}" ]] || [[ "${CF_CONFIGURED}" == "false" && ! -f "${CF_CONFIG}" ]]; then
  echo -e "  ${BOLD}Configurar dominio en Cloudflare (cuando lo necesites):${NC}"
  echo ""
  if [[ -f "${CF_CONFIG}" ]]; then
    echo -e "  Como ya hay un Cloudflare Tunnel activo, añade manualmente"
    echo -e "  estas líneas en ${CF_CONFIG}, antes de la línea '- service: http_status:404':"
    echo ""
    echo -e "${CYAN}  - hostname: tu-subdominio.tu-dominio.com"
    echo -e "    service: http://localhost:${APP_PORT}${NC}"
    echo ""
    echo -e "  Luego reinicia el tunnel: ${BOLD}sudo systemctl restart cloudflared${NC}"
  else
    echo -e "  1. Instala Cloudflare Tunnel (si aún no está):"
    echo -e "     ${BOLD}sudo bash ${BASE_DIR}/scripts/setup-cloudflare.sh tu-subdominio.tu-dominio.com${NC}"
    echo ""
    echo -e "  2. O añade el puerto ${APP_PORT} manualmente desde tu panel de Cloudflare:"
    echo -e "     Dashboard → Zero Trust → Networks → Tunnels → tu-tunnel → Edit"
    echo -e "     Public Hostname: tu-subdominio.tu-dominio.com"
    echo -e "     Service: HTTP · localhost:${APP_PORT}"
  fi
  echo ""
fi

echo -e "  ${BOLD}Actualizar esta aula:${NC}"
echo -e "  APP_DIR='${APP_DIR}' APP_USER='${APP_USER}' sudo bash ${BASE_DIR}/scripts/update.sh"
echo ""
warn "Guarda las credenciales de base de datos en un lugar seguro."
echo ""

# Listar todas las aulas activas
echo -e "${BOLD}Instancias activas en este servidor:${NC}"
sudo -u "${APP_USER}" pm2 list --no-color 2>/dev/null | grep -E "autotaller|name" || true
echo ""
