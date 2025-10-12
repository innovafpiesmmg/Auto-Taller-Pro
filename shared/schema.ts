import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  integer, 
  decimal, 
  boolean,
  pgEnum,
  serial
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const tipoClienteEnum = pgEnum("tipo_cliente", ["particular", "empresa"]);
export const estadoCitaEnum = pgEnum("estado_cita", ["pendiente", "confirmada", "en_curso", "completada", "cancelada"]);
export const estadoOrEnum = pgEnum("estado_or", ["abierta", "en_curso", "a_la_espera", "terminada", "facturada"]);
export const tipoFacturaEnum = pgEnum("tipo_factura", ["proforma", "simplificada", "ordinaria", "rectificativa"]);
export const metodoPagoEnum = pgEnum("metodo_pago", ["efectivo", "tarjeta", "transferencia", "bizum"]);
export const rolEnum = pgEnum("rol", ["admin", "jefe_taller", "recepcion", "mecanico", "almacen", "finanzas"]);
export const estadoPedidoEnum = pgEnum("estado_pedido", ["pendiente", "enviado", "recibido_parcial", "recibido", "cancelado"]);
export const tipoMovimientoEnum = pgEnum("tipo_movimiento", ["entrada", "salida", "ajuste", "recuento"]);

// Usuarios y autenticación
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  apellidos: varchar("apellidos", { length: 100 }),
  rol: rolEnum("rol").notNull().default("recepcion"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Clientes
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  tipo: tipoClienteEnum("tipo").notNull().default("particular"),
  nif: varchar("nif", { length: 20 }).notNull().unique(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  apellidos: varchar("apellidos", { length: 100 }),
  razonSocial: varchar("razon_social", { length: 200 }),
  email: varchar("email", { length: 255 }),
  movil: varchar("movil", { length: 20 }),
  telefono: varchar("telefono", { length: 20 }),
  direccion: text("direccion"),
  codigoPostal: varchar("codigo_postal", { length: 10 }),
  ciudad: varchar("ciudad", { length: 100 }),
  provincia: varchar("provincia", { length: 100 }),
  notas: text("notas"),
  rgpdConsentimiento: boolean("rgpd_consentimiento").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Vehículos
export const vehiculos = pgTable("vehiculos", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  matricula: varchar("matricula", { length: 20 }).notNull().unique(),
  vin: varchar("vin", { length: 50 }),
  marca: varchar("marca", { length: 100 }).notNull(),
  modelo: varchar("modelo", { length: 100 }).notNull(),
  version: varchar("version", { length: 100 }),
  año: integer("año"),
  combustible: varchar("combustible", { length: 50 }),
  km: integer("km"),
  itvFecha: timestamp("itv_fecha"),
  seguro: varchar("seguro", { length: 100 }),
  color: varchar("color", { length: 50 }),
  observaciones: text("observaciones"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Citas
export const citas = pgTable("citas", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  vehiculoId: integer("vehiculo_id").notNull().references(() => vehiculos.id),
  fechaHora: timestamp("fecha_hora").notNull(),
  motivo: text("motivo").notNull(),
  estado: estadoCitaEnum("estado").notNull().default("pendiente"),
  canal: varchar("canal", { length: 50 }).default("telefono"),
  tecnicoId: integer("tecnico_id").references(() => users.id),
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Órdenes de Reparación
export const ordenesReparacion = pgTable("ordenes_reparacion", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  vehiculoId: integer("vehiculo_id").notNull().references(() => vehiculos.id),
  citaId: integer("cita_id").references(() => citas.id),
  fechaApertura: timestamp("fecha_apertura").notNull().defaultNow(),
  fechaCierre: timestamp("fecha_cierre"),
  estado: estadoOrEnum("estado").notNull().default("abierta"),
  prioridad: varchar("prioridad", { length: 20 }).default("normal"),
  kmEntrada: integer("km_entrada"),
  kmSalida: integer("km_salida"),
  observaciones: text("observaciones"),
  checklistRecepcion: text("checklist_recepcion"),
  firmaDigital: text("firma_digital"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Partes de Trabajo (dentro de una OR)
export const partesTrabajo = pgTable("partes_trabajo", {
  id: serial("id").primaryKey(),
  orId: integer("or_id").notNull().references(() => ordenesReparacion.id),
  mecanicoId: integer("mecanico_id").references(() => users.id),
  descripcion: text("descripcion").notNull(),
  tiempoEstimado: decimal("tiempo_estimado", { precision: 10, scale: 2 }),
  tiempoReal: decimal("tiempo_real", { precision: 10, scale: 2 }),
  precioMO: decimal("precio_mo", { precision: 10, scale: 2 }),
  completado: boolean("completado").default(false),
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Artículos/Recambios
export const articulos = pgTable("articulos", {
  id: serial("id").primaryKey(),
  referencia: varchar("referencia", { length: 100 }).notNull().unique(),
  descripcion: text("descripcion").notNull(),
  categoria: varchar("categoria", { length: 100 }),
  marca: varchar("marca", { length: 100 }),
  precioCoste: decimal("precio_coste", { precision: 10, scale: 2 }),
  precioVenta: decimal("precio_venta", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  stockMinimo: integer("stock_minimo").default(0),
  igic: decimal("igic", { precision: 5, scale: 2 }).default("7.00"),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Consumos de artículos en OR
export const consumosArticulos = pgTable("consumos_articulos", {
  id: serial("id").primaryKey(),
  orId: integer("or_id").notNull().references(() => ordenesReparacion.id),
  articuloId: integer("articulo_id").notNull().references(() => articulos.id),
  cantidad: decimal("cantidad", { precision: 10, scale: 2 }).notNull(),
  precioUnitario: decimal("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  igic: decimal("igic", { precision: 5, scale: 2 }).default("7.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Presupuestos
export const presupuestos = pgTable("presupuestos", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  vehiculoId: integer("vehiculo_id").notNull().references(() => vehiculos.id),
  orId: integer("or_id").references(() => ordenesReparacion.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  descripcion: text("descripcion"),
  totalMO: decimal("total_mo", { precision: 10, scale: 2 }).default("0"),
  totalArticulos: decimal("total_articulos", { precision: 10, scale: 2 }).default("0"),
  descuento: decimal("descuento", { precision: 10, scale: 2 }).default("0"),
  totalIgic: decimal("total_igic", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  aprobado: boolean("aprobado").default(false),
  fechaAprobacion: timestamp("fecha_aprobacion"),
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Facturas
export const facturas = pgTable("facturas", {
  id: serial("id").primaryKey(),
  numero: varchar("numero", { length: 50 }).notNull().unique(),
  tipo: tipoFacturaEnum("tipo").notNull().default("ordinaria"),
  serie: varchar("serie", { length: 10 }).notNull().default("F"),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  orId: integer("or_id").references(() => ordenesReparacion.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  baseImponible: decimal("base_imponible", { precision: 10, scale: 2 }).notNull(),
  totalIgic: decimal("total_igic", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  facturaOrigenId: integer("factura_origen_id").references(() => facturas.id),
  motivoRectificativa: text("motivo_rectificativa"),
  observaciones: text("observaciones"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Líneas de Factura
export const lineasFactura = pgTable("lineas_factura", {
  id: serial("id").primaryKey(),
  facturaId: integer("factura_id").notNull().references(() => facturas.id),
  tipo: varchar("tipo", { length: 20 }).notNull(),
  descripcion: text("descripcion").notNull(),
  cantidad: decimal("cantidad", { precision: 10, scale: 2 }).notNull(),
  precioUnitario: decimal("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  igic: decimal("igic", { precision: 5, scale: 2 }).notNull(),
  importe: decimal("importe", { precision: 10, scale: 2 }).notNull(),
});

// Cobros/Pagos
export const cobros = pgTable("cobros", {
  id: serial("id").primaryKey(),
  facturaId: integer("factura_id").references(() => facturas.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  importe: decimal("importe", { precision: 10, scale: 2 }).notNull(),
  metodoPago: metodoPagoEnum("metodo_pago").notNull(),
  referencia: varchar("referencia", { length: 100 }),
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Proveedores
export const proveedores = pgTable("proveedores", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  nif: varchar("nif", { length: 20 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  telefono: varchar("telefono", { length: 20 }),
  direccion: text("direccion"),
  codigoPostal: varchar("codigo_postal", { length: 10 }),
  ciudad: varchar("ciudad", { length: 100 }),
  provincia: varchar("provincia", { length: 100 }),
  contacto: varchar("contacto", { length: 100 }),
  plazoEntrega: integer("plazo_entrega"),
  notas: text("notas"),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Pedidos a Proveedores
export const pedidosCompra = pgTable("pedidos_compra", {
  id: serial("id").primaryKey(),
  numero: varchar("numero", { length: 50 }).notNull().unique(),
  proveedorId: integer("proveedor_id").notNull().references(() => proveedores.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  fechaEntregaEstimada: timestamp("fecha_entrega_estimada"),
  estado: estadoPedidoEnum("estado").notNull().default("pendiente"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  observaciones: text("observaciones"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Líneas de Pedido
export const lineasPedido = pgTable("lineas_pedido", {
  id: serial("id").primaryKey(),
  pedidoId: integer("pedido_id").notNull().references(() => pedidosCompra.id),
  articuloId: integer("articulo_id").notNull().references(() => articulos.id),
  cantidad: decimal("cantidad", { precision: 10, scale: 2 }).notNull(),
  cantidadRecibida: decimal("cantidad_recibida", { precision: 10, scale: 2 }).default("0"),
  precioUnitario: decimal("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  igic: decimal("igic", { precision: 5, scale: 2 }).default("7.00"),
  importe: decimal("importe", { precision: 10, scale: 2 }).notNull(),
});

// Recepciones de Almacén
export const recepciones = pgTable("recepciones", {
  id: serial("id").primaryKey(),
  numero: varchar("numero", { length: 50 }).notNull().unique(),
  pedidoId: integer("pedido_id").references(() => pedidosCompra.id),
  proveedorId: integer("proveedor_id").notNull().references(() => proveedores.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  albaranProveedor: varchar("albaran_proveedor", { length: 100 }),
  recibidoPorId: integer("recibido_por_id").references(() => users.id),
  observaciones: text("observaciones"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Líneas de Recepción
export const lineasRecepcion = pgTable("lineas_recepcion", {
  id: serial("id").primaryKey(),
  recepcionId: integer("recepcion_id").notNull().references(() => recepciones.id),
  articuloId: integer("articulo_id").notNull().references(() => articulos.id),
  cantidad: decimal("cantidad", { precision: 10, scale: 2 }).notNull(),
  ubicacionId: integer("ubicacion_id").references(() => ubicaciones.id),
  lote: varchar("lote", { length: 50 }),
  fechaCaducidad: timestamp("fecha_caducidad"),
});

// Ubicaciones de Almacén
export const ubicaciones = pgTable("ubicaciones", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  tipo: varchar("tipo", { length: 50 }),
  pasillo: varchar("pasillo", { length: 20 }),
  estanteria: varchar("estanteria", { length: 20 }),
  nivel: varchar("nivel", { length: 20 }),
  activa: boolean("activa").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Movimientos de Almacén
export const movimientosAlmacen = pgTable("movimientos_almacen", {
  id: serial("id").primaryKey(),
  articuloId: integer("articulo_id").notNull().references(() => articulos.id),
  tipo: tipoMovimientoEnum("tipo").notNull(),
  cantidad: decimal("cantidad", { precision: 10, scale: 2 }).notNull(),
  ubicacionOrigenId: integer("ubicacion_origen_id").references(() => ubicaciones.id),
  ubicacionDestinoId: integer("ubicacion_destino_id").references(() => ubicaciones.id),
  referencia: varchar("referencia", { length: 100 }),
  motivo: text("motivo"),
  usuarioId: integer("usuario_id").references(() => users.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
});

// Relations
export const clientesRelations = relations(clientes, ({ many }) => ({
  vehiculos: many(vehiculos),
  citas: many(citas),
  ordenesReparacion: many(ordenesReparacion),
  presupuestos: many(presupuestos),
  facturas: many(facturas),
}));

export const vehiculosRelations = relations(vehiculos, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [vehiculos.clienteId],
    references: [clientes.id],
  }),
  citas: many(citas),
  ordenesReparacion: many(ordenesReparacion),
  presupuestos: many(presupuestos),
}));

export const citasRelations = relations(citas, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [citas.clienteId],
    references: [clientes.id],
  }),
  vehiculo: one(vehiculos, {
    fields: [citas.vehiculoId],
    references: [vehiculos.id],
  }),
  tecnico: one(users, {
    fields: [citas.tecnicoId],
    references: [users.id],
  }),
  ordenesReparacion: many(ordenesReparacion),
}));

export const ordenesReparacionRelations = relations(ordenesReparacion, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [ordenesReparacion.clienteId],
    references: [clientes.id],
  }),
  vehiculo: one(vehiculos, {
    fields: [ordenesReparacion.vehiculoId],
    references: [vehiculos.id],
  }),
  cita: one(citas, {
    fields: [ordenesReparacion.citaId],
    references: [citas.id],
  }),
  partesTrabajo: many(partesTrabajo),
  consumosArticulos: many(consumosArticulos),
  presupuestos: many(presupuestos),
  facturas: many(facturas),
}));

export const partesTrabajoRelations = relations(partesTrabajo, ({ one }) => ({
  ordenReparacion: one(ordenesReparacion, {
    fields: [partesTrabajo.orId],
    references: [ordenesReparacion.id],
  }),
  mecanico: one(users, {
    fields: [partesTrabajo.mecanicoId],
    references: [users.id],
  }),
}));

export const articulosRelations = relations(articulos, ({ many }) => ({
  consumos: many(consumosArticulos),
}));

export const consumosArticulosRelations = relations(consumosArticulos, ({ one }) => ({
  ordenReparacion: one(ordenesReparacion, {
    fields: [consumosArticulos.orId],
    references: [ordenesReparacion.id],
  }),
  articulo: one(articulos, {
    fields: [consumosArticulos.articuloId],
    references: [articulos.id],
  }),
}));

export const presupuestosRelations = relations(presupuestos, ({ one }) => ({
  cliente: one(clientes, {
    fields: [presupuestos.clienteId],
    references: [clientes.id],
  }),
  vehiculo: one(vehiculos, {
    fields: [presupuestos.vehiculoId],
    references: [vehiculos.id],
  }),
  ordenReparacion: one(ordenesReparacion, {
    fields: [presupuestos.orId],
    references: [ordenesReparacion.id],
  }),
}));

export const facturasRelations = relations(facturas, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [facturas.clienteId],
    references: [clientes.id],
  }),
  ordenReparacion: one(ordenesReparacion, {
    fields: [facturas.orId],
    references: [ordenesReparacion.id],
  }),
  facturaOrigen: one(facturas, {
    fields: [facturas.facturaOrigenId],
    references: [facturas.id],
  }),
  lineas: many(lineasFactura),
  cobros: many(cobros),
}));

export const lineasFacturaRelations = relations(lineasFactura, ({ one }) => ({
  factura: one(facturas, {
    fields: [lineasFactura.facturaId],
    references: [facturas.id],
  }),
}));

export const cobrosRelations = relations(cobros, ({ one }) => ({
  factura: one(facturas, {
    fields: [cobros.facturaId],
    references: [facturas.id],
  }),
}));

export const proveedoresRelations = relations(proveedores, ({ many }) => ({
  pedidos: many(pedidosCompra),
  recepciones: many(recepciones),
}));

export const pedidosCompraRelations = relations(pedidosCompra, ({ one, many }) => ({
  proveedor: one(proveedores, {
    fields: [pedidosCompra.proveedorId],
    references: [proveedores.id],
  }),
  createdBy: one(users, {
    fields: [pedidosCompra.createdById],
    references: [users.id],
  }),
  lineas: many(lineasPedido),
  recepciones: many(recepciones),
}));

export const lineasPedidoRelations = relations(lineasPedido, ({ one }) => ({
  pedido: one(pedidosCompra, {
    fields: [lineasPedido.pedidoId],
    references: [pedidosCompra.id],
  }),
  articulo: one(articulos, {
    fields: [lineasPedido.articuloId],
    references: [articulos.id],
  }),
}));

export const recepcionesRelations = relations(recepciones, ({ one, many }) => ({
  pedido: one(pedidosCompra, {
    fields: [recepciones.pedidoId],
    references: [pedidosCompra.id],
  }),
  proveedor: one(proveedores, {
    fields: [recepciones.proveedorId],
    references: [proveedores.id],
  }),
  recibidoPor: one(users, {
    fields: [recepciones.recibidoPorId],
    references: [users.id],
  }),
  lineas: many(lineasRecepcion),
}));

export const lineasRecepcionRelations = relations(lineasRecepcion, ({ one }) => ({
  recepcion: one(recepciones, {
    fields: [lineasRecepcion.recepcionId],
    references: [recepciones.id],
  }),
  articulo: one(articulos, {
    fields: [lineasRecepcion.articuloId],
    references: [articulos.id],
  }),
  ubicacion: one(ubicaciones, {
    fields: [lineasRecepcion.ubicacionId],
    references: [ubicaciones.id],
  }),
}));

export const ubicacionesRelations = relations(ubicaciones, ({ many }) => ({
  lineasRecepcion: many(lineasRecepcion),
  movimientosOrigen: many(movimientosAlmacen),
  movimientosDestino: many(movimientosAlmacen),
}));

export const movimientosAlmacenRelations = relations(movimientosAlmacen, ({ one }) => ({
  articulo: one(articulos, {
    fields: [movimientosAlmacen.articuloId],
    references: [articulos.id],
  }),
  ubicacionOrigen: one(ubicaciones, {
    fields: [movimientosAlmacen.ubicacionOrigenId],
    references: [ubicaciones.id],
  }),
  ubicacionDestino: one(ubicaciones, {
    fields: [movimientosAlmacen.ubicacionDestinoId],
    references: [ubicaciones.id],
  }),
  usuario: one(users, {
    fields: [movimientosAlmacen.usuarioId],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  nombre: true,
  apellidos: true,
  rol: true,
});

export const insertClienteSchema = createInsertSchema(clientes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVehiculoSchema = createInsertSchema(vehiculos).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCitaSchema = createInsertSchema(citas).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrdenReparacionSchema = createInsertSchema(ordenesReparacion).omit({ id: true, createdAt: true, updatedAt: true });
export const insertParteTrabajoSchema = createInsertSchema(partesTrabajo).omit({ id: true, createdAt: true });
export const insertArticuloSchema = createInsertSchema(articulos).omit({ id: true, createdAt: true, updatedAt: true });
export const insertConsumoArticuloSchema = createInsertSchema(consumosArticulos).omit({ id: true, createdAt: true });
export const insertPresupuestoSchema = createInsertSchema(presupuestos).omit({ id: true, createdAt: true });
export const insertFacturaSchema = createInsertSchema(facturas).omit({ id: true, createdAt: true });
export const insertLineaFacturaSchema = createInsertSchema(lineasFactura).omit({ id: true });
export const insertCobroSchema = createInsertSchema(cobros).omit({ id: true, createdAt: true });
export const insertProveedorSchema = createInsertSchema(proveedores).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPedidoCompraSchema = createInsertSchema(pedidosCompra).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLineaPedidoSchema = createInsertSchema(lineasPedido).omit({ id: true });
export const insertRecepcionSchema = createInsertSchema(recepciones).omit({ id: true, createdAt: true });
export const insertLineaRecepcionSchema = createInsertSchema(lineasRecepcion).omit({ id: true });
export const insertUbicacionSchema = createInsertSchema(ubicaciones).omit({ id: true, createdAt: true });
export const insertMovimientoAlmacenSchema = createInsertSchema(movimientosAlmacen).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Vehiculo = typeof vehiculos.$inferSelect;
export type InsertVehiculo = z.infer<typeof insertVehiculoSchema>;
export type Cita = typeof citas.$inferSelect;
export type InsertCita = z.infer<typeof insertCitaSchema>;
export type OrdenReparacion = typeof ordenesReparacion.$inferSelect;
export type InsertOrdenReparacion = z.infer<typeof insertOrdenReparacionSchema>;
export type ParteTrabajo = typeof partesTrabajo.$inferSelect;
export type InsertParteTrabajo = z.infer<typeof insertParteTrabajoSchema>;
export type Articulo = typeof articulos.$inferSelect;
export type InsertArticulo = z.infer<typeof insertArticuloSchema>;
export type ConsumoArticulo = typeof consumosArticulos.$inferSelect;
export type InsertConsumoArticulo = z.infer<typeof insertConsumoArticuloSchema>;
export type Presupuesto = typeof presupuestos.$inferSelect;
export type InsertPresupuesto = z.infer<typeof insertPresupuestoSchema>;
export type Factura = typeof facturas.$inferSelect;
export type InsertFactura = z.infer<typeof insertFacturaSchema>;
export type LineaFactura = typeof lineasFactura.$inferSelect;
export type InsertLineaFactura = z.infer<typeof insertLineaFacturaSchema>;
export type Cobro = typeof cobros.$inferSelect;
export type InsertCobro = z.infer<typeof insertCobroSchema>;
export type Proveedor = typeof proveedores.$inferSelect;
export type InsertProveedor = z.infer<typeof insertProveedorSchema>;
export type PedidoCompra = typeof pedidosCompra.$inferSelect;
export type InsertPedidoCompra = z.infer<typeof insertPedidoCompraSchema>;
export type LineaPedido = typeof lineasPedido.$inferSelect;
export type InsertLineaPedido = z.infer<typeof insertLineaPedidoSchema>;
export type Recepcion = typeof recepciones.$inferSelect;
export type InsertRecepcion = z.infer<typeof insertRecepcionSchema>;
export type LineaRecepcion = typeof lineasRecepcion.$inferSelect;
export type InsertLineaRecepcion = z.infer<typeof insertLineaRecepcionSchema>;
export type Ubicacion = typeof ubicaciones.$inferSelect;
export type InsertUbicacion = z.infer<typeof insertUbicacionSchema>;
export type MovimientoAlmacen = typeof movimientosAlmacen.$inferSelect;
export type InsertMovimientoAlmacen = z.infer<typeof insertMovimientoAlmacenSchema>;
