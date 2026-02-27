# DMS Taller Mecánico - Sistema Integral de Gestión

## Overview
DMS (Dealer Management System) for automotive repair shops, designed for the Canary Islands, complying with IGIC tax regulations. The system manages the entire service lifecycle: appointment scheduling, active reception, quotes, repair orders, inventory, invoicing, payments, CRM, waste management, and purchasing. Its goal is to optimize workshop operations, improve customer satisfaction, and ensure regulatory compliance.

## User Preferences
I want iterative development.
I prefer detailed explanations.
Ask before making major changes.

## Configuración de Despliegue en Producción

### 🔒 Variables de Entorno Requeridas
Cuando despliega a producción, debe configurar manualmente las siguientes variables de entorno en la configuración de despliegue:

**Variables Críticas:**
- `JWT_SECRET` - Secreto para firmar tokens JWT (generar string aleatorio 32+ caracteres)
- `SESSION_SECRET` - Secreto para sesiones (generar string aleatorio 32+ caracteres)
- `NODE_ENV=production` - Indica entorno de producción
- `DATABASE_URL` - URL de conexión a base de datos PostgreSQL de producción

**Variables Opcionales:**
- `CARAPI_TOKEN` - Token de CarAPI (si usa integración de datos vehiculares)
- `CARAPI_SECRET` - Secret de CarAPI (si usa integración de datos vehiculares)

### ⚙️ Configuración Técnica Implementada
- ✅ **Trust Proxy habilitado** (`app.set('trust proxy', 1)`) - CRÍTICO para autenticación en producción
- ✅ Sin esta configuración, las cookies y JWT fallan detrás del proxy reverso de Replit
- ✅ Sistema preparado para HTTPS/cookies seguras en producción

### 📝 Pasos para Desplegar
1. Click en **Deploy** (Publicar)
2. En configuración de despliegue, agregar todas las variables de entorno listadas arriba
3. Las variables de desarrollo NO se copian automáticamente - debe agregarlas manualmente
4. Generar secretos seguros (usar generador de contraseñas para JWT_SECRET y SESSION_SECRET)
5. Configurar DATABASE_URL apuntando a base de datos PostgreSQL de producción

## System Architecture
The system uses a modern full-stack architecture. The frontend is built with **React 18, TypeScript, Vite, Tailwind CSS (with shadcn/ui), React Query, Wouter, React Hook Form, Zod, date-fns, and Lucide React**. The backend is powered by **Node.js, Express, TypeScript, PostgreSQL (Neon), Drizzle ORM, JWT, bcrypt, and Zod**.

**UI/UX Decisions:**
- **Color Scheme**: "Professional Blue" (`217 91% 60%`) as primary, with Green for success, Amber for warnings, and Red for destructive actions.
- **Design Features**: Full dark mode, responsive design, elevation system, shadcn/ui components, collapsible sidebar, and Lucide React icons.
- **Project Structure**: `client/` (Frontend), `server/` (Backend), `shared/` (Shared types/schemas).

