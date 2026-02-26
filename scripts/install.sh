#!/usr/bin/env bash
# =============================================================================
# DMS Auto-Taller Pro — Script de instalación desatendida
# Ubuntu 20.04 / 22.04 / 24.04
# Repositorio: https://github.com/innovafpiesmmg/Auto-Taller-Pro
# =============================================================================
set -euo pipefail

# ── Colores ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✔]${NC} $*"; }
info() { echo -e "${CYAN}[→]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*" >&2; exit 1; }

# ── Comprobaciones previas ─────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "Este script debe ejecutarse como root: sudo bash install.sh"
[[ "$(uname -s)" != "Linux" ]] && err "Solo compatible con Linux."

echo -e "\n${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   DMS Auto-Taller Pro  —  Instalación desatendida    ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}\n"

# ── Configuración ──────────────────────────────────────────────────────────
APP_DIR="${APP_DIR:-/opt/autotaller}"
APP_USER="${APP_USER:-autotaller}"
APP_PORT="${APP_PORT:-3000}"
REPO_URL="https://github.com/innovafpiesmmg/Auto-Taller-Pro.git"
NODE_VERSION="20"

DB_NAME="${DB_NAME:-autotaller_db}"
DB_USER="${DB_USER:-autotaller_user}"
# Genera contraseña y secretos aleatorios si no están definidos
DB_PASS="${DB_PASS:-$(tr -dc 'A-Za-z0-9!#%&()*+,-./:;<=>?@[]^_{|}~' </dev/urandom | head -c 28)}"
JWT_SECRET="${JWT_SECRET:-$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 64)}"
SESSION_SECRET="${SESSION_SECRET:-$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 64)}"

# ── 1. Actualizar sistema e instalar herramientas base ─────────────────────
info "Actualizando paquetes del sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq \
  -o Dpkg::Options::="--force-confdef" \
  -o Dpkg::Options::="--force-confold"

info "Instalando herramientas base (git, curl, wget, build-essential)..."
apt-get install -y -qq \
  curl wget git ca-certificates gnupg \
  build-essential software-properties-common \
  lsb-release unzip openssl ufw
log "Herramientas base instaladas."

# ── 2. Node.js 20 (LTS) via NodeSource ────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt "$NODE_VERSION" ]]; then
  info "Instalando Node.js ${NODE_VERSION}..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash - -qq
  apt-get install -y -qq nodejs
  log "Node.js $(node -v) instalado."
else
  log "Node.js $(node -v) ya presente."
fi

# ── 3. PM2 (gestor de procesos) ────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "Instalando PM2..."
  npm install -g pm2 --silent
  log "PM2 $(pm2 -v) instalado."
else
  log "PM2 ya presente."
fi

# ── 4. PostgreSQL ──────────────────────────────────────────────────────────
if ! command -v psql &>/dev/null; then
  info "Instalando PostgreSQL..."
  apt-get install -y -qq postgresql postgresql-contrib
  systemctl enable --now postgresql
  log "PostgreSQL instalado y activo."
else
  log "PostgreSQL ya presente."
  systemctl enable --now postgresql 2>/dev/null || true
fi

# ── 5. Crear base de datos y usuario ──────────────────────────────────────
info "Configurando base de datos PostgreSQL..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" \
  | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER \"${DB_USER}\" WITH PASSWORD '${DB_PASS}';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" \
  | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE \"${DB_NAME}\" TO \"${DB_USER}\";"
# PostgreSQL 15+: privilegios sobre schema public
sudo -u postgres psql -d "${DB_NAME}" -c \
  "GRANT ALL ON SCHEMA public TO \"${DB_USER}\";" 2>/dev/null || true
log "Base de datos '${DB_NAME}' y usuario '${DB_USER}' configurados."

# ── 6. Usuario del sistema ────────────────────────────────────────────────
if ! id "${APP_USER}" &>/dev/null; then
  info "Creando usuario del sistema '${APP_USER}'..."
  useradd -r -m -d "${APP_DIR}" -s /bin/bash "${APP_USER}"
fi

# ── 7. Clonar / actualizar repositorio ────────────────────────────────────
if [[ -d "${APP_DIR}/.git" ]]; then
  info "Repositorio existente, actualizando..."
  sudo -u "${APP_USER}" git -C "${APP_DIR}" pull --rebase
else
  info "Clonando repositorio desde GitHub..."
  rm -rf "${APP_DIR}"
  git clone "${REPO_URL}" "${APP_DIR}"
  chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
fi
log "Código fuente en ${APP_DIR}."

# ── 8. Archivo .env ───────────────────────────────────────────────────────
ENV_FILE="${APP_DIR}/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  info "Creando archivo .env..."
  cat > "${ENV_FILE}" <<EOF
