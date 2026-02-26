#!/usr/bin/env bash
# =============================================================================
# DMS Auto-Taller Pro — Script de restauración de base de datos
# Uso: sudo bash /opt/autotaller/scripts/restore-db.sh /ruta/al/backup.sql.gz
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✔]${NC} $*"; }
info() { echo -e "${CYAN}[→]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*" >&2; exit 1; }

[[ $EUID -ne 0 ]] && err "Ejecuta como root: sudo bash restore-db.sh <backup.sql.gz>"
[[ -z "${1:-}" ]] && err "Uso: $0 /ruta/al/backup.sql.gz"
[[ -f "$1" ]] || err "Archivo no encontrado: $1"

APP_DIR="${APP_DIR:-/opt/autotaller}"
ENV_FILE="${APP_DIR}/.env"
BACKUP_FILE="$1"

[[ -f "${ENV_FILE}" ]] || err "No se encuentra .env."

set -a; source "${ENV_FILE}"; set +a

warn "¡ATENCIÓN! Se va a restaurar la base de datos '${PGDATABASE}' desde:"
warn "  ${BACKUP_FILE}"
warn "Esto SOBREESCRIBIRÁ todos los datos actuales."
read -rp "¿Continuar? (escribe 'SI' para confirmar): " CONFIRM
[[ "${CONFIRM}" == "SI" ]] || { echo "Cancelado."; exit 0; }

# Parar la aplicación temporalmente
info "Deteniendo la aplicación..."
sudo -u "${APP_USER:-autotaller}" pm2 stop autotaller 2>/dev/null || true

# Restaurar
info "Restaurando base de datos..."
PGPASSWORD="${PGPASSWORD}" dropdb \
  -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" \
  -U "${PGUSER}" --if-exists "${PGDATABASE}" 2>/dev/null || true

PGPASSWORD="${PGPASSWORD}" createdb \
  -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" \
  -U "${PGUSER}" "${PGDATABASE}"

if [[ "${BACKUP_FILE}" == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${PGPASSWORD}" psql \
    -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" \
    -U "${PGUSER}" -d "${PGDATABASE}" -q
else
  PGPASSWORD="${PGPASSWORD}" psql \
    -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" \
    -U "${PGUSER}" -d "${PGDATABASE}" -q < "${BACKUP_FILE}"
fi

log "Base de datos restaurada correctamente."

# Reiniciar la aplicación
info "Reiniciando la aplicación..."
sudo -u "${APP_USER:-autotaller}" pm2 start autotaller 2>/dev/null || true
log "Aplicación reiniciada."
