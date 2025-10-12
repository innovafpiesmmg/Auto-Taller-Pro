# DMS Taller Mecánico - Sistema Integral de Gestión

## Visión General
Sistema DMS (Dealer Management System) completo para talleres mecánicos de automoción, diseñado específicamente para Canarias con cumplimiento IGIC. El sistema cubre todo el ciclo de vida del servicio: gestión de citas, recepción activa, presupuestos, órdenes de reparación, almacén, facturación y cobros.

## Características Principales

### Módulos Implementados (MVP)
1. **Dashboard**: Vista general con KPIs en tiempo real
   - OR abiertas
   - Citas del día
   - Ingresos del día
   - Ocupación del taller
   - Estadísticas de clientes y vehículos

2. **Gestión de Clientes**
   - Registro de clientes particulares y empresas
   - Búsqueda por NIF, nombre, email, teléfono
   - Gestión de datos RGPD

3. **Gestión de Vehículos**
   - Registro completo (matrícula, VIN, marca, modelo)
   - Vinculación con clientes
   - Historial de kilómetros e ITV

4. **Agenda & Citas**
   - Calendario mensual visual
   - Gestión de estados (pendiente, confirmada, en curso, completada, cancelada)
   - Vinculación con vehículos y clientes

5. **Órdenes de Reparación (OR)**
   - Estados: Abierta → En curso → A la espera → Terminada → Facturada
   - Partes de trabajo
   - Consumo de artículos
   - Checklist de recepción
   - Firma digital

6. **Presupuestos**
   - Creación con líneas de MO y artículos
   - Aprobación/rechazo
   - Cálculo automático de IGIC
   - Vinculación con OR

7. **Catálogo de Artículos**
   - Gestión de referencias y stock
   - Precio coste y venta
   - Control de stock mínimo
   - Categorización

8. **Facturación IGIC**
   - Tipos: Simplificada, Ordinaria, Rectificativa
   - IGIC configurable por línea (0%, 3%, 7%, 9.5%, 15%)
   - Series por sede
   - Líneas de factura detalladas

9. **Cobros & Caja**
   - Métodos: Efectivo, Tarjeta, Transferencia, Bizum
   - Arqueo de caja
   - Vinculación con facturas

### Autenticación y Roles
- Sistema JWT con roles: Admin, Jefe Taller, Recepción, Mecánico, Almacén, Finanzas
- Usuario demo: `admin` / `admin123`

## Stack Tecnológico

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Query (TanStack Query v5)
- Wouter (routing)
- React Hook Form + Zod (validación)
- date-fns (manejo de fechas)
- Lucide React (iconos)

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (Neon)
- Drizzle ORM
- JWT (autenticación)
- bcrypt (hashing)
- Zod (validación)

## Estructura del Proyecto

