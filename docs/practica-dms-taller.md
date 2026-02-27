# Práctica: Sistema DMS para Taller Mecánico

**Módulo**: Desarrollo de Aplicaciones Web  
**Nivel**: Ciclo Superior DAW / DAM  
**Duración estimada**: 80-100 horas  
**Modalidad**: Individual o parejas  

---

## Descripción del proyecto

Desarrollar un **Sistema de Gestión para Taller Mecánico** (DMS — Dealer Management System) completo, diseñado para el entorno de las Islas Canarias, cumpliendo con la normativa fiscal IGIC. El sistema cubre el ciclo de vida completo del servicio: desde la cita del cliente hasta la facturación y el cobro.

El producto final debe ser una aplicación web moderna, adaptada para uso en **tablet**, con panel de control en tiempo real, gestión de clientes y vehículos, órdenes de reparación, presupuestos, facturación, inventario y módulos de cumplimiento normativo.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS + shadcn/ui |
| Estado servidor | TanStack Query (React Query v5) |
| Enrutamiento | Wouter |
| Formularios | React Hook Form + Zod |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL (Neon) |
| ORM | Drizzle ORM |
| Autenticación | JWT + bcrypt |
| Fechas | date-fns |
| Gráficos | Recharts |
| Iconos | Lucide React |

---

## Estructura de carpetas del proyecto

```
/
├── client/                  # Frontend React
│   └── src/
│       ├── components/      # Componentes reutilizables
│       │   └── ui/          # Componentes shadcn/ui
│       ├── pages/           # Una página por ruta
│       ├── lib/             # Utilidades (auth, queryClient, etc.)
│       └── hooks/           # Custom hooks
├── server/                  # Backend Express
│   ├── index.ts             # Punto de entrada
│   ├── routes.ts            # Todos los endpoints API
│   ├── storage.ts           # Capa de acceso a datos
│   ├── db.ts                # Conexión a PostgreSQL
│   └── auth.ts              # Middleware JWT
├── shared/
│   └── schema.ts            # Tipos y esquemas compartidos (Drizzle + Zod)
└── drizzle.config.ts        # Configuración de migraciones
```

---

## Modelo de datos (schema.ts)

Antes de escribir ningún código de frontend ni backend, **siempre** se define el modelo de datos completo en `shared/schema.ts`. Esto garantiza coherencia entre ambas capas.

### Tablas principales

```
usuarios           → id, nombre, email, passwordHash, rol
clientes           → id, tipo, nombre, apellidos, razonSocial, nif, email, movil
vehiculos          → id, clienteId, matricula, marca, modelo, año, vin, combustible, km
citas              → id, clienteId, vehiculoId, fechaHora, duracion, estado, motivo
ordenesReparacion  → id, codigo, clienteId, vehiculoId, estado, fechaApertura, kmEntrada, fotosRecepcion
partesTrabajo      → id, ordenId, descripcion, mecanicoId, tiempoEstimado, precioMO
consumosArticulos  → id, ordenId, articuloId, cantidad, precioUnitario, igic
articulos          → id, referencia, descripcion, stock, stockMinimo, precioCoste, precioVenta
facturas           → id, clienteId, serie, numero, fecha, total, estado
lineasFactura      → id, facturaId, concepto, baseImponible, igicPct, totalIgic
cobros             → id, facturaId, metodo, monto, fecha
presupuestos       → id, clienteId, vehiculoId, estado, total, lineas
proveedores        → id, nombre, cif, email, telefono
pedidosCompra      → id, proveedorId, estado, fechaPedido
configEmpresa      → id, nombreEmpresa, cifNif, logoUrl, colorPrimario
```

### Patrón para cada tabla

```typescript
// 1. Tabla Drizzle
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  // ...
});

// 2. Schema de inserción (excluye id y campos auto-generados)
export const insertClienteSchema = createInsertSchema(clientes).omit({ id: true });

// 3. Tipos TypeScript
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientes.$inferSelect;
```

---

## Roles de usuario (RBAC)

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `admin` | Administrador | Todo |
| `jefe_taller` | Jefe de taller | Todo excepto config de usuarios |
| `recepcion` | Recepcionista | Citas, clientes, vehículos, OR |
| `mecanico` | Mecánico | OR, partes de trabajo |
| `almacen` | Almacén | Artículos, pedidos, recepciones |
| `finanzas` | Finanzas | Facturas, cobros, informes |

