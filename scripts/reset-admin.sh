#!/usr/bin/env bash
# =============================================================================
# DMS Auto-Taller Pro — Crear / resetear usuario administrador
# Uso: sudo bash /opt/autotaller/scripts/reset-admin.sh
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔]${NC} $*"; }
info() { echo -e "${CYAN}[→]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }

APP_DIR="${APP_DIR:-/opt/autotaller}"
APP_USER="${APP_USER:-autotaller}"
ENV_FILE="${APP_DIR}/.env"

[[ -f "${ENV_FILE}" ]] || { echo "No se encuentra ${ENV_FILE}"; exit 1; }
set -a; source "${ENV_FILE}"; set +a

# ── Pedir nueva contraseña ─────────────────────────────────────────────────
echo -e "\n${BOLD}── DMS Auto-Taller Pro — Reset de administrador ──${NC}\n"
read -rp "  Nuevo usuario admin (Enter = 'admin'): " ADMIN_USER
ADMIN_USER="${ADMIN_USER:-admin}"

read -rsp "  Contraseña (Enter = 'admin123'): " ADMIN_PASS
echo ""
ADMIN_PASS="${ADMIN_PASS:-admin123}"

read -rp "  Email (Enter = 'admin@taller.local'): " ADMIN_EMAIL
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@taller.local}"

info "Creando/actualizando usuario '${ADMIN_USER}'..."

# Script Node.js inline que usa bcrypt para hashear y upsert en la BD
sudo -u "${APP_USER}" node --input-type=module <<EOF
import bcrypt from 'bcrypt';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const hash = await bcrypt.hash('${ADMIN_PASS}', 10);

// Intentar actualizar primero; si no existe, insertar
const update = await pool.query(
  \`UPDATE users SET password = \$1, email = \$2, activo = true
   WHERE username = \$3 RETURNING id\`,
  [hash, '${ADMIN_EMAIL}', '${ADMIN_USER}']
);

if (update.rowCount === 0) {
  await pool.query(
    \`INSERT INTO users (username, email, password, nombre, apellidos, rol, activo)
     VALUES (\$1, \$2, \$3, 'Administrador', 'Sistema', 'admin', true)\`,
    ['${ADMIN_USER}', '${ADMIN_EMAIL}', hash]
  );
  console.log('Usuario creado.');
} else {
  console.log('Contraseña actualizada.');
}

await pool.end();
EOF

echo ""
log "Listo. Credenciales de acceso:"
echo -e "  ${BOLD}Usuario:${NC}     ${ADMIN_USER}"
echo -e "  ${BOLD}Contraseña:${NC}  ${ADMIN_PASS}"
echo -e "  ${BOLD}Email:${NC}       ${ADMIN_EMAIL}"
echo ""
warn "Cambia la contraseña desde el panel de administración tras el primer acceso."
