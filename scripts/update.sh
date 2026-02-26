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

# 1. Crear copia de seguridad del .env
info "Guardando copia de .env..."
cp "${ENV_FILE}" "${ENV_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# 2. Actualizar código fuente
info "Descargando últimos cambios de GitHub..."
sudo -u "${APP_USER}" git -C "${APP_DIR}" fetch origin
sudo -u "${APP_USER}" git -C "${APP_DIR}" pull --rebase origin main 2>/dev/null || \
sudo -u "${APP_USER}" git -C "${APP_DIR}" pull origin main
log "Código actualizado."

# 3. Instalar/actualizar dependencias npm
info "Actualizando dependencias npm..."
sudo -u "${APP_USER}" bash -c "cd '${APP_DIR}' && npm install --silent"
log "Dependencias actualizadas."

# 4. Aplicar nuevas migraciones si las hay
info "Aplicando migraciones de base de datos..."
sudo -u "${APP_USER}" bash -c "
  set -a; source '${ENV_FILE}'; set +a
  cd '${APP_DIR}'
  npx drizzle-kit push 2>&1
"
log "Migraciones aplicadas."

# 5. Reconstruir la aplicación
info "Reconstruyendo la aplicación..."
sudo -u "${APP_USER}" bash -c "cd '${APP_DIR}' && npm run build"
log "Build completado."

# 6. Reiniciar PM2
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
