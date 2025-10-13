# DMS Taller Mecánico - Sistema Integral de Gestión

## Overview
DMS (Dealer Management System) for automotive repair shops, specifically designed for the Canary Islands, complying with IGIC tax regulations. The system manages the entire service lifecycle: appointment scheduling, active reception, quotes, repair orders, inventory, invoicing, payments, CRM, waste management, and purchasing. Its goal is to optimize workshop operations, improve customer satisfaction, and ensure regulatory compliance.

## User Preferences
I want iterative development.
I prefer detailed explanations.
Ask before making major changes.

## Recent Changes (Latest)
### 2025-10-13: Dashboard con Actualización en Tiempo Real
- ✅ Dashboard se actualiza automáticamente cada 5 segundos
- ✅ Agregado tipo TypeScript `DashboardStats` para type safety
- ✅ Implementado `refetchInterval: 5000` en React Query
- ✅ Test e2e confirmó múltiples GET requests periódicas sin interacción del usuario
- ✅ Estadísticas en tiempo real: OR Abiertas, Citas Hoy, Ingresos Hoy, Ocupación, Total Clientes, Total Vehículos

### 2025-10-13: Módulo de Gestión de Usuarios COMPLETADO
- ✅ **9º Módulo Completado**: Gestión de Usuarios con CRUD completo
- ✅ Backend:
  - GET /api/users (solo admin): Lista todos los usuarios sin contraseñas
  - PUT /api/users/:id (solo admin): Actualiza usuario, hashea contraseña si se proporciona
  - DELETE /api/users/:id (solo admin): Elimina usuario (204 No Content)
  - Métodos en storage: getUsers(), updateUser(), deleteUser()
- ✅ Frontend (client/src/pages/usuarios.tsx):
  - Dialog con React Hook Form + Zod validation (editUserSchema con password opcional)
  - Creación: Password requerido (validado en createMutation)
  - Edición: Password opcional (se envía solo si se proporciona)
  - Mutations: create (/api/auth/register), update, delete con cache invalidation
  - Búsqueda por username, email, nombre
  - Badges de rol con colores (admin, jefe_taller, recepcion, mecanico, almacen, finanzas)
  - data-testid completos, toast notifications, AlertDialog
- ✅ Navegación: Ruta /usuarios + nueva sección "Configuración" en sidebar
- ✅ Seguridad: Solo admin puede gestionar usuarios (RBAC), contraseñas hasheadas
- ✅ Testing arquitectónico completado y aprobado

### 2025-10-13: 8 Páginas Principales con CRUD COMPLETADO
- ✅ Implementado CRUD completo para 8 páginas principales: Clientes, Vehículos, Citas, Artículos, Órdenes de Reparación, Presupuestos, Facturas, Cobros
- ✅ Patrón consistente aplicado en todas las páginas:
  - Dialog con React Hook Form + Zod validation (insertSchema desde shared/schema.ts)
  - Mutations (create, update, delete) con React Query
  - Toast notifications para éxito/error
  - AlertDialog para confirmación de DELETE
  - Cache invalidation optimizado (queryKey sin filtros, filtrado en cliente)
  - data-testid completos en TODOS los elementos interactivos
- ✅ Corregido bug crítico de FK: valores por defecto cambiados de 0 a undefined, agregada validación Zod con .min(1)
- ✅ Backend completado: agregados 8 DELETE endpoints (devuelven 204 No Content) y métodos delete* en storage
- ✅ Testing arquitectónico completo y aprobado
- ✅ UX profesional con validación de campos requeridos y mensajes de error claros en español

### 2025-10-12: Módulo Compras & Almacén COMPLETADO
- ✅ Implementado CRUD completo para 4 páginas: Proveedores, Pedidos de Compra, Recepciones, Ubicaciones
- ✅ Corregidos 4 bugs críticos:
  - Agregados endpoints DELETE faltantes (devuelven 204 No Content)
  - apiRequest ahora maneja 204 correctamente sin parsear JSON
  - Backend convierte fechas ISO string a Date en POST/PUT
  - Cache invalidation corregido (removidos filtros de queryKey, filtrado movido al cliente)
- ✅ Testing e2e completo verificado por arquitecto
- ✅ UX optimizada con toasts, confirmaciones AlertDialog, y data-testid completos

## System Architecture
The system uses a modern full-stack architecture. The frontend is built with **React 18, TypeScript, Vite, Tailwind CSS (with shadcn/ui), React Query, Wouter, React Hook Form, Zod, date-fns, and Lucide React**. The backend is powered by **Node.js, Express, TypeScript, PostgreSQL (Neon), Drizzle ORM, JWT, bcrypt, and Zod**.

