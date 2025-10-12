// Referenced from javascript_database blueprint
import { 
  users, 
  clientes,
  vehiculos,
  citas,
  ordenesReparacion,
  partesTrabajo,
  articulos,
  consumosArticulos,
  presupuestos,
  facturas,
  lineasFactura,
  cobros,
  type User, 
  type InsertUser,
  type Cliente,
  type InsertCliente,
  type Vehiculo,
  type InsertVehiculo,
  type Cita,
  type InsertCita,
  type OrdenReparacion,
  type InsertOrdenReparacion,
  type ParteTrabajo,
  type InsertParteTrabajo,
  type Articulo,
  type InsertArticulo,
  type ConsumoArticulo,
  type InsertConsumoArticulo,
  type Presupuesto,
  type InsertPresupuesto,
  type Factura,
  type InsertFactura,
  type LineaFactura,
  type InsertLineaFactura,
  type Cobro,
  type InsertCobro,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, like, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Clientes
  getClientes(search?: string): Promise<Cliente[]>;
  getCliente(id: number): Promise<Cliente | undefined>;
  createCliente(cliente: InsertCliente): Promise<Cliente>;
  updateCliente(id: number, cliente: Partial<InsertCliente>): Promise<Cliente | undefined>;
  
  // Vehículos
  getVehiculos(search?: string): Promise<Vehiculo[]>;
  getVehiculo(id: number): Promise<Vehiculo | undefined>;
  getVehiculosByCliente(clienteId: number): Promise<Vehiculo[]>;
  createVehiculo(vehiculo: InsertVehiculo): Promise<Vehiculo>;
  updateVehiculo(id: number, vehiculo: Partial<InsertVehiculo>): Promise<Vehiculo | undefined>;
  
  // Citas
  getCitas(from?: Date, to?: Date): Promise<Cita[]>;
  getCita(id: number): Promise<Cita | undefined>;
  createCita(cita: InsertCita): Promise<Cita>;
  updateCita(id: number, cita: Partial<InsertCita>): Promise<Cita | undefined>;
  
  // Órdenes de Reparación
  getOrdenesReparacion(estado?: string): Promise<OrdenReparacion[]>;
  getOrdenReparacion(id: number): Promise<OrdenReparacion | undefined>;
  createOrdenReparacion(or: InsertOrdenReparacion): Promise<OrdenReparacion>;
  updateOrdenReparacion(id: number, or: Partial<InsertOrdenReparacion>): Promise<OrdenReparacion | undefined>;
  
  // Partes de Trabajo
  getPartesTrabajo(orId: number): Promise<ParteTrabajo[]>;
  createParteTrabajo(parte: InsertParteTrabajo): Promise<ParteTrabajo>;
  
  // Artículos
  getArticulos(search?: string): Promise<Articulo[]>;
  getArticulo(id: number): Promise<Articulo | undefined>;
  createArticulo(articulo: InsertArticulo): Promise<Articulo>;
  updateArticulo(id: number, articulo: Partial<InsertArticulo>): Promise<Articulo | undefined>;
  
  // Consumos
  getConsumosArticulos(orId: number): Promise<ConsumoArticulo[]>;
  createConsumoArticulo(consumo: InsertConsumoArticulo): Promise<ConsumoArticulo>;
  
  // Presupuestos
  getPresupuestos(): Promise<Presupuesto[]>;
  getPresupuesto(id: number): Promise<Presupuesto | undefined>;
  createPresupuesto(presupuesto: InsertPresupuesto): Promise<Presupuesto>;
  updatePresupuesto(id: number, presupuesto: Partial<InsertPresupuesto>): Promise<Presupuesto | undefined>;
  
  // Facturas
  getFacturas(): Promise<Factura[]>;
  getFactura(id: number): Promise<Factura | undefined>;
  createFactura(factura: InsertFactura): Promise<Factura>;
  getLineasFactura(facturaId: number): Promise<LineaFactura[]>;
  createLineaFactura(linea: InsertLineaFactura): Promise<LineaFactura>;
  
  // Cobros
  getCobros(facturaId?: number): Promise<Cobro[]>;
  createCobro(cobro: InsertCobro): Promise<Cobro>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Clientes
  async getClientes(search?: string): Promise<Cliente[]> {
    if (search) {
      return await db.select().from(clientes).where(
        or(
          like(clientes.nombre, `%${search}%`),
          like(clientes.nif, `%${search}%`),
          like(clientes.email, `%${search}%`),
          like(clientes.movil, `%${search}%`)
        )
      ).orderBy(desc(clientes.createdAt));
    }
    return await db.select().from(clientes).orderBy(desc(clientes.createdAt));
  }

  async getCliente(id: number): Promise<Cliente | undefined> {
    const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id));
    return cliente || undefined;
  }

  async createCliente(cliente: InsertCliente): Promise<Cliente> {
    const [newCliente] = await db.insert(clientes).values(cliente).returning();
    return newCliente;
  }

  async updateCliente(id: number, cliente: Partial<InsertCliente>): Promise<Cliente | undefined> {
    const [updated] = await db
      .update(clientes)
      .set({ ...cliente, updatedAt: new Date() })
      .where(eq(clientes.id, id))
      .returning();
    return updated || undefined;
  }

  // Vehículos
  async getVehiculos(search?: string): Promise<Vehiculo[]> {
    if (search) {
      return await db.select().from(vehiculos).where(
        or(
          like(vehiculos.matricula, `%${search}%`),
          like(vehiculos.vin, `%${search}%`),
          like(vehiculos.marca, `%${search}%`),
          like(vehiculos.modelo, `%${search}%`)
        )
      ).orderBy(desc(vehiculos.createdAt));
    }
    return await db.select().from(vehiculos).orderBy(desc(vehiculos.createdAt));
  }

  async getVehiculo(id: number): Promise<Vehiculo | undefined> {
    const [vehiculo] = await db.select().from(vehiculos).where(eq(vehiculos.id, id));
    return vehiculo || undefined;
  }

  async getVehiculosByCliente(clienteId: number): Promise<Vehiculo[]> {
    return await db.select().from(vehiculos).where(eq(vehiculos.clienteId, clienteId));
  }

  async createVehiculo(vehiculo: InsertVehiculo): Promise<Vehiculo> {
    const [newVehiculo] = await db.insert(vehiculos).values(vehiculo).returning();
    return newVehiculo;
  }

  async updateVehiculo(id: number, vehiculo: Partial<InsertVehiculo>): Promise<Vehiculo | undefined> {
    const [updated] = await db
      .update(vehiculos)
      .set({ ...vehiculo, updatedAt: new Date() })
      .where(eq(vehiculos.id, id))
      .returning();
    return updated || undefined;
  }

  // Citas
  async getCitas(from?: Date, to?: Date): Promise<Cita[]> {
    if (from && to) {
      return await db.select().from(citas)
        .where(and(
          sql`${citas.fechaHora} >= ${from}`,
          sql`${citas.fechaHora} <= ${to}`
        ))
        .orderBy(citas.fechaHora);
    }
    return await db.select().from(citas).orderBy(desc(citas.fechaHora));
  }

  async getCita(id: number): Promise<Cita | undefined> {
    const [cita] = await db.select().from(citas).where(eq(citas.id, id));
    return cita || undefined;
  }

  async createCita(cita: InsertCita): Promise<Cita> {
    const [newCita] = await db.insert(citas).values(cita).returning();
    return newCita;
  }

  async updateCita(id: number, cita: Partial<InsertCita>): Promise<Cita | undefined> {
    const [updated] = await db
      .update(citas)
      .set({ ...cita, updatedAt: new Date() })
      .where(eq(citas.id, id))
      .returning();
    return updated || undefined;
  }

  // Órdenes de Reparación
  async getOrdenesReparacion(estado?: string): Promise<OrdenReparacion[]> {
    if (estado) {
      return await db.select().from(ordenesReparacion)
        .where(eq(ordenesReparacion.estado, estado as any))
        .orderBy(desc(ordenesReparacion.createdAt));
    }
    return await db.select().from(ordenesReparacion).orderBy(desc(ordenesReparacion.createdAt));
  }

  async getOrdenReparacion(id: number): Promise<OrdenReparacion | undefined> {
    const [or] = await db.select().from(ordenesReparacion).where(eq(ordenesReparacion.id, id));
    return or || undefined;
  }

  async createOrdenReparacion(or: InsertOrdenReparacion): Promise<OrdenReparacion> {
    const [newOr] = await db.insert(ordenesReparacion).values(or).returning();
    return newOr;
  }

  async updateOrdenReparacion(id: number, or: Partial<InsertOrdenReparacion>): Promise<OrdenReparacion | undefined> {
    const [updated] = await db
      .update(ordenesReparacion)
      .set({ ...or, updatedAt: new Date() })
      .where(eq(ordenesReparacion.id, id))
      .returning();
    return updated || undefined;
  }

  // Partes de Trabajo
  async getPartesTrabajo(orId: number): Promise<ParteTrabajo[]> {
    return await db.select().from(partesTrabajo).where(eq(partesTrabajo.orId, orId));
  }

  async createParteTrabajo(parte: InsertParteTrabajo): Promise<ParteTrabajo> {
    const [newParte] = await db.insert(partesTrabajo).values(parte).returning();
    return newParte;
  }

  // Artículos
  async getArticulos(search?: string): Promise<Articulo[]> {
    if (search) {
      return await db.select().from(articulos).where(
        or(
          like(articulos.referencia, `%${search}%`),
          like(articulos.descripcion, `%${search}%`),
          like(articulos.marca, `%${search}%`)
        )
      ).orderBy(articulos.descripcion);
    }
    return await db.select().from(articulos).orderBy(articulos.descripcion);
  }

  async getArticulo(id: number): Promise<Articulo | undefined> {
    const [articulo] = await db.select().from(articulos).where(eq(articulos.id, id));
    return articulo || undefined;
  }

  async createArticulo(articulo: InsertArticulo): Promise<Articulo> {
    const [newArticulo] = await db.insert(articulos).values(articulo).returning();
    return newArticulo;
  }

  async updateArticulo(id: number, articulo: Partial<InsertArticulo>): Promise<Articulo | undefined> {
    const [updated] = await db
      .update(articulos)
      .set({ ...articulo, updatedAt: new Date() })
      .where(eq(articulos.id, id))
      .returning();
    return updated || undefined;
  }

  // Consumos
  async getConsumosArticulos(orId: number): Promise<ConsumoArticulo[]> {
    return await db.select().from(consumosArticulos).where(eq(consumosArticulos.orId, orId));
  }

  async createConsumoArticulo(consumo: InsertConsumoArticulo): Promise<ConsumoArticulo> {
    const [newConsumo] = await db.insert(consumosArticulos).values(consumo).returning();
    return newConsumo;
  }

  // Presupuestos
  async getPresupuestos(): Promise<Presupuesto[]> {
    return await db.select().from(presupuestos).orderBy(desc(presupuestos.createdAt));
  }

  async getPresupuesto(id: number): Promise<Presupuesto | undefined> {
    const [presupuesto] = await db.select().from(presupuestos).where(eq(presupuestos.id, id));
    return presupuesto || undefined;
  }

  async createPresupuesto(presupuesto: InsertPresupuesto): Promise<Presupuesto> {
    const [newPresupuesto] = await db.insert(presupuestos).values(presupuesto).returning();
    return newPresupuesto;
  }

  async updatePresupuesto(id: number, presupuesto: Partial<InsertPresupuesto>): Promise<Presupuesto | undefined> {
    const [updated] = await db
      .update(presupuestos)
      .set(presupuesto)
      .where(eq(presupuestos.id, id))
      .returning();
    return updated || undefined;
  }

  // Facturas
  async getFacturas(): Promise<Factura[]> {
    return await db.select().from(facturas).orderBy(desc(facturas.createdAt));
  }

  async getFactura(id: number): Promise<Factura | undefined> {
    const [factura] = await db.select().from(facturas).where(eq(facturas.id, id));
    return factura || undefined;
  }

  async createFactura(factura: InsertFactura): Promise<Factura> {
    const [newFactura] = await db.insert(facturas).values(factura).returning();
    return newFactura;
  }

  async getLineasFactura(facturaId: number): Promise<LineaFactura[]> {
    return await db.select().from(lineasFactura).where(eq(lineasFactura.facturaId, facturaId));
  }

  async createLineaFactura(linea: InsertLineaFactura): Promise<LineaFactura> {
    const [newLinea] = await db.insert(lineasFactura).values(linea).returning();
    return newLinea;
  }

  // Cobros
  async getCobros(facturaId?: number): Promise<Cobro[]> {
    if (facturaId) {
      return await db.select().from(cobros).where(eq(cobros.facturaId, facturaId));
    }
    return await db.select().from(cobros).orderBy(desc(cobros.createdAt));
  }

  async createCobro(cobro: InsertCobro): Promise<Cobro> {
    const [newCobro] = await db.insert(cobros).values(cobro).returning();
    return newCobro;
  }
}

export const storage = new DatabaseStorage();
