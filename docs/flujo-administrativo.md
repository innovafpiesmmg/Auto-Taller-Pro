# Flujo Administrativo del Taller — Del Cliente a la Entrega

## Visión general

Este documento describe el ciclo completo de una visita de cliente al taller, desde la primera llamada o llegada presencial hasta la salida del vehículo reparado y el cierre económico. Cada paso se apoya en un módulo específico del sistema DMS.

---

## FASE 1 — Contacto y Cita Previa

### ¿Cuándo se usa?
Cuando el cliente llama o contacta con antelación para reservar turno.

### Pasos
1. El recepcionista accede al módulo **Calendario y Citas**.
2. Busca al cliente en el sistema. Si no existe, lo crea en **Clientes** con nombre, teléfono, email y dirección.
3. Si el cliente tiene un vehículo nuevo, lo registra en **Vehículos** (matrícula, marca, modelo, VIN, km actuales).
4. Crea la **Cita** indicando:
   - Cliente y vehículo
   - Fecha y hora
   - Duración estimada (30 / 60 / 90 / 120 min)
   - Motivo o descripción del trabajo solicitado
5. La cita queda en estado **Pendiente** y aparece en el calendario.

### Resultado
Cita registrada. El taller tiene planificada la carga de trabajo del día.

---

## FASE 2 — Recepción Activa del Vehículo

### ¿Cuándo se usa?
Cuando el cliente llega al taller, con o sin cita previa.

### Pasos
1. El recepcionista localiza la cita en el calendario (o busca al cliente directamente).
2. Anota el **kilometraje de entrada** del vehículo.
3. Toma **fotografías de recepción** (hasta 5) directamente desde la tablet, documentando el estado exterior del vehículo antes de entrar al taller.
4. Si el trabajo es sencillo y el coste es conocido, se puede **saltar al Paso 3 (Presupuesto)** o ir directamente a crear la OR.
5. Pulsa **"Crear OR"** desde la cita para generar automáticamente la Orden de Reparación.

### Resultado
Orden de Reparación (OR) creada en estado **Abierta**. Las fotos de recepción quedan asociadas a esa OR específica.

---

## FASE 3 — Presupuesto (opcional)

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
   - Si lo **aprueba**: se cambia el estado a "Aprobado" y se genera la OR desde el botón **"Crear OR"**.
   - Si lo **rechaza**: el presupuesto queda archivado en estado "Rechazado" sin coste para el cliente.

### Resultado
OR creada a partir del presupuesto aprobado, con las líneas de trabajo ya precargadas.

---

## FASE 4 — Ejecución del Trabajo (Taller)

### ¿Cuándo se usa?
Durante el tiempo que el vehículo está en el taller.

### Pasos

#### 4.1 Asignación de Mecánicos
1. El jefe de taller abre el **detalle de la OR**.
2. Asigna uno o más mecánicos responsables del trabajo.
3. Cambia el estado de la OR a **"En proceso"**.

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
- El estado puede cambiar a **"A la espera"** si hay que esperar piezas o autorización del cliente.

### Resultado
OR con partes de trabajo y consumos registrados. Totales de la OR (MO + recambios + IGIC) visibles en tiempo real.

---

## FASE 5 — Cierre de la Orden de Reparación

### ¿Cuándo se usa?
Cuando el trabajo está terminado y el vehículo listo para entregar.

### Pasos
1. El jefe de taller cambia el estado de la OR a **"Terminada"**.
2. Se registra el **kilometraje de salida** del vehículo.
3. Se añaden las observaciones finales para el cliente (trabajo realizado, recomendaciones).

### Resultado
OR cerrada. El botón **"Crear Factura"** queda disponible.

---

## FASE 6 — Facturación

### ¿Cuándo se usa?
Inmediatamente después de cerrar la OR, o en cualquier momento posterior desde la lista de órdenes.

### Pasos
1. Desde la OR terminada (o desde el listado de Órdenes), se pulsa **"Crear Factura"**.
2. El sistema abre el módulo de **Facturas** con los datos precargados:
   - Cliente
   - Líneas de la OR (mano de obra + recambios)
   - IGIC calculado según el tipo configurado
3. El recepcionista/administrativo revisa y completa:
   - Número de factura (autogenerado: FAC-YYYY-NNNN)
   - Fecha de factura
   - Ajustes de líneas si fuera necesario
4. Se guarda la factura. El sistema la registra en estado **"Emitida"**.
5. Se puede **imprimir o enviar** la factura al cliente (impresión desde el botón de vista previa).

> **Nota IGIC**: El sistema aplica el Impuesto General Indirecto Canario (IGIC) en lugar del IVA peninsular. Los tipos son configurables desde el módulo de configuración.

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
Cliente llega
     │
     ▼
¿Tenía cita?
  Sí ──► Localizar cita en Calendario
  No ──► Buscar/crear Cliente y Vehículo
     │
     ▼
Recepción activa
(km entrada + fotos)
     │
     ▼
¿Precio conocido?
  Sí ──────────────────────────────────────┐
  No ──► Crear Presupuesto ──► Aprobado? ──┤
                                 No ──► Archivo
     │                                     │
     ▼◄────────────────────────────────────┘
Crear OR (Orden de Reparación)
     │
     ▼
Asignar mecánico
Registrar Partes de Trabajo (MO)
Registrar Consumo de Artículos (stock)
     │
     ▼
OR → "Terminada"
(km salida + observaciones finales)
     │
     ▼
Crear Factura (con IGIC)
     │
     ▼
Registrar Cobro
(efectivo / tarjeta / transferencia)
     │
     ▼
Entregar vehículo al cliente
     │
     ▼
CRM Postventa (encuesta / recordatorio)
```

---

## Módulos del sistema implicados por fase

| Fase | Módulo principal | Módulos de apoyo |
|---|---|---|
| 1. Cita | Calendario y Citas | Clientes, Vehículos |
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
| **Recepción** | Citas, recepción activa, clientes, vehículos, presupuestos, facturas |
| **Jefe de Taller** | Asignación de OR, supervisión de trabajo, cierre de OR |
| **Mecánico** | Registro de partes de trabajo, consumo de artículos |
| **Almacén** | Control de stock, recepciones de compras, ubicaciones |
| **Finanzas** | Facturas (crear/editar/eliminar), cobros, informes económicos |
| **Admin** | Acceso total, configuración, usuarios, gestión de residuos |
