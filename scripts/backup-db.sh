#!/usr/bin/env bash
# =============================================================================
# DMS Auto-Taller Pro — Script de copia de seguridad de la base de datos
# Uso: sudo bash /opt/autotaller/scripts/backup-db.sh
# Copia de seguridad automática: añadir a crontab
#   0 2 * * * root /opt/autotaller/scripts/backup-db.sh >> /var/log/autotaller/backup.log 2>&1
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*"; }
err()  { echo -e "${RED}[✘]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*" >&2; exit 1; }

APP_DIR="${APP_DIR:-/opt/autotaller}"
ENV_FILE="${APP_DIR}/.env"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/autotaller}"
KEEP_DAYS="${KEEP_DAYS:-7}"

[[ -f "${ENV_FILE}" ]] || err "No se encuentra .env. Ejecuta install.sh primero."

# Cargar variables de entorno
set -a; source "${ENV_FILE}"; set +a

mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/autotaller_${TIMESTAMP}.sql.gz"

log "Iniciando copia de seguridad → ${BACKUP_FILE}"

# Hacer el dump y comprimir en un solo paso
PGPASSWORD="${PGPASSWORD}" pg_dump \
  -h "${PGHOST:-localhost}" \
  -p "${PGPORT:-5432}" \
  -U "${PGUSER}" \
  -d "${PGDATABASE}" \
  --no-password \
  --format=plain \
  --no-owner \
  --no-acl \
  2>/dev/null | gzip > "${BACKUP_FILE}"

SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
log "Copia de seguridad completada: ${BACKUP_FILE} (${SIZE})"

# Eliminar copias antiguas (> KEEP_DAYS días)
DELETED=$(find "${BACKUP_DIR}" -name "autotaller_*.sql.gz" -mtime +${KEEP_DAYS} -delete -print | wc -l)
[[ $DELETED -gt 0 ]] && warn "Eliminadas ${DELETED} copias antiguas (>${KEEP_DAYS} días)."

log "Copias disponibles en ${BACKUP_DIR}:"
ls -lh "${BACKUP_DIR}"/autotaller_*.sql.gz 2>/dev/null || echo "  (ninguna)"