**UI/UX Decisions:**
- **Color Scheme**: "Professional Blue" (`217 91% 60%`) is used as the primary color, conveying trust and reliability. Other semantic colors include Green for success, Amber for warnings, and Red for destructive actions.
- **Design Features**: Full dark mode, responsive design (desktop, tablet, mobile), elevation system for interactions, shadcn/ui components, collapsible sidebar, and Lucide React icons.
- **Project Structure**:
    - `client/`: Frontend application.
    - `server/`: Backend application, including DB configuration, data layer, API routes, and seeding.
    - `shared/`: Shared TypeScript types and Zod schemas.
    - `design_guidelines.md`: Design documentation.

**Technical Implementations & Feature Specifications:**
- **Authentication & Roles**: JWT-based authentication with Role-Based Access Control (RBAC). Roles include Admin, Workshop Manager, Reception, Mechanic, Warehouse, and Finance.
- **Data Validation**: Zod is used for validation on both frontend and backend.
- **State Management**: React Query for efficient data fetching and caching.
- **Database**: PostgreSQL with Drizzle ORM for type-safe schema definition and querying.
- **Core Modules**:
    - **Dashboard**: Real-time KPIs (open ORs, daily appointments/income, workshop occupancy, customer/vehicle stats).
    - **Customer & Vehicle Management**: Full CRUD for clients (individual/company, RGPD compliance) and vehicles (plate, VIN, history).
    - **Calendar & Appointments**: Visual calendar with status management.
    - **Repair Orders (OR)**: Lifecycle management (Open to Invoiced), work parts, item consumption, reception checklist, digital signature.
    - **Quotes**: Creation with labor and item lines, approval flow, automatic IGIC calculation.
    - **Item Catalog**: Reference, stock, cost/sale price, minimum stock control, categorization.
    - **IGIC Invoicing**: Multiple invoice types (Simplified, Ordinary, Rectifying), configurable IGIC rates per line, series by location.
    - **Payments & Cash Register**: Multiple payment methods, cash reconciliation, invoice linking.
    - **After-Sales CRM**: Automated campaigns (ITV, reviews, birthdays), satisfaction surveys (NPS/CSAT), coupon system.
    - **Waste Management**: Compliance with Ley 22/2011 + Canary Islands regulations, cataloging (LER), container management, authorized waste managers (NIMA), generation logging linked to OR, Identification Documents (DI), collection tracking.
    - **Purchasing & Warehouse (COMPLETED)**: Full CRUD for suppliers, purchase orders (with status tracking), goods receipts with lines, multi-warehouse location system. Cache invalidation optimized, date handling corrected, DELETE endpoints implemented.

**API Endpoints**: A comprehensive set of RESTful API endpoints for all modules, protected by JWT and RBAC.

## External Dependencies
- **PostgreSQL (Neon)**: Main database.
- **JWT (JSON Web Tokens)**: For authentication.
- **bcrypt**: For password hashing.
- **Tailwind CSS**: For styling and utility classes.
- **shadcn/ui**: UI component library.
- **React Query (TanStack Query)**: For server state management.
- **Zod**: For data validation.
- **date-fns**: For date manipulation.
- **Lucide React**: For icons.

## Known Technical Patterns & Fixes
### apiRequest Pattern (client/src/lib/queryClient.ts)
```typescript
// Handles 204 No Content without attempting JSON parsing
if (res.status === 204 || res.headers.get("content-length") === "0") {
  return undefined;
}
return await res.json();
```

### Date Handling Pattern (server/routes.ts)
```typescript
// Convert ISO string dates to Date objects before validation
const data = { ...req.body };
if (data.fecha && typeof data.fecha === 'string') {
  data.fecha = new Date(data.fecha);
}
const validated = insertSchema.parse(data);
```

### Cache Invalidation Pattern
- Use stable queryKeys without filters: `["/api/resource"]`
- Apply filters on the client side after data fetch
- This ensures proper cache invalidation after mutations

### Password Editing Pattern (Usuarios)
```typescript
// Schema para editar (password opcional)
const editUserSchema = insertUserSchema.extend({
  password: z.string().optional().or(z.literal("")),
});

// Form usa editUserSchema para permitir password vacío
const form = useForm<FormValues>({
  resolver: zodResolver(editUserSchema),
});

// createMutation valida que password esté presente
mutationFn: async (data: FormValues) => {
  if (!data.password) {
    throw new Error("La contraseña es requerida");
  }
  return await apiRequest(...);
}

// updateMutation elimina password si está vacío (no cambiar)
mutationFn: async (data: FormValues) => {
  const payload = { ...data };
  if (!payload.password) delete payload.password;
  return await apiRequest(...);
}
```