**Technical Implementations & Feature Specifications:**
- **Authentication & Roles**: JWT-based authentication with Role-Based Access Control (RBAC) (Admin, Workshop Manager, Reception, Mechanic, Warehouse, Finance).
- **Data Validation**: Zod for both frontend and backend.
- **State Management**: React Query for data fetching and caching.
- **Database**: PostgreSQL with Drizzle ORM.
- **Core Modules**:
    - **Dashboard**: Real-time KPIs, charts (monthly income bar chart, order status pie chart), low stock alert KPI, daily appointments, recent orders. Refetch every 30s.
    - **Customer & Vehicle Management**: Full CRUD for clients and vehicles. CarAPI integration for make/model autocomplete and VIN decoding with graceful fallback.
    - **Calendar & Appointments**: Visual calendar (monthly + weekly view with hourly slots), appointment duration field (30/60/90/120 min), quick "Crear OR" button for confirmed appointments.
    - **Repair Orders (OR)**: Full detail view with work parts (partes de trabajo), item consumptions (recambios), real-time economic totals (MO + parts + IGIC), status change buttons, "Crear Factura" when terminada. Quick "Crear Factura" button from order list. **Reception photos**: up to 5 photos per OR captured with tablet camera (getUserMedia API), stored as base64 in `fotosRecepcion` field — photos are per-OR (not per-vehicle) to maintain historical visit records.
    - **Quotes**: Creation with detailed line items (mano de obra, artículo, otros), real-time totals, buttons to create OR and Invoice from quote.
    - **Item Catalog**: Reference, stock, pricing, low stock alerts (badge + filter), minimum stock control.
    - **IGIC Invoicing**: Multiple invoice types, configurable IGIC rates. Printable invoice dialog with company branding. Auto-open with pre-filled data from OR→Factura workflow.
    - **Payments & Cash Register**: Multiple payment methods, cash reconciliation.
    - **Reports & Statistics**: `/informes` page with 4 tabs: Billing (bar chart, top clients), Orders (donut chart), Clients (KPIs), Inventory (low stock table).
    - **After-Sales CRM**: Automated campaigns, satisfaction surveys.
    - **Waste Management**: Compliance with Canary Islands regulations, cataloging (LER), container management, generation logging.
    - **Purchasing & Warehouse**: Full CRUD for suppliers, purchase orders, goods receipts, multi-warehouse location system.
    - **User Management**: Full CRUD for users with RBAC.
    - **Company Configuration**: Branding customization (logo, name, contact info) and CarAPI integration settings.
    - **Global Search**: Header search across clients, vehicles, and orders with debounce.
    - **CSV Export**: Export filtered data from Clients, Vehicles, Items, Invoices, and Orders.
    - **Pagination**: Client-side pagination (default 25 rows) on all major listing pages.

**System Design Choices**:
- Consistent CRUD pattern across main pages with pagination and CSV export.
- Optimized cache invalidation using stable queryKeys.
- Robust date handling by converting ISO strings to Date objects in the backend.
- API requests handle `204 No Content` gracefully.
- Password management in user editing allows optional updates.
- Drizzle decimal fields map to `string` in TypeScript — use parseFloat() for arithmetic.
- Sidebar auto-collapses on viewports < 1280px for tablet/mobile.
- Responsive tables with `overflow-x-auto` and hidden columns on small screens.

## External Dependencies
- **PostgreSQL (Neon)**: Main database.
- **JWT (JSON Web Tokens)**: Authentication.
- **bcrypt**: Password hashing.
- **Tailwind CSS**: Styling.
- **shadcn/ui**: UI components.
- **React Query (TanStack Query)**: Server state management.
- **Zod**: Data validation.
- **date-fns**: Date manipulation.
- **Lucide React**: Icons.
- **CarAPI**: Vehicle data (makes, models, VIN decoding), integrated with JWT caching and configurable via admin settings.
- **Landing Page**: Public landing page at `/` for unauthenticated users; authenticated users redirect to `/dashboard`.
- **ASD Logo**: `attached_assets/ASD_1772120752929.png` — used in the landing page footer.

## Deployment Scripts (Ubuntu Server)
Located in `scripts/` for unattended installation on Ubuntu 20.04/22.04/24.04:

- **`scripts/install.sh`** — Full unattended install: updates OS, installs Node.js 20, PostgreSQL, clones repo, creates DB, generates secrets, builds app, sets up PM2 + systemd autostart.
  - One-liner: `sudo bash -c "$(wget -qO- https://raw.githubusercontent.com/innovafpiesmmg/Auto-Taller-Pro/main/scripts/install.sh)"`
  - Configurable via env vars: `APP_DIR`, `APP_USER`, `APP_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
- **`scripts/update.sh`** — Pull latest from GitHub, rebuild, reload PM2 zero-downtime.
- **`scripts/backup-db.sh`** — pg_dump compressed to `/var/backups/autotaller/`, auto-rotates 7 days.
- **`scripts/restore-db.sh`** — Restore from `.sql.gz` file with confirmation prompt.
- **`scripts/setup-cloudflare.sh`** — Installs cloudflared, creates Cloudflare Tunnel, configures DNS, and registers as systemd service. Usage: `sudo bash setup-cloudflare.sh dominio.com`
- **`README.md`** — Full installation, configuration, and operations documentation in Spanish.