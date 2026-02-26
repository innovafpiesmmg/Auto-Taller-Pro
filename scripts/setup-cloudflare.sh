#!/usr/bin/env bash
# =============================================================================
# DMS Auto-Taller Pro — Configuración de Cloudflare Tunnel (cloudflared)
# Expone la aplicación a través de Cloudflare sin abrir puertos ni SSL manual.
#
# Uso:
#   sudo bash /opt/autotaller/scripts/setup-cloudflare.sh [tu-dominio.com]
#
# Requisitos previos:
#   - La aplicación ya instalada y corriendo (install.sh ejecutado)
#   - Un dominio gestionado en Cloudflare
#   - Acceso a un navegador para autenticar una sola vez con Cloudflare
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✔]${NC} $*"; }
info() { echo -e "${CYAN}[→]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*" >&2; exit 1; }
step() { echo -e "\n${BOLD}── Paso $* ──────────────────────────────────────${NC}"; }

[[ $EUID -ne 0 ]] && err "Ejecuta como root: sudo bash setup-cloudflare.sh [dominio]"

APP_DIR="${APP_DIR:-/opt/autotaller}"
APP_USER="${APP_USER:-autotaller}"
APP_PORT="${APP_PORT:-3000}"
TUNNEL_NAME="${TUNNEL_NAME:-autotaller}"
DOMAIN="${1:-}"

# Leer el puerto del .env si existe
ENV_FILE="${APP_DIR}/.env"
if [[ -f "${ENV_FILE}" ]]; then
  APP_PORT_ENV=$(grep '^PORT=' "${ENV_FILE}" | cut -d= -f2 | tr -d ' ' || true)
  [[ -n "${APP_PORT_ENV}" ]] && APP_PORT="${APP_PORT_ENV}"
fi

echo -e "\n${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   DMS Auto-Taller Pro  —  Cloudflare Tunnel Setup        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}\n"

# ── Pedir dominio si no se pasó como argumento ─────────────────────────────
if [[ -z "${DOMAIN}" ]]; then
  read -rp "  Introduce tu dominio (ej: taller.miempresa.com): " DOMAIN
fi
[[ -z "${DOMAIN}" ]] && err "Debes indicar un dominio."

# ── Verificar que la aplicación está corriendo ────────────────────────────
if ! curl -s --max-time 3 "http://localhost:${APP_PORT}" > /dev/null 2>&1; then
  warn "La aplicación no responde en el puerto ${APP_PORT}."
  warn "Asegúrate de que PM2 la tiene activa: pm2 status"
  warn "Continuando igualmente con la configuración del túnel..."
fi

# ── 1. Instalar cloudflared ───────────────────────────────────────────────
step "1: Instalar cloudflared"

if command -v cloudflared &>/dev/null; then
  log "cloudflared ya instalado: $(cloudflared --version 2>&1 | head -1)"
else
  info "Descargando cloudflared desde Cloudflare..."
  ARCH=$(dpkg --print-architecture)
  case "${ARCH}" in
    amd64)   CF_ARCH="amd64" ;;
    arm64)   CF_ARCH="arm64" ;;
    armhf)   CF_ARCH="arm" ;;
    *)       err "Arquitectura no soportada: ${ARCH}" ;;
  esac

  # Repositorio oficial de Cloudflare
  mkdir -p /usr/share/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
    | gpg --dearmor > /usr/share/keyrings/cloudflare-main.gpg

  echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
    > /etc/apt/sources.list.d/cloudflared.list

  apt-get update -qq
  apt-get install -y -qq cloudflared
  log "cloudflared $(cloudflared --version 2>&1 | head -1) instalado."
fi

# ── 2. Autenticación con Cloudflare ──────────────────────────────────────
step "2: Autenticación con Cloudflare (acción manual requerida)"

CF_CONFIG_DIR="/home/${APP_USER}/.cloudflared"
CERT_FILE="${CF_CONFIG_DIR}/cert.pem"

if [[ -f "${CERT_FILE}" ]]; then
  log "Ya autenticado (cert.pem encontrado)."
else
  echo ""
  echo -e "${YELLOW}  ┌─────────────────────────────────────────────────────┐${NC}"
  echo -e "${YELLOW}  │  ACCIÓN REQUERIDA: Autenticación en Cloudflare      │${NC}"
  echo -e "${YELLOW}  │                                                     │${NC}"
  echo -e "${YELLOW}  │  Se abrirá una URL. Cópiala en tu navegador y       │${NC}"
  echo -e "${YELLOW}  │  autoriza el acceso a tu cuenta de Cloudflare.      │${NC}"
  echo -e "${YELLOW}  │  Solo necesitas hacerlo una vez.                    │${NC}"
  echo -e "${YELLOW}  └─────────────────────────────────────────────────────┘${NC}"
  echo ""

  sudo -u "${APP_USER}" cloudflared tunnel login
  log "Autenticación completada."
fi

# ── 3. Crear el túnel ─────────────────────────────────────────────────────
step "3: Crear túnel '${TUNNEL_NAME}'"

