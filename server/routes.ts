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

  app.get("/api/clientes/:id", authenticateToken, async (req, res) => {
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

  app.post("/api/clientes", authenticateToken, async (req, res) => {
    try {
      const validated = insertClienteSchema.parse(req.body);
      const cliente = await storage.createCliente(validated);
      res.status(201).json(cliente);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/clientes/:id", authenticateToken, async (req, res) => {
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
  app.get("/api/vehiculos", authenticateToken, async (req, res) => {
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

  app.get("/api/vehiculos/:id", authenticateToken, async (req, res) => {
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

  app.post("/api/vehiculos", authenticateToken, async (req, res) => {
    try {
      const validated = insertVehiculoSchema.parse(req.body);
      const vehiculo = await storage.createVehiculo(validated);
      res.status(201).json(vehiculo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/vehiculos/:id", authenticateToken, async (req, res) => {
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
  app.get("/api/citas", authenticateToken, async (req, res) => {
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

  app.get("/api/citas/:id", authenticateToken, async (req, res) => {
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

  app.post("/api/citas", authenticateToken, async (req, res) => {
    try {
      const validated = insertCitaSchema.parse(req.body);
      const cita = await storage.createCita(validated);
      res.status(201).json(cita);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/citas/:id", authenticateToken, async (req, res) => {
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
  app.get("/api/ordenes", authenticateToken, async (req, res) => {
    try {
      const { estado } = req.query;
      const ordenes = await storage.getOrdenesReparacion(estado as string);
      res.json(ordenes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ordenes/:id", authenticateToken, async (req, res) => {
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

  app.post("/api/ordenes", authenticateToken, async (req, res) => {
    try {
      const validated = insertOrdenReparacionSchema.parse(req.body);
      const orden = await storage.createOrdenReparacion(validated);
      res.status(201).json(orden);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/ordenes/:id", authenticateToken, async (req, res) => {
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
  app.get("/api/ordenes/:orId/partes", authenticateToken, async (req, res) => {
    try {
      const orId = parseInt(req.params.orId);
      const partes = await storage.getPartesTrabajo(orId);
      res.json(partes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ordenes/:orId/partes", authenticateToken, async (req, res) => {
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
  app.get("/api/articulos", authenticateToken, async (req, res) => {
    try {
      const { search } = req.query;
      const articulos = await storage.getArticulos(search as string);
      res.json(articulos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/articulos/:id", authenticateToken, async (req, res) => {
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

  app.post("/api/articulos", authenticateToken, async (req, res) => {
    try {
      const validated = insertArticuloSchema.parse(req.body);
      const articulo = await storage.createArticulo(validated);
      res.status(201).json(articulo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/articulos/:id", authenticateToken, async (req, res) => {
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
  app.get("/api/ordenes/:orId/consumos", authenticateToken, async (req, res) => {
    try {
      const orId = parseInt(req.params.orId);
      const consumos = await storage.getConsumosArticulos(orId);
      res.json(consumos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ordenes/:orId/consumos", authenticateToken, async (req, res) => {
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
  app.get("/api/presupuestos", authenticateToken, async (req, res) => {
    try {
      const presupuestos = await storage.getPresupuestos();
      res.json(presupuestos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/presupuestos/:id", authenticateToken, async (req, res) => {
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

  app.post("/api/presupuestos", authenticateToken, async (req, res) => {
    try {
      const validated = insertPresupuestoSchema.parse(req.body);
      const presupuesto = await storage.createPresupuesto(validated);
      res.status(201).json(presupuesto);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/presupuestos/:id/aprobar", authenticateToken, async (req, res) => {
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
  app.get("/api/facturas", authenticateToken, async (req, res) => {
    try {
      const facturas = await storage.getFacturas();
      res.json(facturas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/facturas/:id", authenticateToken, async (req, res) => {
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

  app.post("/api/facturas", authenticateToken, async (req, res) => {
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
  app.get("/api/cobros", authenticateToken, async (req, res) => {
    try {
      const { facturaId } = req.query;
      const cobros = await storage.getCobros(facturaId ? parseInt(facturaId as string) : undefined);
      res.json(cobros);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cobros", authenticateToken, async (req, res) => {
    try {
      const validated = insertCobroSchema.parse(req.body);
      const cobro = await storage.createCobro(validated);
      res.status(201).json(cobro);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Dashboard stats route
  app.get("/api/stats/dashboard", authenticateToken, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