---

## Flujo de trabajo por fases

---

### Fase 0 — Configuración del entorno
**Duración: 2-3 horas**

#### Objetivos
- Tener el proyecto ejecutándose en local
- Entender la estructura del proyecto
- Conectar la base de datos

#### Pasos

1. Clonar el repositorio e instalar dependencias:
   ```bash
   npm install
   ```

2. Crear el archivo `.env` con las variables necesarias:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=un_secreto_seguro_aqui
   SESSION_SECRET=otro_secreto_aqui
   NODE_ENV=development
   ```

3. Aplicar el esquema a la base de datos:
   ```bash
   npm run db:push
   ```

4. Arrancar el proyecto:
   ```bash
   npm run dev
   ```

5. Acceder a `http://localhost:5000` y comprobar que carga la landing page.

#### Conceptos a repasar
- Variables de entorno y seguridad de credenciales
- ORM y migraciones de base de datos
- Diferencia entre entorno de desarrollo y producción

---

### Fase 1 — Autenticación y estructura base
**Duración: 6-8 horas**

#### Objetivos
- Implementar login/logout con JWT
- Proteger rutas del backend con middleware
- Proteger rutas del frontend según rol

#### Tareas

**Backend (`server/`)**

1. Crear el endpoint `POST /api/auth/login`:
   - Buscar usuario por email en la BD
   - Comparar contraseña con `bcrypt.compare()`
   - Si es válido, firmar un JWT con `jwt.sign()` que incluya `{ userId, rol }`
   - Responder con el token y los datos básicos del usuario

2. Crear middleware `authenticateToken`:
   - Leer el header `Authorization: Bearer <token>`
   - Verificar con `jwt.verify()`
   - Añadir el usuario al objeto `req`

3. Crear middleware `requireRole(...roles)`:
   - Comprobar que `req.user.rol` está entre los permitidos
   - Si no, responder 403

**Frontend (`client/`)**

4. Crear contexto `AuthContext` con:
   - `user`, `token`, `isAuthenticated`
   - `login(email, password)` → llama a la API y guarda el token en `localStorage`
   - `logout()` → limpia el token

5. En `App.tsx`, usar `useAuth()` para redirigir:
   - Si no autenticado → `/login`
   - Si autenticado en `/login` → `/dashboard`

#### Conceptos clave
- **JWT**: cabecera.payload.firma en Base64. No almacena secretos.
- **bcrypt**: función de hash lenta con sal. Nunca guardar contraseñas en claro.
- **RBAC**: control de acceso basado en roles.

---

### Fase 2 — CRUD de clientes y vehículos
**Duración: 8-10 horas**

#### Objetivos
- Implementar el patrón CRUD completo en frontend + backend
- Usar React Query para gestión de estado del servidor
- Validar formularios con Zod y React Hook Form

#### Patrón CRUD (repetir para cada entidad)

**Backend**
```
GET    /api/clientes        → listar todos
POST   /api/clientes        → crear nuevo
PUT    /api/clientes/:id    → editar
DELETE /api/clientes/:id    → eliminar
```

Estructura de cada ruta:
```typescript
app.post("/api/clientes", authenticateToken, requireRole("admin", "recepcion"), async (req, res) => {
  const parsed = insertClienteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const cliente = await storage.createCliente(parsed.data);
  res.status(201).json(cliente);
});
```

**Frontend — React Query**
```typescript
// Lectura
const { data: clientes, isLoading } = useQuery<Cliente[]>({
  queryKey: ["/api/clientes"],
});

// Escritura
const createMutation = useMutation({
  mutationFn: (data: InsertCliente) =>
    apiRequest("/api/clientes", { method: "POST", body: JSON.stringify(data) }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
  },
});
```

**Frontend — Formulario**
```typescript
const form = useForm<InsertCliente>({
  resolver: zodResolver(insertClienteSchema),
  defaultValues: { tipo: "particular", nombre: "" },
});
```

#### Tabla de datos con paginación
- Mostrar datos en tabla con columnas responsivas (`hidden sm:table-cell`)
- Botones de acción `size="icon"` para editar y eliminar
- Paginación client-side: `slice((page-1)*pageSize, page*pageSize)`
- Exportar a CSV: mapear los datos filtrados y generar un Blob

#### Conceptos clave
- **React Query**: caché del servidor, invalidación, loading/error states
- **Optimistic updates** vs invalidación de caché
- **Zod**: validación en frontend y backend desde el mismo schema