```
├── client/                 # Frontend
│   ├── src/
│   │   ├── components/    # Componentes UI
│   │   │   ├── ui/       # shadcn components
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── pages/        # Páginas de la aplicación
│   │   ├── lib/          # Utilidades
│   │   │   ├── auth.tsx  # Context de autenticación
│   │   │   ├── api.ts    # Cliente API
│   │   │   └── queryClient.ts
│   │   └── App.tsx
│   └── index.html
├── server/                # Backend
│   ├── db.ts            # Configuración DB
│   ├── storage.ts       # Capa de datos
│   ├── routes.ts        # Rutas API
│   ├── seed.ts          # Seed de datos
│   └── index.ts
├── shared/               # Tipos compartidos
│   └── schema.ts        # Esquemas Drizzle + Zod
└── design_guidelines.md  # Guías de diseño
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login (retorna JWT)

### Clientes
- `GET /api/clientes?search=` - Listar/buscar clientes
- `GET /api/clientes/:id` - Obtener cliente
- `POST /api/clientes` - Crear cliente
- `PUT /api/clientes/:id` - Actualizar cliente

### Vehículos
- `GET /api/vehiculos?search=&clienteId=` - Listar/buscar vehículos
- `GET /api/vehiculos/:id` - Obtener vehículo
- `POST /api/vehiculos` - Crear vehículo
- `PUT /api/vehiculos/:id` - Actualizar vehículo

### Citas
- `GET /api/citas?from=&to=` - Listar citas
- `GET /api/citas/:id` - Obtener cita
- `POST /api/citas` - Crear cita
- `PUT /api/citas/:id` - Actualizar cita

### Órdenes de Reparación
- `GET /api/ordenes?estado=` - Listar OR
- `GET /api/ordenes/:id` - Obtener OR
- `POST /api/ordenes` - Crear OR
- `PUT /api/ordenes/:id` - Actualizar OR
- `GET /api/ordenes/:orId/partes` - Obtener partes de trabajo
- `POST /api/ordenes/:orId/partes` - Crear parte de trabajo
- `GET /api/ordenes/:orId/consumos` - Obtener consumos
- `POST /api/ordenes/:orId/consumos` - Crear consumo

### Artículos
- `GET /api/articulos?search=` - Listar/buscar artículos
- `GET /api/articulos/:id` - Obtener artículo
- `POST /api/articulos` - Crear artículo
- `PUT /api/articulos/:id` - Actualizar artículo

### Presupuestos
- `GET /api/presupuestos` - Listar presupuestos
- `GET /api/presupuestos/:id` - Obtener presupuesto
- `POST /api/presupuestos` - Crear presupuesto
- `POST /api/presupuestos/:id/aprobar` - Aprobar presupuesto

### Facturas
- `GET /api/facturas` - Listar facturas
- `GET /api/facturas/:id` - Obtener factura con líneas
- `POST /api/facturas` - Crear factura

### Cobros
- `GET /api/cobros?facturaId=` - Listar cobros
- `POST /api/cobros` - Registrar cobro

### Dashboard
- `GET /api/stats/dashboard` - Estadísticas del dashboard

## Base de Datos

### Tablas Principales
- `users` - Usuarios del sistema
- `clientes` - Clientes del taller
- `vehiculos` - Vehículos de clientes
- `citas` - Citas programadas
- `ordenes_reparacion` - Órdenes de reparación
- `partes_trabajo` - Partes de trabajo de OR
- `articulos` - Catálogo de artículos/recambios
- `consumos_articulos` - Consumos de artículos en OR
- `presupuestos` - Presupuestos
- `facturas` - Facturas
- `lineas_factura` - Líneas de factura
- `cobros` - Cobros/pagos

### Comandos DB
```bash
npm run db:push          # Sincronizar esquema con DB
npx tsx server/seed.ts   # Poblar datos iniciales
```

## Diseño y UI

### Sistema de Colores (Professional Blue)
- **Primary**: `217 91% 60%` - Azul profesional (confianza, confiabilidad)
- **Success**: `142 76% 36%` - Verde (terminada, aprobaciones)
- **Warning**: `38 92% 50%` - Ámbar (a la espera, stock bajo)
- **Destructive**: `0 84% 60%` - Rojo (errores, cancelaciones)

### Características de Diseño
- Dark mode completo
- Responsive (desktop, tablet, mobile)
- Sistema de elevación para interacciones (hover-elevate, active-elevate-2)
- Componentes shadcn/ui
- Sidebar collapsible
- Iconos Lucide React

## Próximas Fases

### Fase 2 - Almacén y Compras
- Pedidos a proveedores
- Recepciones
- Inventario cíclico
- Ubicaciones multialmacén

### Fase 3 - CRM Avanzado
- Campañas automáticas (ITV, revisiones)
- NPS/CSAT post servicio
- Cupones y promociones

### Fase 4 - Integraciones
- TPV Redsys
- Remesas SEPA (XML CSB19.14)
- WhatsApp Business (confirmaciones)
- Exportación contable

### Fase 5 - Analítica BI
- Informes de margen por OR
- Rotación de stock
- Productividad por técnico
- Export a Power BI/Excel

## Comandos Útiles

```bash
npm run dev              # Desarrollo
npm run build            # Build producción
npm run start            # Iniciar producción
npm run check            # Verificar tipos
npm run db:push          # Migrar DB
npx tsx server/seed.ts   # Seed DB
```

## Datos de Prueba
- Usuario: `admin`
- Contraseña: `admin123`
- Cliente demo: Juan García Pérez (NIF: 12345678A)
- Vehículo demo: Toyota Corolla 1.8 Hybrid (1234ABC)

## Notas de Desarrollo
- Autenticación JWT con roles
- Validación Zod en frontend y backend
- React Query para data fetching
- Estados de carga con Skeleton
- Manejo de errores con toast notifications
- Database storage con Drizzle ORM
- Responsive design mobile-first
