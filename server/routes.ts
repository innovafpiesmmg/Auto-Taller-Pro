import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { 
  insertClienteSchema,
  insertVehiculoSchema,
  insertCitaSchema,
  insertOrdenReparacionSchema,
  insertParteTrabajoSchema,
  insertArticuloSchema,
  insertConsumoArticuloSchema,
  insertPresupuestoSchema,
  insertFacturaSchema,
  insertLineaFacturaSchema,
  insertCobroSchema,
  insertProveedorSchema,
  insertPedidoCompraSchema,
  insertLineaPedidoSchema,
  insertRecepcionSchema,
  insertLineaRecepcionSchema,
  insertUbicacionSchema,
  insertMovimientoAlmacenSchema,
  insertCampanaSchema,
  insertEncuestaSchema,
  insertRespuestaEncuestaSchema,
  insertCuponSchema,
  insertCatalogoResiduoSchema,
  insertContenedorResiduoSchema,
  insertGestorResiduoSchema,
  insertRegistroResiduoSchema,
  insertDocumentoDISchema,
  insertRecogidaResiduoSchema,
} from "@shared/schema";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const JWT_SECRET = process.env.JWT_SECRET;

// Schema de validación para login
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
});

// Schema de validación para registro (solo admin puede crear usuarios)
const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  nombre: z.string().min(1),
  apellidos: z.string().optional(),
  rol: z.enum(["admin", "jefe_taller", "recepcion", "mecanico", "almacen", "finanzas"]),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware para parsear JSON
  app.use(express.json());

  // Auth middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "No autorizado" });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: "Token inválido" });
      }
      req.user = user;
      next();
    });
  };

  // Middleware para verificar roles
  const requireRole = (...allowedRoles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user || !allowedRoles.includes(req.user.rol)) {
        return res.status(403).json({ error: "No tienes permisos para esta acción" });
      }
      next();
    };
  };

  // Auth routes
  // Solo admin puede crear usuarios
  app.post("/api/auth/register", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const validated = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validated.username);
      if (existingUser) {
        return res.status(400).json({ error: "El usuario ya existe" });
      }

      const hashedPassword = await bcrypt.hash(validated.password, 10);
      const user = await storage.createUser({
        username: validated.username,
        email: validated.email,
        password: hashedPassword,
        nombre: validated.nombre,
        apellidos: validated.apellidos,
        rol: validated.rol,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validated = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(validated.username);
      if (!user || !user.activo) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const validPassword = await bcrypt.compare(validated.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, rol: user.rol },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Clientes routes  
  app.get("/api/clientes", authenticateToken, requireRole("admin", "jefe_taller", "recepcion", "finanzas"), async (req, res) => {
    try {
      const { search } = req.query;
      const clientes = await storage.getClientes(search as string);
      res.json(clientes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/clientes/:id", authenticateToken, requireRole("admin", "jefe_taller", "recepcion", "finanzas"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cliente = await storage.getCliente(id);
      if (!cliente) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }
      res.json(cliente);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clientes", authenticateToken, requireRole("admin", "jefe_taller", "recepcion"), async (req, res) => {
    try {
      const validated = insertClienteSchema.parse(req.body);
      const cliente = await storage.createCliente(validated);
      res.status(201).json(cliente);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/clientes/:id", authenticateToken, requireRole("admin", "jefe_taller", "recepcion"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertClienteSchema.partial().parse(req.body);
      const cliente = await storage.updateCliente(id, validated);
      if (!cliente) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }
      res.json(cliente);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Vehículos routes
  app.get("/api/vehiculos", authenticateToken, requireRole("admin", "jefe_taller", "recepcion", "mecanico"), async (req, res) => {
    try {
      const { search, clienteId } = req.query;
      if (clienteId) {
        const vehiculos = await storage.getVehiculosByCliente(parseInt(clienteId as string));
        return res.json(vehiculos);
      }
      const vehiculos = await storage.getVehiculos(search as string);
      res.json(vehiculos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/vehiculos/:id", authenticateToken, requireRole("admin", "jefe_taller", "recepcion", "mecanico"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehiculo = await storage.getVehiculo(id);
      if (!vehiculo) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }
      res.json(vehiculo);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/vehiculos", authenticateToken, requireRole("admin", "jefe_taller", "recepcion"), async (req, res) => {
    try {
      const validated = insertVehiculoSchema.parse(req.body);
      const vehiculo = await storage.createVehiculo(validated);
      res.status(201).json(vehiculo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/vehiculos/:id", authenticateToken, requireRole("admin", "jefe_taller", "recepcion"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertVehiculoSchema.partial().parse(req.body);
      const vehiculo = await storage.updateVehiculo(id, validated);
      if (!vehiculo) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }
      res.json(vehiculo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Citas routes
  app.get("/api/citas", authenticateToken, requireRole("admin", "jefe_taller", "recepcion"), async (req, res) => {
    try {
      const { from, to } = req.query;
      const citas = await storage.getCitas(
        from ? new Date(from as string) : undefined,
        to ? new Date(to as string) : undefined
      );
      res.json(citas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/citas/:id", authenticateToken, requireRole("admin", "jefe_taller", "recepcion"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cita = await storage.getCita(id);
      if (!cita) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }
      res.json(cita);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/citas", authenticateToken, requireRole("admin", "jefe_taller", "recepcion"), async (req, res) => {
    try {
      const validated = insertCitaSchema.parse(req.body);
      const cita = await storage.createCita(validated);
      res.status(201).json(cita);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/citas/:id", authenticateToken, requireRole("admin", "jefe_taller", "recepcion"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertCitaSchema.partial().parse(req.body);
      const cita = await storage.updateCita(id, validated);
      if (!cita) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }
      res.json(cita);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Órdenes de Reparación routes
  app.get("/api/ordenes", authenticateToken, requireRole("admin", "jefe_taller", "recepcion", "mecanico"), async (req, res) => {
    try {
      const { estado } = req.query;
      const ordenes = await storage.getOrdenesReparacion(estado as string);
      res.json(ordenes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ordenes/:id", authenticateToken, requireRole("admin", "jefe_taller", "recepcion", "mecanico"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orden = await storage.getOrdenReparacion(id);
      if (!orden) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }
      res.json(orden);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ordenes", authenticateToken, requireRole("admin", "jefe_taller", "recepcion"), async (req, res) => {
    try {
      const validated = insertOrdenReparacionSchema.parse(req.body);
      const orden = await storage.createOrdenReparacion(validated);
      res.status(201).json(orden);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/ordenes/:id", authenticateToken, requireRole("admin", "jefe_taller", "recepcion", "mecanico"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertOrdenReparacionSchema.partial().parse(req.body);
      const orden = await storage.updateOrdenReparacion(id, validated);
      if (!orden) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }
      res.json(orden);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Partes de Trabajo routes
  app.get("/api/ordenes/:orId/partes", authenticateToken, requireRole("admin", "jefe_taller", "mecanico"), async (req, res) => {
    try {
      const orId = parseInt(req.params.orId);
      const partes = await storage.getPartesTrabajo(orId);
      res.json(partes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ordenes/:orId/partes", authenticateToken, requireRole("admin", "jefe_taller", "mecanico"), async (req, res) => {
    try {
      const orId = parseInt(req.params.orId);
      const validated = insertParteTrabajoSchema.parse({ ...req.body, orId });
      const parte = await storage.createParteTrabajo(validated);
      res.status(201).json(parte);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Artículos routes
  app.get("/api/articulos", authenticateToken, requireRole("admin", "jefe_taller", "almacen", "mecanico", "recepcion"), async (req, res) => {
    try {
      const { search } = req.query;
      const articulos = await storage.getArticulos(search as string);
      res.json(articulos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/articulos/:id", authenticateToken, requireRole("admin", "jefe_taller", "almacen", "mecanico", "recepcion"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const articulo = await storage.getArticulo(id);
      if (!articulo) {
        return res.status(404).json({ error: "Artículo no encontrado" });
      }
      res.json(articulo);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/articulos", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const validated = insertArticuloSchema.parse(req.body);
      const articulo = await storage.createArticulo(validated);
      res.status(201).json(articulo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/articulos/:id", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertArticuloSchema.partial().parse(req.body);
      const articulo = await storage.updateArticulo(id, validated);
      if (!articulo) {
        return res.status(404).json({ error: "Artículo no encontrado" });
      }
      res.json(articulo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Consumos routes
  app.get("/api/ordenes/:orId/consumos", authenticateToken, requireRole("admin", "jefe_taller", "almacen", "mecanico"), async (req, res) => {
    try {
      const orId = parseInt(req.params.orId);
      const consumos = await storage.getConsumosArticulos(orId);
      res.json(consumos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ordenes/:orId/consumos", authenticateToken, requireRole("admin", "jefe_taller", "almacen", "mecanico"), async (req, res) => {
    try {
      const orId = parseInt(req.params.orId);
      const validated = insertConsumoArticuloSchema.parse({ ...req.body, orId });
      const consumo = await storage.createConsumoArticulo(validated);
      res.status(201).json(consumo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Presupuestos routes
  app.get("/api/presupuestos", authenticateToken, requireRole("admin", "jefe_taller", "recepcion", "finanzas"), async (req, res) => {
    try {
      const presupuestos = await storage.getPresupuestos();
      res.json(presupuestos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/presupuestos/:id", authenticateToken, requireRole("admin", "jefe_taller", "recepcion", "finanzas"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const presupuesto = await storage.getPresupuesto(id);
      if (!presupuesto) {
        return res.status(404).json({ error: "Presupuesto no encontrado" });
      }
      res.json(presupuesto);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/presupuestos", authenticateToken, requireRole("admin", "jefe_taller", "recepcion"), async (req, res) => {
    try {
      const validated = insertPresupuestoSchema.parse(req.body);
      const presupuesto = await storage.createPresupuesto(validated);
      res.status(201).json(presupuesto);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/presupuestos/:id/aprobar", authenticateToken, requireRole("admin", "jefe_taller", "finanzas"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const presupuesto = await storage.updatePresupuesto(id, {
        aprobado: true,
        fechaAprobacion: new Date(),
      });
      if (!presupuesto) {
        return res.status(404).json({ error: "Presupuesto no encontrado" });
      }
      res.json(presupuesto);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Facturas routes
  app.get("/api/facturas", authenticateToken, requireRole("admin", "jefe_taller", "finanzas"), async (req, res) => {
    try {
      const facturas = await storage.getFacturas();
      res.json(facturas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/facturas/:id", authenticateToken, requireRole("admin", "jefe_taller", "finanzas"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const factura = await storage.getFactura(id);
      if (!factura) {
        return res.status(404).json({ error: "Factura no encontrada" });
      }
      const lineas = await storage.getLineasFactura(id);
      res.json({ ...factura, lineas });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/facturas", authenticateToken, requireRole("admin", "jefe_taller", "finanzas"), async (req, res) => {
    try {
      const { lineas, ...facturaData } = req.body;
      const validatedFactura = insertFacturaSchema.parse(facturaData);
      const factura = await storage.createFactura(validatedFactura);
      
      if (lineas && Array.isArray(lineas)) {
        for (const linea of lineas) {
          const validatedLinea = insertLineaFacturaSchema.parse({ ...linea, facturaId: factura.id });
          await storage.createLineaFactura(validatedLinea);
        }
      }
      
      const lineasCreadas = await storage.getLineasFactura(factura.id);
      res.status(201).json({ ...factura, lineas: lineasCreadas });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Cobros routes
  app.get("/api/cobros", authenticateToken, requireRole("admin", "jefe_taller", "finanzas"), async (req, res) => {
    try {
      const { facturaId } = req.query;
      const cobros = await storage.getCobros(facturaId ? parseInt(facturaId as string) : undefined);
      res.json(cobros);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cobros", authenticateToken, requireRole("admin", "jefe_taller", "finanzas"), async (req, res) => {
    try {
      const validated = insertCobroSchema.parse(req.body);
      const cobro = await storage.createCobro(validated);
      res.status(201).json(cobro);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Dashboard stats route
  app.get("/api/stats/dashboard", authenticateToken, requireRole("admin", "jefe_taller", "recepcion", "finanzas"), async (req, res) => {
    try {
      const ordenes = await storage.getOrdenesReparacion();
      const citas = await storage.getCitas();
      const facturas = await storage.getFacturas();
      const clientes = await storage.getClientes();
      const vehiculos = await storage.getVehiculos();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const citasHoy = citas.filter(c => {
        const fecha = new Date(c.fechaHora);
        return fecha >= today && fecha < tomorrow;
      });

      const facturasHoy = facturas.filter(f => {
        const fecha = new Date(f.fecha);
        return fecha >= today && fecha < tomorrow;
      });

      const ingresosHoy = facturasHoy.reduce((sum, f) => sum + parseFloat(f.total.toString()), 0);

      const ordenesAbiertas = ordenes.filter(o => 
        o.estado !== 'facturada' && o.estado !== 'terminada'
      ).length;

      res.json({
        ordenesAbiertas,
        citasHoy: citasHoy.length,
        ingresosHoy,
        ocupacion: 0,
        totalClientes: clientes.length,
        totalVehiculos: vehiculos.length,
        ordenesDelMes: ordenes.length,
        citasHoyData: citasHoy,
        ordenesRecientes: ordenes.slice(0, 5),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Proveedores
  app.get("/api/proveedores", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const { search } = req.query;
      const proveedores = await storage.getProveedores(search as string);
      res.json(proveedores);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/proveedores/:id", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const proveedor = await storage.getProveedor(id);
      if (!proveedor) {
        return res.status(404).json({ error: "Proveedor no encontrado" });
      }
      res.json(proveedor);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/proveedores", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const validated = insertProveedorSchema.parse(req.body);
      const proveedor = await storage.createProveedor(validated);
      res.status(201).json(proveedor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/proveedores/:id", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertProveedorSchema.partial().parse(req.body);
      const proveedor = await storage.updateProveedor(id, validated);
      if (!proveedor) {
        return res.status(404).json({ error: "Proveedor no encontrado" });
      }
      res.json(proveedor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Pedidos de Compra
  app.get("/api/pedidos-compra", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const { estado } = req.query;
      const pedidos = await storage.getPedidosCompra(estado as string);
      res.json(pedidos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pedidos-compra/:id", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pedido = await storage.getPedidoCompra(id);
      if (!pedido) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }
      res.json(pedido);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/pedidos-compra", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const validated = insertPedidoCompraSchema.parse(req.body);
      const pedido = await storage.createPedidoCompra(validated);
      res.status(201).json(pedido);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/pedidos-compra/:id", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertPedidoCompraSchema.partial().parse(req.body);
      const pedido = await storage.updatePedidoCompra(id, validated);
      if (!pedido) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }
      res.json(pedido);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/pedidos-compra/:id/lineas", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const pedidoId = parseInt(req.params.id);
      const lineas = await storage.getLineasPedido(pedidoId);
      res.json(lineas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/pedidos-compra/:id/lineas", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const pedidoId = parseInt(req.params.id);
      const validated = insertLineaPedidoSchema.parse({ ...req.body, pedidoId });
      const linea = await storage.createLineaPedido(validated);
      res.status(201).json(linea);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/pedidos-compra/lineas/:id", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertLineaPedidoSchema.partial().parse(req.body);
      const linea = await storage.updateLineaPedido(id, validated);
      if (!linea) {
        return res.status(404).json({ error: "Línea de pedido no encontrada" });
      }
      res.json(linea);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Recepciones
  app.get("/api/recepciones", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const recepciones = await storage.getRecepciones();
      res.json(recepciones);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/recepciones/:id", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recepcion = await storage.getRecepcion(id);
      if (!recepcion) {
        return res.status(404).json({ error: "Recepción no encontrada" });
      }
      res.json(recepcion);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/recepciones", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const validated = insertRecepcionSchema.parse(req.body);
      const recepcion = await storage.createRecepcion(validated);
      res.status(201).json(recepcion);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/recepciones/:id/lineas", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const recepcionId = parseInt(req.params.id);
      const lineas = await storage.getLineasRecepcion(recepcionId);
      res.json(lineas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/recepciones/:id/lineas", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const recepcionId = parseInt(req.params.id);
      const validated = insertLineaRecepcionSchema.parse({ ...req.body, recepcionId });
      const linea = await storage.createLineaRecepcion(validated);
      res.status(201).json(linea);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Ubicaciones
  app.get("/api/ubicaciones", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const ubicaciones = await storage.getUbicaciones();
      res.json(ubicaciones);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ubicaciones/:id", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ubicacion = await storage.getUbicacion(id);
      if (!ubicacion) {
        return res.status(404).json({ error: "Ubicación no encontrada" });
      }
      res.json(ubicacion);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ubicaciones", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const validated = insertUbicacionSchema.parse(req.body);
      const ubicacion = await storage.createUbicacion(validated);
      res.status(201).json(ubicacion);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/ubicaciones/:id", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertUbicacionSchema.partial().parse(req.body);
      const ubicacion = await storage.updateUbicacion(id, validated);
      if (!ubicacion) {
        return res.status(404).json({ error: "Ubicación no encontrada" });
      }
      res.json(ubicacion);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Movimientos de Almacén
  app.get("/api/movimientos-almacen", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const { articuloId } = req.query;
      const movimientos = await storage.getMovimientosAlmacen(articuloId ? parseInt(articuloId as string) : undefined);
      res.json(movimientos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/movimientos-almacen", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const validated = insertMovimientoAlmacenSchema.parse(req.body);
      const movimiento = await storage.createMovimientoAlmacen(validated);
      res.status(201).json(movimiento);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // CRM Postventa - Campañas
  app.get("/api/campanas", authenticateToken, requireRole("admin", "jefe_taller", "recepcion"), async (req, res) => {
    try {
      const { estado } = req.query;
      const campanas = await storage.getCampanas(estado as string);
      res.json(campanas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/campanas/:id", authenticateToken, requireRole("admin", "jefe_taller", "recepcion"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campana = await storage.getCampana(id);
      if (!campana) {
        return res.status(404).json({ error: "Campaña no encontrada" });
      }
      res.json(campana);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/campanas", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const validated = insertCampanaSchema.parse(req.body);
      const campana = await storage.createCampana(validated);
      res.status(201).json(campana);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/campanas/:id", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertCampanaSchema.partial().parse(req.body);
      const campana = await storage.updateCampana(id, validated);
      if (!campana) {
        return res.status(404).json({ error: "Campaña no encontrada" });
      }
      res.json(campana);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/campanas/:id", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCampana(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // CRM Postventa - Encuestas
  app.get("/api/encuestas", authenticateToken, async (req, res) => {
    try {
      const encuestas = await storage.getEncuestas();
      res.json(encuestas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/encuestas/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const encuesta = await storage.getEncuesta(id);
      if (!encuesta) {
        return res.status(404).json({ error: "Encuesta no encontrada" });
      }
      res.json(encuesta);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/encuestas", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const validated = insertEncuestaSchema.parse(req.body);
      const encuesta = await storage.createEncuesta(validated);
      res.status(201).json(encuesta);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/encuestas/:id", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertEncuestaSchema.partial().parse(req.body);
      const encuesta = await storage.updateEncuesta(id, validated);
      if (!encuesta) {
        return res.status(404).json({ error: "Encuesta no encontrada" });
      }
      res.json(encuesta);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/encuestas/:id", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEncuesta(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // CRM Postventa - Respuestas de Encuestas
  app.get("/api/respuestas-encuestas", authenticateToken, async (req, res) => {
    try {
      const { encuestaId, clienteId } = req.query;
      const respuestas = await storage.getRespuestasEncuestas(
        encuestaId ? parseInt(encuestaId as string) : undefined,
        clienteId ? parseInt(clienteId as string) : undefined
      );
      res.json(respuestas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/respuestas-encuestas", authenticateToken, async (req, res) => {
    try {
      const validated = insertRespuestaEncuestaSchema.parse(req.body);
      const respuesta = await storage.createRespuestaEncuesta(validated);
      res.status(201).json(respuesta);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/respuestas-encuestas/:id", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRespuestaEncuesta(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // CRM Postventa - Cupones
  app.get("/api/cupones", authenticateToken, async (req, res) => {
    try {
      const { clienteId, estado } = req.query;
      const cupones = await storage.getCupones(
        clienteId ? parseInt(clienteId as string) : undefined,
        estado as string
      );
      res.json(cupones);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/cupones/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cupon = await storage.getCupon(id);
      if (!cupon) {
        return res.status(404).json({ error: "Cupón no encontrado" });
      }
      res.json(cupon);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/cupones/codigo/:codigo", authenticateToken, async (req, res) => {
    try {
      const codigo = req.params.codigo;
      const cupon = await storage.getCuponByCodigo(codigo);
      if (!cupon) {
        return res.status(404).json({ error: "Cupón no encontrado" });
      }
      res.json(cupon);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cupones", authenticateToken, requireRole("admin", "jefe_taller", "finanzas"), async (req, res) => {
    try {
      const validated = insertCuponSchema.parse(req.body);
      const cupon = await storage.createCupon(validated);
      res.status(201).json(cupon);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/cupones/:id", authenticateToken, requireRole("admin", "jefe_taller", "finanzas"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertCuponSchema.partial().parse(req.body);
      const cupon = await storage.updateCupon(id, validated);
      if (!cupon) {
        return res.status(404).json({ error: "Cupón no encontrado" });
      }
      res.json(cupon);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/cupones/:id", authenticateToken, requireRole("admin", "jefe_taller", "finanzas"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCupon(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gestión de Residuos - Catálogo
  app.get("/api/catalogo-residuos", authenticateToken, async (req, res) => {
    try {
      const catalogos = await storage.getCatalogoResiduos();
      res.json(catalogos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/catalogo-residuos/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const catalogo = await storage.getCatalogoResiduo(id);
      if (!catalogo) {
        return res.status(404).json({ error: "Catálogo no encontrado" });
      }
      res.json(catalogo);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/catalogo-residuos", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const validated = insertCatalogoResiduoSchema.parse(req.body);
      const catalogo = await storage.createCatalogoResiduo(validated);
      res.status(201).json(catalogo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/catalogo-residuos/:id", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertCatalogoResiduoSchema.partial().parse(req.body);
      const catalogo = await storage.updateCatalogoResiduo(id, validated);
      if (!catalogo) {
        return res.status(404).json({ error: "Catálogo no encontrado" });
      }
      res.json(catalogo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/catalogo-residuos/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCatalogoResiduo(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gestión de Residuos - Contenedores
  app.get("/api/contenedores-residuos", authenticateToken, async (req, res) => {
    try {
      const contenedores = await storage.getContenedoresResiduos();
      res.json(contenedores);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/contenedores-residuos/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contenedor = await storage.getContenedorResiduo(id);
      if (!contenedor) {
        return res.status(404).json({ error: "Contenedor no encontrado" });
      }
      res.json(contenedor);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contenedores-residuos", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const validated = insertContenedorResiduoSchema.parse(req.body);
      const contenedor = await storage.createContenedorResiduo(validated);
      res.status(201).json(contenedor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/contenedores-residuos/:id", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertContenedorResiduoSchema.partial().parse(req.body);
      const contenedor = await storage.updateContenedorResiduo(id, validated);
      if (!contenedor) {
        return res.status(404).json({ error: "Contenedor no encontrado" });
      }
      res.json(contenedor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/contenedores-residuos/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContenedorResiduo(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gestión de Residuos - Gestores
  app.get("/api/gestores-residuos", authenticateToken, async (req, res) => {
    try {
      const gestores = await storage.getGestoresResiduos();
      res.json(gestores);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/gestores-residuos/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const gestor = await storage.getGestorResiduo(id);
      if (!gestor) {
        return res.status(404).json({ error: "Gestor no encontrado" });
      }
      res.json(gestor);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gestores-residuos", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const validated = insertGestorResiduoSchema.parse(req.body);
      const gestor = await storage.createGestorResiduo(validated);
      res.status(201).json(gestor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/gestores-residuos/:id", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertGestorResiduoSchema.partial().parse(req.body);
      const gestor = await storage.updateGestorResiduo(id, validated);
      if (!gestor) {
        return res.status(404).json({ error: "Gestor no encontrado" });
      }
      res.json(gestor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/gestores-residuos/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGestorResiduo(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gestión de Residuos - Registros
  app.get("/api/registros-residuos", authenticateToken, async (req, res) => {
    try {
      const { orId } = req.query;
      const registros = await storage.getRegistrosResiduos(
        orId ? parseInt(orId as string) : undefined
      );
      res.json(registros);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/registros-residuos/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const registro = await storage.getRegistroResiduo(id);
      if (!registro) {
        return res.status(404).json({ error: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/registros-residuos", authenticateToken, requireRole("admin", "jefe_taller", "recepcion", "mecanico"), async (req, res) => {
    try {
      const validated = insertRegistroResiduoSchema.parse(req.body);
      const registro = await storage.createRegistroResiduo(validated);
      res.status(201).json(registro);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/registros-residuos/:id", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertRegistroResiduoSchema.partial().parse(req.body);
      const registro = await storage.updateRegistroResiduo(id, validated);
      if (!registro) {
        return res.status(404).json({ error: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/registros-residuos/:id", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRegistroResiduo(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gestión de Residuos - Documentos DI
  app.get("/api/documentos-di", authenticateToken, async (req, res) => {
    try {
      const documentos = await storage.getDocumentosDI();
      res.json(documentos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/documentos-di/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const documento = await storage.getDocumentoDI(id);
      if (!documento) {
        return res.status(404).json({ error: "Documento DI no encontrado" });
      }
      res.json(documento);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/documentos-di", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const validated = insertDocumentoDISchema.parse(req.body);
      const documento = await storage.createDocumentoDI(validated);
      res.status(201).json(documento);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/documentos-di/:id", authenticateToken, requireRole("admin", "jefe_taller"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertDocumentoDISchema.partial().parse(req.body);
      const documento = await storage.updateDocumentoDI(id, validated);
      if (!documento) {
        return res.status(404).json({ error: "Documento DI no encontrado" });
      }
      res.json(documento);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/documentos-di/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDocumentoDI(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gestión de Residuos - Recogidas
  app.get("/api/recogidas-residuos", authenticateToken, async (req, res) => {
    try {
      const { documentoDIId } = req.query;
      const recogidas = await storage.getRecogidasResiduos(
        documentoDIId ? parseInt(documentoDIId as string) : undefined
      );
      res.json(recogidas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/recogidas-residuos/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recogida = await storage.getRecogidaResiduo(id);
      if (!recogida) {
        return res.status(404).json({ error: "Recogida no encontrada" });
      }
      res.json(recogida);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/recogidas-residuos", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const validated = insertRecogidaResiduoSchema.parse(req.body);
      const recogida = await storage.createRecogidaResiduo(validated);
      res.status(201).json(recogida);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/recogidas-residuos/:id", authenticateToken, requireRole("admin", "jefe_taller", "almacen"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertRecogidaResiduoSchema.partial().parse(req.body);
      const recogida = await storage.updateRecogidaResiduo(id, validated);
      if (!recogida) {
        return res.status(404).json({ error: "Recogida no encontrada" });
      }
      res.json(recogida);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/recogidas-residuos/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRecogidaResiduo(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
