# Flujo Administrativo del Taller — Del Cliente a la Entrega

*Última actualización: Abril 2026*

## Visión general

Este documento describe el ciclo completo de una visita de cliente al taller, desde la primera llamada o llegada presencial hasta la salida del vehículo reparado y el cierre económico. Cada paso se apoya en un módulo específico del sistema DMS.

---

## FASE 1 — Contacto y Cita Previa

### ¿Cuándo se usa?
Cuando el cliente llama o contacta con antelación para reservar turno.

### Pasos
1. El recepcionista accede al módulo **Agenda & Citas**.
2. Busca al cliente en el sistema. Si no existe, lo crea en **Clientes** con nombre, teléfono, email y dirección.
3. Si el cliente tiene un vehículo nuevo, lo registra en **Vehículos** (matrícula, marca, modelo, VIN, km actuales). El sistema autocompleta marcas y modelos mediante la integración CarAPI.
4. Crea la **Cita** indicando:
   - Cliente y vehículo
   - Fecha y hora
   - Duración estimada (30 / 60 / 90 / 120 min)
   - Motivo o descripción del trabajo solicitado
5. La cita queda en estado **Pendiente** y aparece en el calendario (vista mensual o semanal con franjas horarias).

### Resultado
Cita registrada. El taller tiene planificada la carga de trabajo del día. Las citas del día aparecen en el **Dashboard** bajo "Citas de Hoy" y las del día siguiente en "Citas de Mañana".

---

## FASE 2 — Recepción Activa del Vehículo

### ¿Cuándo se usa?
Cuando el cliente llega al taller, con o sin cita previa.

### Pasos
1. El recepcionista localiza la cita en el calendario (o busca al cliente directamente).
   - **Si ya tiene OR creada**: el botón muestra **"Ver OR"** en lugar de "Crear OR" — no se generan duplicados.
2. Anota el **kilometraje de entrada** del vehículo.
3. Toma **fotografías de recepción** (hasta 5) directamente desde la tablet, documentando el estado exterior del vehículo antes de entrar al taller. Las fotos se guardan vinculadas a la OR, no al vehículo, para mantener el historial de cada visita.
4. Si el trabajo es sencillo y el coste es conocido, se puede crear directamente la OR.
5. Pulsa **"Crear OR"** desde la cita para generar automáticamente la Orden de Reparación. La cita queda marcada y el botón cambia a **"Ver OR"**.

### Resultado
Orden de Reparación (OR) creada en estado **Abierta**. Las fotos de recepción quedan asociadas a esa OR específica.

---

## FASE 3 — Presupuesto (opcional pero recomendado)

### ¿Cuándo se usa?
Cuando el coste no es fijo o el cliente necesita aprobar el importe antes de autorizar el trabajo.

### Pasos
1. El recepcionista o jefe de taller accede al módulo **Presupuestos**.
2. Crea un presupuesto vinculando cliente y vehículo.
3. Añade las **líneas del presupuesto**:
   - Mano de obra (precio por hora × horas estimadas)
   - Artículos o recambios (con precio de venta e IGIC)
   - Otros conceptos
4. El sistema calcula automáticamente **subtotal, IGIC y total**.
5. Se presenta el presupuesto al cliente (impreso o por email).
6. El cliente lo **aprueba o rechaza**:
   - Si lo **aprueba**: se cambia el estado a "Aprobado" desde el botón de la lista de presupuestos. La OR vinculada puede ahora avanzar de estado.
   - Si lo **rechaza**: el presupuesto queda archivado en estado "Rechazado" sin coste para el cliente.
7. Se genera la OR desde el botón **"Crear OR"** del presupuesto aprobado. Se establece un **enlace bidireccional**: la OR muestra el presupuesto vinculado y el presupuesto muestra el enlace a la OR.

> **Importante**: Si una OR tiene un presupuesto vinculado no aprobado, los botones de cambio de estado (En proceso, A la espera, Terminada) quedan **bloqueados** hasta que el presupuesto sea aprobado. La OR muestra un aviso en ámbar indicando que se debe aprobar el presupuesto.

### Resultado
OR creada a partir del presupuesto aprobado, con las líneas de trabajo ya precargadas y la vinculación bidireccional activa.

---

## FASE 4 — Ejecución del Trabajo (Taller)

### ¿Cuándo se usa?
Durante el tiempo que el vehículo está en el taller.

### Barra de progreso de la OR
La OR muestra una barra visual de 4 etapas en su detalle:
**Recepción → En Trabajo → Terminada → Facturada**

