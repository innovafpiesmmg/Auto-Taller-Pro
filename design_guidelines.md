# Design Guidelines - DMS Taller Mecánico

## Design Approach: Professional Productivity System

**Selected Approach:** Design System (Hybrid: Linear + Material Design + Fluent)

**Justification:** This is a utility-focused, information-dense enterprise application requiring efficiency, clarity, and professional aesthetics. Workshop management demands quick data access, minimal cognitive load, and reliable patterns across multiple user roles.

**Key Design Principles:**
- **Clarity First:** Information hierarchy that guides users through complex workflows
- **Efficiency:** Reduce clicks, show relevant data contextually, optimize for speed
- **Consistency:** Predictable patterns across all modules (agenda, OR, facturación, almacén)
- **Accessibility:** WCAG AA compliance, mobile-responsive for workshop floor usage

---

## Color Palette

### Light Mode
- **Primary Brand:** 217 91% 60% (Professional blue - trust, reliability)
- **Primary Hover:** 217 91% 55%
- **Background:** 0 0% 100%
- **Surface:** 210 20% 98%
- **Surface Secondary:** 214 32% 91%
- **Border:** 214 32% 91%
- **Text Primary:** 222 47% 11%
- **Text Secondary:** 215 16% 47%
- **Text Muted:** 215 20% 65%

### Dark Mode
- **Primary Brand:** 217 91% 60%
- **Primary Hover:** 217 91% 65%
- **Background:** 222 47% 11%
- **Surface:** 217 33% 17%
- **Surface Secondary:** 215 28% 22%
- **Border:** 215 28% 22%
- **Text Primary:** 210 20% 98%
- **Text Secondary:** 215 20% 65%
- **Text Muted:** 217 16% 47%

### Semantic Colors
- **Success:** 142 76% 36% (for "Terminada", aprobaciones)
- **Warning:** 38 92% 50% (for "A la espera", stock bajo)
- **Destructive:** 0 84% 60% (for errors, cancelaciones)
- **Info:** 199 89% 48% (for información relevante)

---

## Typography

**Font Stack:**
- **Primary:** 'Inter' - Clean, professional, excellent readability for data
- **Monospace:** 'Fira Code' - For códigos, referencias, matrículas, VIN

**Type Scale:**
- **Display:** 2.25rem (36px) / 600 - Dashboard headers
- **H1:** 1.875rem (30px) / 700 - Page titles
- **H2:** 1.5rem (24px) / 600 - Section headers
- **H3:** 1.25rem (20px) / 600 - Card titles
- **Body Large:** 1rem (16px) / 400 - Primary content
- **Body:** 0.875rem (14px) / 400 - Secondary content, table data
- **Small:** 0.75rem (12px) / 400 - Labels, metadata
- **Code:** 0.875rem (14px) / 400 - Referencias, códigos

---

## Layout System

**Spacing Primitives:** Tailwind units of 1, 2, 4, 6, 8, 12, 16
- Use p-4, gap-6, space-y-8 for consistent rhythm
- Dense data tables: p-2, gap-4
- Form sections: p-6, space-y-6
- Page margins: p-8 (desktop), p-4 (mobile)

**Grid System:**
- **Desktop Sidebar Layout:** Fixed 280px sidebar + main content area
- **Dashboard Cards:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- **Forms:** Two-column for desktop (grid-cols-2), single for mobile
- **Tables:** Full-width with horizontal scroll on mobile

**Container Max-widths:**
- Full app shell: w-full
- Content sections: max-w-7xl
- Forms: max-w-4xl
- Modals/Dialogs: max-w-2xl

---

## Component Library

### Navigation
- **Top Nav:** Fixed header with logo, global search (⌘K), notifications, user menu
- **Sidebar:** Collapsible with icons + labels, active state highlighting, grouped by module
- **Breadcrumbs:** Show current location path for deep navigation

### Data Display
- **Tables:** Striped rows, sortable headers, row actions on hover, sticky headers for long lists
- **Cards:** Elevated (shadow-sm) with clean borders, header/content/footer structure
- **Status Badges:** Pill-shaped with semantic colors (Abierta: blue, En curso: amber, Terminada: green)
- **Stats Cards:** Large number display with trend indicator and sparkline

### Forms & Input
- **Text Inputs:** Clear labels above, helper text below, error states in destructive color
- **Dropdowns:** Searchable combobox for large lists (clientes, artículos)
- **Date/Time Pickers:** Calendar popover with time slots for agenda
- **Signature Pad:** Canvas-based for autorización digital
- **File Upload:** Drag-and-drop zone for fotos 360°, documentos

### Overlays
- **Modal Dialogs:** Centered, backdrop blur, max-w-2xl for forms
- **Slide-overs:** Right-side panel (400px) for quick edits, cliente details
- **Toast Notifications:** Top-right corner, auto-dismiss after 5s
- **Command Palette:** Full-screen search with ⌘K trigger

### Workflow-Specific
- **Kanban Board:** For OR states with drag-and-drop (Abierta → En curso → Terminada)
- **Calendar View:** Monthly/weekly grid with color-coded appointments
- **Timeline:** For historial de vehículo showing all past ORs
- **Checklist:** Interactive with checkboxes, expandable items

---

## Animations

**Principle:** Use sparingly, only for feedback and hierarchy

- **Page Transitions:** None - instant for productivity
- **Modal Entry:** Fade in (200ms) with subtle scale (0.95 → 1)
- **Toast:** Slide in from right (300ms ease-out)
- **Dropdown Open:** Fade + translate-y (150ms)
- **Loading States:** Skeleton screens (pulse animation) for tables/cards
- **Button Clicks:** Scale down (0.98) on active state

**Prohibited:** Parallax, scroll-triggered, decorative animations

---

## Module-Specific Guidelines

### Dashboard (Home)
- KPI cards in 3-column grid: ORs abiertas, Ingresos hoy, Ocupación
- Quick actions: Nueva cita, Nueva OR, Buscar vehículo
- Today's agenda list with timeline view
- Recent activity feed (últimas ORs, facturas)

### Agenda/Citas
- Calendar with day/week/month views, color-coded by estado
- Time slots with drag-and-drop rescheduling
- Quick-add modal with cliente/vehículo search
- Mobile: List view with swipe actions

### Recepción
- Large touch targets for mobile (min 48px)
- Step indicator (1. Datos → 2. Checklist → 3. Firma)
- Camera integration for fotos 360°
- Signature canvas with clear/submit actions

### Órdenes de Reparación
- Kanban board for estado visualization
- Expandable cards showing detalles, partes de trabajo, consumos
- Inline editing for notas, observaciones
- Print/PDF action in header

### Facturación
- Line items table with editable quantities, precios
- IGIC calculator visible, real-time total update
- Tipo de factura selector (Simplificada, Ordinaria, Rectificativa)
- Preview before finalizing

### Almacén/Stock
- Searchable table with filtros (categoría, ubicación)
- Stock levels with visual indicators (low: warning, out: destructive)
- Quick actions: Nuevo pedido, Recepción, Ajuste

---

## Responsive Behavior

- **Desktop (1024px+):** Sidebar visible, multi-column layouts, hover states active
- **Tablet (768-1023px):** Collapsible sidebar, 2-column grids
- **Mobile (<768px):** Bottom navigation, stacked layouts, swipe gestures, larger touch targets

---

## Images

This application does NOT use hero images or marketing visuals. All imagery is functional:
- **Vehicle photos:** User-uploaded during recepción, displayed in galleries
- **Empty states:** Simple illustrations for "No hay citas hoy"
- **Avatar placeholders:** For users and clients without photos