---

### Fase 3 — Agenda y citas
**Duración: 8-10 horas**

#### Objetivos
- Implementar una agenda visual con dos vistas: mes y semana
- Gestionar el estado de las citas
- Botón rápido para crear Orden de Reparación desde una cita

#### Funcionalidades

**Vista mensual**
- Grid de 7 columnas (días de la semana) y filas por semanas del mes
- Cada cita: pastilla de color según estado
- Navegación con botones anterior/siguiente mes

**Vista semanal**
- 7 columnas (un día cada una) + columna de horas (8:00-20:00)
- Cada hora ocupa 60px de altura
- Posición de cada cita: `top = (hora - 8) * 60 + minutos` px
- Altura de cada cita: `duracion` px (30, 60, 90 o 120 min)
- Scroll horizontal con `min-w-[800px]` en el contenedor

**Estados de cita**
```
pendiente → confirmada → en_curso → completada
                      ↘ cancelada
```

**Flujo rápido Cita → OR**
- Botón "Crear OR" visible en citas con estado `confirmada` o `en_curso`
- Al pulsar: `POST /api/ordenes` con `{ clienteId, vehiculoId, citaId, estado: "abierta" }`
- Redirigir a `/ordenes/:id`

#### Conceptos clave
- Manipulación de fechas con `date-fns`: `startOfMonth`, `eachDayOfInterval`, `isSameDay`
- Estado local vs estado del servidor
- CSS `position: absolute` para posicionar eventos en un grid temporal

---

### Fase 4 — Órdenes de Reparación (OR)
**Duración: 12-15 horas**

#### Objetivos
- Implementar la página central del taller
- Gestionar partes de trabajo y consumos de recambios
- Capturar fotos de recepción con la cámara del tablet
- Calcular totales con IGIC en tiempo real

#### Estructura de una OR

```
OrdenReparacion
├── Info básica (cliente, vehículo, km, fechas)
├── Fotos de recepción (hasta 5, base64)
├── Partes de Trabajo (mano de obra)
│   └── ParteTrabajo: descripcion, mecanicoId, horas, precioMO/h
├── Consumos de Artículos (recambios)
│   └── ConsumoArticulo: articuloId, cantidad, precioUnitario, igic%
└── Totales
    ├── Total MO = Σ (precioMO × horas)
    ├── Total Recambios = Σ (precioUnitario × cantidad)
    ├── Total IGIC = Σ (precioUnitario × cantidad × igic/100)
    └── Total General = MO + Recambios + IGIC
```

#### Flujo de estados
```
abierta → en_curso → terminada → facturada
```

Cuando el estado llega a `terminada`, aparece el botón **"Crear Factura"**.