# Comprobar si el túnel ya existe
TUNNEL_ID=$(sudo -u "${APP_USER}" cloudflared tunnel list --output json 2>/dev/null \
  | grep -o '"id":"[^"]*"' | grep -A1 "\"name\":\"${TUNNEL_NAME}\"" | head -1 \
  | cut -d'"' -f4 || true)

if [[ -z "${TUNNEL_ID}" ]]; then
  TUNNEL_ID=$(sudo -u "${APP_USER}" cloudflared tunnel create "${TUNNEL_NAME}" 2>&1 \
    | grep -oP '(?<=Created tunnel )\S+' || true)
  # Alternativa si el anterior no captura el ID
  if [[ -z "${TUNNEL_ID}" ]]; then
    TUNNEL_ID=$(sudo -u "${APP_USER}" cloudflared tunnel list --output json 2>/dev/null \
      | python3 -c "import sys,json; t=[x for x in json.load(sys.stdin) if x['name']=='${TUNNEL_NAME}']; print(t[0]['id'] if t else '')" 2>/dev/null || true)
  fi
  log "Túnel '${TUNNEL_NAME}' creado."
else
  log "Túnel '${TUNNEL_NAME}' ya existe (ID: ${TUNNEL_ID:0:8}...)."
fi

[[ -z "${TUNNEL_ID}" ]] && err "No se pudo obtener el ID del túnel. Ejecuta: sudo -u ${APP_USER} cloudflared tunnel list"

# ── 4. Crear archivo de configuración ─────────────────────────────────────
step "4: Configurar el túnel"

mkdir -p "${CF_CONFIG_DIR}"
CF_CONFIG="${CF_CONFIG_DIR}/config.yml"

cat > "${CF_CONFIG}" <<EOF
# Cloudflare Tunnel — DMS Auto-Taller Pro
# Generado automáticamente por setup-cloudflare.sh

tunnel: ${TUNNEL_ID}
credentials-file: ${CF_CONFIG_DIR}/${TUNNEL_ID}.json

ingress:
  - hostname: ${DOMAIN}
    service: http://localhost:${APP_PORT}
  - service: http_status:404
EOF

chown -R "${APP_USER}:${APP_USER}" "${CF_CONFIG_DIR}"
log "Configuración guardada en ${CF_CONFIG}"

# ── 5. Crear ruta DNS en Cloudflare ──────────────────────────────────────
step "5: Crear registro DNS en Cloudflare"

sudo -u "${APP_USER}" cloudflared tunnel route dns "${TUNNEL_NAME}" "${DOMAIN}" 2>&1 || \
  warn "No se pudo crear el registro DNS automáticamente. Créalo manualmente en el panel de Cloudflare."

log "Registro CNAME '${DOMAIN}' → '${TUNNEL_ID}.cfargotunnel.com' configurado."

# ── 6. Instalar cloudflared como servicio systemd ─────────────────────────
step "6: Instalar como servicio del sistema"

# Copiar la config al directorio del sistema
mkdir -p /etc/cloudflared
cp "${CF_CONFIG}" /etc/cloudflared/config.yml
# Copiar credenciales
cp "${CF_CONFIG_DIR}/${TUNNEL_ID}.json" /etc/cloudflared/ 2>/dev/null || true

# Actualizar config.yml del sistema con rutas absolutas
cat > /etc/cloudflared/config.yml <<EOF
# Cloudflare Tunnel — DMS Auto-Taller Pro
tunnel: ${TUNNEL_ID}
credentials-file: /etc/cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: ${DOMAIN}
    service: http://localhost:${APP_PORT}
  - service: http_status:404
EOF

cloudflared service install 2>/dev/null || true
systemctl enable --now cloudflared
log "Servicio cloudflared activo y configurado para arrancar con el sistema."

# ── 7. Arrancar el túnel ──────────────────────────────────────────────────
step "7: Verificar conexión"

sleep 3
if systemctl is-active --quiet cloudflared; then
  log "Túnel activo."
else
  warn "El servicio cloudflared no arrancó. Intentando arranque manual..."
  systemctl restart cloudflared || true
  sleep 2
fi

# ── Resumen ───────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║     Cloudflare Tunnel configurado con éxito              ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}URL pública:${NC}   https://${DOMAIN}"
echo -e "  ${BOLD}Túnel:${NC}         ${TUNNEL_NAME} (${TUNNEL_ID:0:8}...)"
echo -e "  ${BOLD}App local:${NC}     http://localhost:${APP_PORT}"
echo -e "  ${BOLD}Config:${NC}        /etc/cloudflared/config.yml"
echo ""
echo -e "  ${BOLD}Comandos útiles:${NC}"
echo -e "  systemctl status cloudflared       — Estado del túnel"
echo -e "  journalctl -u cloudflared -f       — Logs del túnel en tiempo real"
echo -e "  cloudflared tunnel list            — Ver todos los túneles"
echo ""
warn "Asegúrate de que el dominio '${DOMAIN}' está en Cloudflare con el proxy activo (nube naranja)."
warn "Puede tardar 1-2 minutos en propagar."
echo ""