#### 4.1 Asignación de Mecánicos
1. El jefe de taller abre el **detalle de la OR**.
2. Asigna uno o más mecánicos responsables del trabajo.
3. Cambia el estado de la OR a **"En proceso"** (botón azul).

#### 4.2 Registro de Partes de Trabajo (Mano de Obra)
1. En la OR, se añaden **Partes de Trabajo** por cada tarea realizada:
   - Descripción de la tarea
   - Horas empleadas
   - Precio de mano de obra por hora (editable)
2. Cada parte contribuye al **total de mano de obra** de la OR.

#### 4.3 Consumo de Recambios y Artículos
1. En la misma OR, se añaden los **artículos consumidos** (recambios, materiales, fluidos).
2. El sistema descuenta automáticamente el stock del artículo en el almacén.
3. Si un artículo no está en stock, se puede crear un **Pedido de Compra** al proveedor desde el módulo de Compras.

#### 4.4 Observaciones y Seguimiento
- El mecánico o jefe de taller puede añadir **observaciones** internas en la OR (diagnóstico, notas técnicas).
- El estado puede cambiar a **"A la espera"** (botón ámbar) si hay que esperar piezas o autorización del cliente.
- La lista de órdenes muestra **cuántos días lleva abierta** cada OR con código de color:
  - Gris: menos de 3 días (normal)
  - Ámbar: 3-6 días (requiere atención)
  - Rojo: 7 o más días (urgente)

### Resultado
OR con partes de trabajo y consumos registrados. Totales de la OR (MO + recambios + IGIC) visibles en tiempo real.

---

## FASE 5 — Cierre de la Orden de Reparación

### ¿Cuándo se usa?
Cuando el trabajo está terminado y el vehículo listo para entregar.

### Pasos
1. El jefe de taller cambia el estado de la OR a **"Terminada"** (botón verde).
2. Se registra el **kilometraje de salida** del vehículo.
3. Se añaden las observaciones finales para el cliente (trabajo realizado, recomendaciones).

### Resultado
OR cerrada. La OR aparece en la sección **"Pendientes de Facturar"** del Dashboard con banner en ámbar. El botón **"Crear Factura"** queda disponible (restringido a roles admin y finanzas).

---

## FASE 6 — Facturación

### ¿Cuándo se usa?
Inmediatamente después de cerrar la OR, o en cualquier momento posterior desde la lista de órdenes.

### Pasos
1. Desde la OR terminada, el Dashboard (sección "Pendientes de Facturar") o el listado de Órdenes, se pulsa **"Facturar"** o **"Crear Factura"**.
2. El sistema abre el módulo de **Facturas** con los datos precargados:
   - Cliente
   - Líneas de la OR (mano de obra + recambios)
   - IGIC calculado según el tipo configurado
3. El recepcionista o administrativo revisa y completa:
   - Número de factura (autogenerado: FAC-YYYY-NNNN)
   - Fecha de factura
   - Ajustes de líneas si fuera necesario
4. Se guarda la factura. El sistema la registra en estado **"Emitida"** y la OR pasa a estado **"Facturada"**.
5. Se puede **imprimir** la factura al cliente (botón de vista previa con formato completo de empresa).

> **Nota IGIC**: El sistema aplica el Impuesto General Indirecto Canario (IGIC) en lugar del IVA peninsular. Los tipos son configurables desde el módulo de Configuración. Solo los roles **admin** y **finanzas** pueden crear, editar o eliminar facturas.

### Resultado
Factura emitida con número único, desglose de IGIC y datos fiscales completos del taller.

---

## FASE 7 — Cobro y Caja

### ¿Cuándo se usa?
En el momento en que el cliente paga, que puede ser simultáneo a la factura o diferido.

### Pasos
1. Desde el módulo de **Cobros** (o desde la factura), se registra el pago:
   - Importe cobrado
   - Método de pago: efectivo, tarjeta, transferencia, cheque
   - Fecha del cobro
2. Si el cliente paga en varias partes (pago fraccionado), se registran múltiples cobros contra la misma factura.
3. La factura pasa a estado **"Cobrada"** cuando el importe total está cubierto.
4. El arqueo de caja del día recoge todos los cobros en efectivo para la conciliación.

### Resultado
Cobro registrado. La factura queda saldada.

---

## FASE 8 — Entrega del Vehículo

### ¿Cuándo se usa?
Cuando el cliente recoge el coche.