#### Captura de fotos (API getUserMedia)
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: "environment" } // cámara trasera en tablet
});
// Canvas para capturar el frame
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
ctx.drawImage(videoRef.current, 0, 0);
const base64 = canvas.toDataURL("image/jpeg", 0.8);
// Guardar en: fotosRecepcion = JSON.stringify([base64, ...])
```

#### Conceptos clave
- **Campos decimal en Drizzle**: se almacenan como `string`. Siempre usar `parseFloat()` para aritmética
- **API getUserMedia**: acceso a cámara/micrófono. Requiere HTTPS en producción
- **Totales en tiempo real**: usar `reduce()` sobre los arrays de partes y consumos

---

### Fase 5 — Presupuestos
**Duración: 6-8 horas**

#### Objetivos
- Formulario con líneas dinámicas (añadir/eliminar)
- Cálculo de totales en tiempo real
- Botones para convertir en OR o en Factura

#### Estructura de líneas

Cada línea de presupuesto tiene:
```typescript
interface LineaPresupuesto {
  tipo: "mano_obra" | "articulo" | "otros";
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  igic: number; // porcentaje, ej: 7
}
```

Se guardan serializadas en un campo `lineas: text` de la tabla.

#### Formulario dinámico con useFieldArray
```typescript
const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: "lineasArray",
});
```

#### Totales reactivos
```typescript
const lineas = form.watch("lineasArray");
const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
const totalIgic = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario * l.igic / 100, 0);
const total = subtotal + totalIgic;
```

#### Conceptos clave
- **useFieldArray**: gestión de listas dinámicas en React Hook Form
- **Serialización JSON** en campos de texto de la BD
- Conversión entre documentos: Presupuesto → OR → Factura

---

### Fase 6 — Inventario y artículos
**Duración: 6-8 horas**

#### Objetivos
- CRUD de artículos del catálogo
- Control de stock mínimo y alertas
- Integración con consumos de OR

#### Funcionalidades clave

- Badge de "Stock Bajo" cuando `stock <= stockMinimo`
- Filtro activo para mostrar solo artículos bajo mínimo
- Al añadir un consumo en una OR: selector de artículo del inventario
- Al guardar el consumo: el stock debería decrementarse (lógica en backend)

#### Alertas de stock
```typescript
const isLowStock = (art: Articulo) => (art.stock ?? 0) <= (art.stockMinimo ?? 0);
```

---

### Fase 7 — Facturación con IGIC
**Duración: 8-10 horas**

#### Objetivos
- Crear facturas con líneas detalladas
- Aplicar tipos de IGIC (0%, 3%, 7%, 15%)
- Vista de impresión con datos de la empresa

#### Tipos de IGIC (Canarias)
| Tipo | Descripción |
|------|-------------|
| 0% | Exento |
| 3% | Tipo reducido especial |
| 7% | Tipo general |
| 15% | Tipo incrementado |

#### Flujo OR → Factura
1. OR en estado `terminada` → botón "Crear Factura"
2. Navegar a `/facturas?orId=X&clienteId=Y`
3. En facturas, leer query params con `new URLSearchParams(window.location.search)`
4. Abrir automáticamente el diálogo de nueva factura con datos pre-rellenados

#### Vista de impresión
```typescript
// En el componente de impresión
<div className="print:p-0 print:shadow-none" id="factura-contenido">
  {/* Cabecera empresa */}
  {/* Datos cliente */}
  {/* Tabla de líneas */}
  {/* Totales */}
</div>
<Button onClick={() => window.print()}>Imprimir</Button>
```

CSS en `index.css`:
```css
@media print {
  .print-hide { display: none !important; }
  .print-show { display: block !important; position: absolute; ... }
}
```

---

### Fase 8 — Dashboard y estadísticas
**Duración: 8-10 horas**

#### Objetivos
- KPIs en tiempo real con refetch automático
- Gráfico de barras: ingresos mensuales
- Gráfico de dona: estado de órdenes
- Módulo de informes con 4 tabs

#### KPIs del dashboard
```typescript
// Backend: /api/stats/dashboard
{
  ordenesAbiertas: number,
  citasHoy: number,
  ingresosHoy: number,
  articulosBajoStock: number,
  ingresosMensuales: { mes: string; total: number }[]
}
```

Refetch automático:
```typescript
useQuery({
  queryKey: ["/api/stats/dashboard"],
  refetchInterval: 30000, // cada 30 segundos
});
```

#### Gráficos con Recharts
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={stats?.ingresosMensuales}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="mes" />
    <YAxis />
    <Tooltip formatter={(v) => `${v} €`} />
    <Bar dataKey="total" fill="hsl(var(--primary))" />
  </BarChart>
</ResponsiveContainer>
```

---

### Fase 9 — Adaptación para tablet
**Duración: 4-6 horas**

#### Objetivos
- La app funciona correctamente en tablets de 10" en ambas orientaciones
- Targets táctiles adecuados (mínimo 44×44px)
- Sin dependencias de hover para funcionalidad crítica

#### CSS para dispositivos táctiles

```css
/* Elimina el delay de 300ms en tap */
a, button, input, select, textarea {
  touch-action: manipulation;
}

/* Detecta si el dispositivo usa dedos */
@media (pointer: coarse) {
  button, [role="button"] {
    min-height: 44px;
  }
  tbody tr td {
    padding-top: 0.85rem;
    padding-bottom: 0.85rem;
  }
}

/* Rango de tamaño tablet */
@media (min-width: 768px) and (max-width: 1280px) {
  body { font-size: 15px; }
}
```

#### Comportamiento del sidebar
```typescript
// Abre por defecto en tablet landscape (>= 1024px)
const defaultOpen = typeof window !== "undefined" && window.innerWidth >= 1024;
```

#### Reglas de diseño para touch
- Botones de acción en tablas: siempre usar `size="icon"` (no `size="sm"`)
- Formularios en diálogos: `max-h-[90vh] overflow-y-auto` para scroll en tablet
- Vistas complejas (agenda semanal): `overflow-x-auto` + `min-w-[800px]`
- Nunca ocultar funcionalidad crítica detrás de hover

