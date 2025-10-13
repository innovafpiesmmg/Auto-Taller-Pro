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
    - **Dashboard**: Real-time KPIs, daily appointments, recent orders.
    - **Customer & Vehicle Management**: Full CRUD for clients and vehicles, including DGT environmental label calculation (basic).
    - **Calendar & Appointments**: Visual calendar with status management.
    - **Repair Orders (OR)**: Lifecycle management, work parts, item consumption, digital signature.
    - **Quotes**: Creation with labor and item lines, approval, IGIC calculation.
    - **Item Catalog**: Reference, stock, pricing, minimum stock control.
    - **IGIC Invoicing**: Multiple invoice types, configurable IGIC rates.
    - **Payments & Cash Register**: Multiple payment methods, cash reconciliation.
    - **After-Sales CRM**: Automated campaigns, satisfaction surveys.
    - **Waste Management**: Compliance with Canary Islands regulations, cataloging (LER), container management, generation logging.
    - **Purchasing & Warehouse**: Full CRUD for suppliers, purchase orders, goods receipts, multi-warehouse location system.
    - **User Management**: Full CRUD for users with RBAC.
    - **Company Configuration**: Branding customization (logo, name, contact info) and CarAPI integration settings.

**System Design Choices**:
- Consistent CRUD pattern across 8 main pages (Clients, Vehicles, Appointments, Items, Repair Orders, Quotes, Invoices, Payments).
- Optimized cache invalidation using stable queryKeys.
- Robust date handling by converting ISO strings to Date objects in the backend.
- API requests handle `204 No Content` gracefully.
- Password management in user editing allows optional updates.

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