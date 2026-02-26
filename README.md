# DMS Auto-Taller Pro

Sistema integral de gestión para talleres de automoción, diseñado para las Islas Canarias con cumplimiento de la normativa IGIC. Desarrollado como herramienta educativa para el ciclo formativo de Mantenimiento de Vehículos (FP).

**Desarrollado por [Atreyu Servicios Digitales](https://asd.es)**

---

## Requisitos del servidor

| Componente | Versión mínima |
|---|---|
| Ubuntu | 20.04 LTS / 22.04 LTS / 24.04 LTS |
| Node.js | 20 LTS |
| PostgreSQL | 14+ |
| RAM | 1 GB (2 GB recomendado) |
| Disco | 5 GB libres |

> El script de instalación instala y configura Node.js y PostgreSQL automáticamente.

---

## Instalación rápida (desatendida)

Ejecutar como `root` o con `sudo` en el servidor Ubuntu:

```bash
sudo bash -c "$(wget -qO- https://raw.githubusercontent.com/innovafpiesmmg/Auto-Taller-Pro/main/scripts/install.sh)"
```

El script realiza **todo el proceso de forma automática**:

1. Actualiza el sistema operativo
2. Instala `git`, `curl`, `wget` y herramientas de compilación
3. Instala Node.js 20 LTS
4. Instala PM2 (gestor de procesos)
5. Instala PostgreSQL
6. Crea la base de datos y el usuario
7. Clona el repositorio desde GitHub
8. Genera el archivo `.env` con secretos aleatorios
9. Instala dependencias npm
10. Aplica las migraciones de base de datos (Drizzle)
11. Construye la aplicación (frontend + backend)
12. Inicia la aplicación con PM2 y configura el arranque automático
13. Configura el firewall (UFW)

Al finalizar, el script muestra un resumen con la URL de acceso y las credenciales generadas.

---

## Instalación manual paso a paso

Si prefieres controlar cada paso:

### 1. Preparar el sistema

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git ca-certificates gnupg build-essential
```

### 2. Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
node -v   # debe mostrar v20.x.x
```

### 3. Instalar PM2

```bash
sudo npm install -g pm2
```

### 4. Instalar PostgreSQL

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

### 5. Crear base de datos y usuario

```bash
sudo -u postgres psql <<EOF
CREATE USER autotaller_user WITH PASSWORD 'TU_CONTRASEÑA_SEGURA';
CREATE DATABASE autotaller_db OWNER autotaller_user;
GRANT ALL PRIVILEGES ON DATABASE autotaller_db TO autotaller_user;
\c autotaller_db
GRANT ALL ON SCHEMA public TO autotaller_user;
EOF
```

### 6. Clonar el repositorio

```bash
sudo git clone https://github.com/innovafpiesmmg/Auto-Taller-Pro.git /opt/autotaller
sudo chown -R $USER:$USER /opt/autotaller
cd /opt/autotaller
```

### 7. Configurar variables de entorno

```bash
cp .env.example .env   # si existe, o crear manualmente:
cat > /opt/autotaller/.env <<EOF
NODE_ENV=production
PORT=3000

DATABASE_URL=postgresql://autotaller_user:TU_CONTRASEÑA_SEGURA@localhost:5432/autotaller_db
PGHOST=localhost
PGPORT=5432
PGDATABASE=autotaller_db
PGUSER=autotaller_user
PGPASSWORD=TU_CONTRASEÑA_SEGURA

JWT_SECRET=$(openssl rand -base64 48)
SESSION_SECRET=$(openssl rand -base64 48)
EOF
chmod 600 /opt/autotaller/.env
```

### 8. Instalar dependencias y construir

```bash
cd /opt/autotaller
npm install
npx drizzle-kit push      # aplicar migraciones
npm run build             # compilar frontend y backend
```

### 9. Iniciar con PM2

```bash
cd /opt/autotaller
source .env
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u $USER --hp /opt/autotaller
# Ejecutar el comando que PM2 indica en la salida anterior
```

---

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `NODE_ENV` | Entorno (`production` / `development`) | Sí |
| `PORT` | Puerto HTTP de la aplicación (por defecto `3000`) | No |
| `DATABASE_URL` | URL completa de conexión PostgreSQL | Sí |
| `PGHOST` | Host de PostgreSQL | Sí |
| `PGPORT` | Puerto de PostgreSQL (por defecto `5432`) | No |
| `PGDATABASE` | Nombre de la base de datos | Sí |
| `PGUSER` | Usuario de PostgreSQL | Sí |
| `PGPASSWORD` | Contraseña de PostgreSQL | Sí |
| `JWT_SECRET` | Secreto para firmar tokens JWT (mín. 32 caracteres) | Sí |
| `SESSION_SECRET` | Secreto para sesiones (mín. 32 caracteres) | Sí |
| `CARAPI_TOKEN` | Token de CarAPI (datos de vehículos) | No |
| `CARAPI_SECRET` | Secret de CarAPI | No |

---

## Gestión de la aplicación

### Comandos PM2

```bash
pm2 status                        # Estado de todos los procesos
pm2 logs autotaller               # Ver logs en tiempo real
pm2 logs autotaller --lines 100   # Últimas 100 líneas de log
pm2 restart autotaller            # Reiniciar
pm2 stop autotaller               # Detener
pm2 start autotaller              # Iniciar
pm2 reload autotaller --update-env  # Recargar sin tiempo muerto
```

### Actualizar a la última versión

```bash
sudo bash /opt/autotaller/scripts/update.sh
```

El script de actualización:
1. Descarga los últimos cambios de GitHub
2. Actualiza las dependencias npm
3. Aplica nuevas migraciones de base de datos
4. Reconstruye la aplicación
5. Reinicia PM2 sin tiempo de inactividad

---

## Copias de seguridad

### Copia manual

```bash
sudo bash /opt/autotaller/scripts/backup-db.sh
```

Las copias se guardan en `/var/backups/autotaller/` comprimidas con gzip.

### Copia automática diaria (crontab)

```bash
sudo crontab -e
# Añadir la siguiente línea para hacer backup cada día a las 2:00 AM:
0 2 * * * /opt/autotaller/scripts/backup-db.sh >> /var/log/autotaller/backup.log 2>&1
```

### Restaurar una copia de seguridad

```bash
sudo bash /opt/autotaller/scripts/restore-db.sh /var/backups/autotaller/autotaller_20250101_020000.sql.gz
```

---

## Nginx como proxy inverso (recomendado)

Para servir la aplicación en el puerto 80/443 con SSL:

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Crear configuración de Nginx:

```bash
sudo cat > /etc/nginx/sites-available/autotaller <<'EOF'
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/autotaller /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Activar SSL con Let's Encrypt:

```bash
sudo certbot --nginx -d tu-dominio.com
```

---

## Cloudflare Tunnel (alternativa sin abrir puertos)

Cloudflare Tunnel expone la aplicación a través de la red de Cloudflare **sin necesidad de abrir puertos en el servidor ni configurar SSL manualmente**. Es la opción más sencilla si ya gestionas tu dominio en Cloudflare.

### Requisitos
- Dominio gestionado en Cloudflare (nube naranja activa)
- La aplicación instalada y corriendo (`pm2 status` debe mostrar `online`)

### Instalación con el script automático

```bash
sudo bash /opt/autotaller/scripts/setup-cloudflare.sh taller.midominio.com
```

El script realiza automáticamente:
1. Instala `cloudflared` desde el repositorio oficial de Cloudflare
2. Abre una URL de autenticación **(única acción manual: copiarla en el navegador)**
3. Crea el túnel y lo configura apuntando a `http://localhost:3000`
4. Crea el registro DNS CNAME en Cloudflare
5. Instala cloudflared como servicio systemd (arranca con el sistema)

### Comandos de gestión del túnel

```bash
systemctl status cloudflared          # Estado del túnel
journalctl -u cloudflared -f          # Logs en tiempo real
systemctl restart cloudflared         # Reiniciar
cloudflared tunnel list               # Ver todos los túneles
```

### Comparativa: Cloudflare Tunnel vs Nginx

| | Cloudflare Tunnel | Nginx + Certbot |
|---|---|---|
| Puertos abiertos en el servidor | Ninguno | 80 y 443 |
| SSL/HTTPS | Automático por Cloudflare | Let's Encrypt |
| Configuración | Script automático | Manual |
| Requiere dominio en Cloudflare | Sí | No |
| DDoS protection | Incluida | No |

---

## Estructura del proyecto

```
Auto-Taller-Pro/
├── client/                    # Frontend React + TypeScript + Vite
│   └── src/
│       ├── pages/             # Páginas de la aplicación
│       ├── components/        # Componentes reutilizables
│       └── lib/               # Utilidades y configuración
├── server/                    # Backend Node.js + Express
│   ├── index.ts               # Punto de entrada
│   ├── routes.ts              # Rutas API
│   ├── storage.ts             # Capa de acceso a datos
│   └── db.ts                  # Configuración Drizzle ORM
├── shared/
│   └── schema.ts              # Modelos de datos compartidos
├── scripts/
│   ├── install.sh             # Instalación desatendida
│   ├── update.sh              # Actualización
│   ├── backup-db.sh           # Copia de seguridad
│   └── restore-db.sh          # Restauración
├── ecosystem.config.cjs       # Configuración PM2 (generado por install.sh)
└── README.md                  # Este archivo
```

---

## Módulos del sistema

| Módulo | Ruta | Descripción |
|---|---|---|
| Dashboard | `/dashboard` | KPIs, gráficos, alertas de stock |
| Clientes | `/clientes` | Gestión de clientes (particular/empresa) |
| Vehículos | `/vehiculos` | Gestión de vehículos + integración CarAPI |
| Citas | `/citas` | Agenda con vista mensual y semanal |
| Órdenes de Reparación | `/ordenes` | Seguimiento completo de reparaciones |
| Presupuestos | `/presupuestos` | Creación y gestión de presupuestos |
| Artículos | `/articulos` | Inventario con alertas de stock mínimo |
| Facturas | `/facturas` | Facturación con IGIC (Canarias) |
| Cobros | `/cobros` | Registro de pagos y caja |
| Informes | `/informes` | Estadísticas y gráficos |
| Residuos | `/residuos` | Gestión de residuos (normativa canaria) |
| Proveedores | `/proveedores` | Gestión de proveedores |
| Compras | `/compras` | Pedidos de compra |
| Usuarios | `/usuarios` | Gestión de usuarios y roles |
| Configuración | `/configuracion` | Datos empresa + CarAPI |

---

## Roles de usuario

| Rol | Acceso |
|---|---|
| `admin` | Acceso completo + gestión de usuarios |
| `jefe_taller` | Todo excepto gestión de usuarios |
| `recepcion` | Citas, clientes, vehículos, órdenes, facturas |
| `mecanico` | Órdenes de reparación asignadas |
| `almacen` | Artículos, proveedores, compras |
| `finanzas` | Facturas, cobros, informes |

---

## Solución de problemas

### La aplicación no arranca

```bash
pm2 logs autotaller --lines 50   # Ver errores
cat /opt/autotaller/.env         # Verificar variables de entorno
```

### Error de conexión a la base de datos

```bash
# Verificar que PostgreSQL está activo
sudo systemctl status postgresql

# Probar conexión manualmente
psql -h localhost -U autotaller_user -d autotaller_db -c "SELECT 1;"
```

### Aplicar migraciones manualmente

```bash
cd /opt/autotaller
source .env
npx drizzle-kit push
```

### Ver logs del sistema

```bash
tail -f /var/log/autotaller/out.log   # Logs de salida
tail -f /var/log/autotaller/err.log   # Logs de errores
```

---

## Licencia

Software de uso educativo desarrollado para el IES Manuel Martín González  
Departamento de Administración de Empresas — Ciclo FP Mantenimiento de Vehículos

**Desarrollado por Atreyu Servicios Digitales**