# Generado automáticamente por install.sh — $(date '+%Y-%m-%d %H:%M:%S')
NODE_ENV=production
PORT=${APP_PORT}

# Base de datos PostgreSQL
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
PGHOST=localhost
PGPORT=5432
PGDATABASE=${DB_NAME}
PGUSER=${DB_USER}
PGPASSWORD=${DB_PASS}

# Seguridad (generados aleatoriamente)
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
EOF
  chown "${APP_USER}:${APP_USER}" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
  log "Archivo .env creado en ${ENV_FILE}."
else
  warn ".env ya existe, no se sobreescribe. Verifica DATABASE_URL manualmente."
fi

# ── 9. Instalar dependencias npm ──────────────────────────────────────────
info "Instalando dependencias npm (puede tardar unos minutos)..."
sudo -u "${APP_USER}" bash -c "cd '${APP_DIR}' && npm ci --omit=dev --silent" || \
sudo -u "${APP_USER}" bash -c "cd '${APP_DIR}' && npm install --omit=dev --silent"
log "Dependencias instaladas."

# ── 10. Ejecutar migraciones de base de datos ─────────────────────────────
info "Aplicando migraciones de base de datos (Drizzle)..."
sudo -u "${APP_USER}" bash -c "
  set -a; source '${ENV_FILE}'; set +a
  cd '${APP_DIR}'
  npx drizzle-kit push 2>&1
"
log "Migraciones aplicadas."

# ── 11. Construir la aplicación ───────────────────────────────────────────
info "Construyendo la aplicación (frontend + backend)..."
# Necesitamos devDependencies para el build
sudo -u "${APP_USER}" bash -c "cd '${APP_DIR}' && npm install --silent"
sudo -u "${APP_USER}" bash -c "cd '${APP_DIR}' && npm run build"
log "Build completado."

# ── 12. PM2: crear/actualizar ecosistema ─────────────────────────────────
PM2_CONFIG="${APP_DIR}/ecosystem.config.cjs"
cat > "${PM2_CONFIG}" <<EOF
module.exports = {
  apps: [{
    name: 'autotaller',
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
    error_file: '/var/log/autotaller/err.log',
    out_file:   '/var/log/autotaller/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
EOF
chown "${APP_USER}:${APP_USER}" "${PM2_CONFIG}"

mkdir -p /var/log/autotaller
chown "${APP_USER}:${APP_USER}" /var/log/autotaller

info "Iniciando aplicación con PM2..."
# Cargar variables de entorno y arrancar
sudo -u "${APP_USER}" bash -c "
  set -a; source '${ENV_FILE}'; set +a
  cd '${APP_DIR}'
  pm2 delete autotaller 2>/dev/null || true
  pm2 start ecosystem.config.cjs
  pm2 save
"

# Configurar inicio automático con systemd
PM2_STARTUP=$(sudo -u "${APP_USER}" pm2 startup systemd -u "${APP_USER}" --hp "${APP_DIR}" 2>&1 | grep 'sudo env')
if [[ -n "${PM2_STARTUP}" ]]; then
  eval "${PM2_STARTUP}" 2>/dev/null || true
fi
log "PM2 configurado para arrancar con el sistema."

# ── 13. Firewall UFW ──────────────────────────────────────────────────────
info "Configurando firewall..."
ufw allow ssh 2>/dev/null || true
ufw allow "${APP_PORT}/tcp" comment 'AutoTaller App' 2>/dev/null || true
ufw --force enable 2>/dev/null || true
log "Firewall configurado."

# ── 14. Resumen de instalación ────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║        Instalación completada con éxito              ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Aplicación:${NC}    http://$(hostname -I | awk '{print $1}'):${APP_PORT}"
echo -e "  ${BOLD}Directorio:${NC}    ${APP_DIR}"
echo -e "  ${BOLD}Base de datos:${NC} ${DB_NAME}@localhost:5432"
echo -e "  ${BOLD}Usuario BD:${NC}    ${DB_USER}"
echo -e "  ${BOLD}Contraseña BD:${NC} ${DB_PASS}"
echo -e "  ${BOLD}Config .env:${NC}   ${ENV_FILE}"
echo ""
echo -e "  ${BOLD}Comandos útiles:${NC}"
echo -e "  pm2 status               — Estado del proceso"
echo -e "  pm2 logs autotaller      — Ver logs en tiempo real"
echo -e "  pm2 restart autotaller   — Reiniciar aplicación"
echo -e "  sudo bash ${APP_DIR}/scripts/update.sh   — Actualizar"
echo ""
warn "Guarda las credenciales de arriba en un lugar seguro."
warn "El archivo .env contiene los secretos de la aplicación."