### Pasos
1. Se entrega la factura impresa o en formato digital al cliente.
2. El cliente firma la conformidad (proceso externo al sistema, física o en tablet).
3. El vehículo sale del taller.

### Resultado
Ciclo completo cerrado. El historial del vehículo (OR + fotos de recepción + factura) queda permanentemente registrado en el sistema para futuras consultas.

---

## FASE 9 — Posventa y CRM (posterior a la entrega)

### ¿Cuándo se usa?
Días después de la entrega, de forma automática o manual.

### Pasos
1. El sistema puede enviar automáticamente una **Encuesta de Satisfacción** al cliente mediante una campaña configurada.
2. Si hay una próxima revisión o ITV próxima, se puede crear una **Campaña de recordatorio** que contacte al cliente cuando se acerque la fecha.
3. Los **Cupones de descuento** pueden emitirse como gesto comercial para fidelizar al cliente.

### Resultado
Cliente fidelizado. El sistema recoge la puntuación de satisfacción para los informes de calidad.

---

## Diagrama de flujo resumido

```
Cliente llega / llama
        │
        ▼
¿Tenía cita?
  Sí ──► Localizar cita en Agenda
  No ──► Buscar/crear Cliente y Vehículo
        │
        ▼
¿Ya tiene OR la cita?
  Sí ──► Botón "Ver OR" (sin duplicar)
  No ──► Recepción activa (km entrada + fotos) ──► "Crear OR"
        │
        ▼
¿Precio conocido?
  Sí ──────────────────────────────────────────┐
  No ──► Crear Presupuesto ──► ¿Aprobado?     │
                 No ──► Archivo               │
                 Sí ──► OR desbloqueada ──────┤
        │                                      │
        ▼◄────────────────────────────────────┘
OR en estado "Abierta"
        │
        ▼
Asignar mecánico → OR "En Proceso"
Registrar Partes de Trabajo (MO)
Registrar Consumo de Artículos (stock)
[si falta pieza → "A la espera"]
        │
        ▼
OR → "Terminada"
(km salida + observaciones finales)
Aparece en Dashboard "Pendientes de Facturar"
        │
        ▼
Crear Factura (con IGIC) [solo admin/finanzas]
OR → "Facturada"
        │
        ▼
Registrar Cobro
(efectivo / tarjeta / transferencia)
        │
        ▼
Entregar vehículo al cliente
        │
        ▼
CRM Postventa (encuesta / recordatorio / cupón)
```

---

## Módulos del sistema implicados por fase

| Fase | Módulo principal | Módulos de apoyo |
|---|---|---|
| 1. Cita | Agenda & Citas | Clientes, Vehículos |
| 2. Recepción | Órdenes de Reparación | Clientes, Vehículos |
| 3. Presupuesto | Presupuestos | Clientes, Vehículos, Artículos |
| 4. Trabajo | Órdenes de Reparación | Almacén, Artículos, Compras |
| 5. Cierre OR | Órdenes de Reparación | — |
| 6. Factura | Facturas | Órdenes de Reparación |
| 7. Cobro | Cobros / Caja | Facturas |
| 8. Entrega | — | — |
| 9. Posventa | CRM (Campañas, Encuestas, Cupones) | Clientes |

---

## Roles del sistema y responsabilidades

| Rol | Tareas principales |
|---|---|
| **Recepción** | Citas, recepción activa (km + fotos), clientes, vehículos, presupuestos |
| **Jefe de Taller** | Asignación de OR, supervisión de trabajo, aprobación de presupuestos, cierre de OR |
| **Mecánico** | Registro de partes de trabajo, consumo de artículos |
| **Almacén** | Control de stock, recepciones de compras, ubicaciones |
| **Finanzas** | Facturas (crear/editar/eliminar), cobros, informes económicos |
| **Admin** | Acceso total, configuración, usuarios, gestión de residuos |

---

## Indicadores visuales del sistema

| Indicador | Significado |
|---|---|
| Badge azul "Presupuesto" en OR | La OR tiene un presupuesto vinculado |
| Banner ámbar en OR | Presupuesto vinculado pendiente de aprobar — OR bloqueada |
| Banner verde en OR "Pendiente de facturar" | OR terminada, lista para facturar |
| Días abierta gris | OR con menos de 3 días (normal) |
| Días abierta ámbar | OR con 3-6 días abierta (requiere atención) |
| Días abierta rojo | OR con 7+ días abierta (urgente) |
| Botón "Ver OR" en cita | Ya existe una OR para esa cita (no se puede duplicar) |