---

### Fase 10 — Módulos de cumplimiento normativo
**Duración: 8-10 horas**

#### Objetivos
- Gestión de residuos según normativa canaria
- Módulo de compras y almacén
- CRM postventa básico

#### Módulo de Residuos
Siguiendo la normativa de gestión de residuos de actividades de automoción en Canarias:

```
CatálogoResiduos  → código LER, descripción, tipo (peligroso/no peligroso)
Contenedores      → tipo, capacidad, ubicación
GestoresAutorizados → empresa, autorización, residuos gestionados
RegistrosResiduos → contenedorId, cantidad, unidad, fecha
DocumentosDI      → número, fecha, gestorId, residuos
Recogidas         → gestorId, fecha, residuos recogidos
```

#### Módulo de Compras
```
Proveedores       → CRUD estándar
PedidosCompra     → cabecera + líneas de pedido
Recepciones       → albaranes de entrada, actualiza stock
Ubicaciones       → almacén multi-ubicación
```

---

## Conceptos transversales

### Patrón de petición a la API

```typescript
// GET (sin body)
const data = await apiRequest("/api/clientes");

// POST/PUT (con body)
const res = await apiRequest("/api/clientes", {
  method: "POST",
  body: JSON.stringify(nuevoDato),
});
```

### Invalidación de caché correcta

```typescript
// Por prefijo (invalida todas las queries que empiecen por /api/clientes)
queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });

// Exacta
queryClient.invalidateQueries({ queryKey: ["/api/clientes", clienteId] });
```

### Exportación CSV

```typescript
export function exportToCSV(rows: Record<string, any>[], filename: string) {
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))
  ].join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = filename;
  link.click();
}
```

### Seguridad: nunca en el frontend
- Nunca validar permisos solo en el frontend
- Todo `requireRole()` va en el backend
- El JWT es verificado en cada petición protegida
- Los secrets nunca van al cliente

---

## Criterios de evaluación

| Criterio | Peso | Descripción |
|----------|------|-------------|
| Modelo de datos | 10% | Schema correcto y normalizado |
| Backend/API | 20% | Endpoints RESTful, validación Zod, autenticación |
| Frontend/UX | 20% | Componentes reutilizables, formularios validados |
| Módulos obligatorios | 30% | Clientes, Vehículos, OR, Facturación completamente funcionales |
| Módulos opcionales | 10% | Presupuestos, Informes, Gestión de Residuos |
| Adaptación tablet | 5% | Touch targets, layout responsive, sin hover-dependencias |
| Documentación | 5% | README con instrucciones de instalación y uso |

### Módulos obligatorios (mínimo para aprobar)
- [ ] Login/logout con roles
- [ ] CRUD Clientes
- [ ] CRUD Vehículos
- [ ] Agenda de citas (vista mensual mínimo)
- [ ] Órdenes de Reparación con partes y consumos
- [ ] Facturación con IGIC
- [ ] Dashboard con al menos 3 KPIs

### Módulos opcionales (para nota)
- [ ] Vista semanal de agenda con bloques horarios
- [ ] Fotos de recepción con cámara
- [ ] Presupuestos con conversión a OR/Factura
- [ ] Informes con gráficos Recharts
- [ ] Gestión de Residuos
- [ ] Módulo de Compras y Almacén
- [ ] Exportación CSV
- [ ] CRM Postventa

---

## Entrega

1. **Repositorio GitHub** con historial de commits significativo (mínimo 1 commit por fase)
2. **URL de despliegue** accesible (Replit Deployments, Railway, Render, etc.)
3. **Credenciales de prueba**: usuario `admin` con contraseña conocida
4. **Vídeo de demostración** (5-10 min) mostrando el flujo completo: cita → OR → factura → cobro

---

## Recursos

- [Drizzle ORM Docs](https://orm.drizzle.team)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Zod Docs](https://zod.dev)
- [date-fns Docs](https://date-fns.org)
- [Recharts Docs](https://recharts.org)
- [IGIC — Gobierno de Canarias](https://www.gobiernodecanarias.org/hacienda/igic/)
- [Normativa Residuos Automoción](https://www.miteco.gob.es/es/calidad-y-evaluacion-ambiental/temas/residuos/)

---

*Documento elaborado para el módulo de Desarrollo de Aplicaciones Web — Ciclo Formativo de Grado Superior*
