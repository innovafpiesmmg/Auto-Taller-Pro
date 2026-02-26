import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ClipboardList, 
  Receipt, 
  Package,
  AlertTriangle
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Types from schema (simplified for the query)
interface Factura {
  id: number;
  total: string;
  fecha: string;
  clienteId: number;
}

interface Orden {
  id: number;
  estado: string;
  fechaApertura: string;
}

interface Cliente {
  id: number;
  tipo: string;
  nombre: string;
  createdAt: string;
}

interface Articulo {
  id: number;
  descripcion: string;
  stock: number | null;
  stockMinimo: number | null;
  precioVenta: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Informes() {
  const { data: facturas = [] } = useQuery<Factura[]>({ queryKey: ["/api/facturas"] });
  const { data: ordenes = [] } = useQuery<Orden[]>({ queryKey: ["/api/ordenes"] });
  const { data: clientes = [] } = useQuery<Cliente[]>({ queryKey: ["/api/clientes"] });
  const { data: articulos = [] } = useQuery<Articulo[]>({ queryKey: ["/api/articulos"] });

  // --- Facturación Helpers ---
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const totalFacturadoMesActual = facturas
    .filter(f => {
      const d = parseISO(f.fecha);
      return isWithinInterval(d, { start: currentMonthStart, end: currentMonthEnd });
    })
    .reduce((acc, f) => acc + parseFloat(f.total || "0"), 0);

  const totalFacturadoMesAnterior = facturas
    .filter(f => {
      const d = parseISO(f.fecha);
      return isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd });
    })
    .reduce((acc, f) => acc + parseFloat(f.total || "0"), 0);

  const diffFacturacion = totalFacturadoMesAnterior === 0 
    ? 100 
    : ((totalFacturadoMesActual - totalFacturadoMesAnterior) / totalFacturadoMesAnterior) * 100;

  // Last 6 months bar chart data
  const chartDataFacturacion = Array.from({ length: 6 }).map((_, i) => {
    const monthDate = subMonths(now, 5 - i);
    const mStart = startOfMonth(monthDate);
    const mEnd = endOfMonth(monthDate);
    const total = facturas
      .filter(f => isWithinInterval(parseISO(f.fecha), { start: mStart, end: mEnd }))
      .reduce((acc, f) => acc + parseFloat(f.total || "0"), 0);
    
    return {
      name: format(monthDate, 'MMM', { locale: es }),
      total
    };
  });

  // Top 5 clients
  const topClientes = Array.from(
    facturas.reduce((acc, f) => {
      acc.set(f.clienteId, (acc.get(f.clienteId) || 0) + parseFloat(f.total || "0"));
      return acc;
    }, new Map<number, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, total]) => ({
      nombre: clientes.find(c => c.id === id)?.nombre || `Cliente #${id}`,
      total
    }));

  // --- Órdenes Helpers ---
  const ordenesMesActual = ordenes.filter(o => 
    isWithinInterval(parseISO(o.fechaApertura), { start: currentMonthStart, end: currentMonthEnd })
  ).length;

  const ordenesAbiertas = ordenes.filter(o => o.estado !== 'facturada' && o.estado !== 'anulada').length;

  const ordenesPorEstado = Array.from(
    ordenes.reduce((acc, o) => {
      acc.set(o.estado, (acc.get(o.estado) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  // --- Clientes Helpers ---
  const clientesNuevosMes = clientes.filter(c => 
    c.createdAt && isWithinInterval(parseISO(c.createdAt), { start: currentMonthStart, end: currentMonthEnd })
  ).length;

  const clientesPorTipo = clientes.reduce((acc, c) => {
    acc[c.tipo] = (acc[c.tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // --- Inventario Helpers ---
  const articulosBajoMinimo = articulos.filter(a => (a.stock ?? 0) <= (a.stockMinimo ?? 0));
  const valorTotalInventario = articulos.reduce((acc, a) => 
    acc + ((a.stock ?? 0) * parseFloat(a.precioVenta || "0")), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Informes y Estadísticas</h1>
        <p className="text-muted-foreground">Analiza el rendimiento de tu taller.</p>
      </div>

      <Tabs defaultValue="facturacion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="facturacion">Facturación</TabsTrigger>
          <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
        </TabsList>

        {/* --- Facturación Tab --- */}
        <TabsContent value="facturacion" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Facturado este mes</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFacturadoMesActual.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {diffFacturacion >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={diffFacturacion >= 0 ? "text-green-500" : "text-red-500"}>
                    {Math.abs(diffFacturacion).toFixed(1)}%
                  </span>
                  vs mes anterior
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Evolución Facturación (6 meses)</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataFacturacion}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${value}€`} />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toLocaleString('es-ES')} €`, "Total"]}
                      />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top 5 Clientes</CardTitle>
                <CardDescription>Por volumen de facturación histórico</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topClientes.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{c.nombre}</TableCell>
                        <TableCell className="text-right">{c.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Órdenes Tab --- */}
        <TabsContent value="ordenes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Órdenes este mes</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ordenesMesActual}</div>
                <p className="text-xs text-muted-foreground">Nuevas aperturas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Órdenes Abiertas</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ordenesAbiertas}</div>
                <p className="text-xs text-muted-foreground">En curso o pendientes</p>
              </CardContent>
            </Card>
          </div>

          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ordenesPorEstado}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ordenesPorEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Clientes Tab --- */}
        <TabsContent value="clientes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientes.length}</div>
                <p className="text-xs text-muted-foreground">Registrados en sistema</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nuevos este mes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientesNuevosMes}</div>
                <p className="text-xs text-muted-foreground">Captación mensual</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Cliente</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Porcentaje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(clientesPorTipo).map(([tipo, count]) => (
                    <TableRow key={tipo}>
                      <TableCell className="font-medium capitalize">{tipo}</TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                      <TableCell className="text-right">{((count / clientes.length) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Inventario Tab --- */}
        <TabsContent value="inventario" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Artículos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{articulos.length}</div>
                <p className="text-xs text-muted-foreground">Referencias únicas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{articulosBajoMinimo.length}</div>
                <p className="text-xs text-muted-foreground">Requieren reposición</p>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Estimado Inventario</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{valorTotalInventario.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                <p className="text-xs text-muted-foreground">Basado en precio venta actual</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Artículos con Stock Bajo</CardTitle>
              <CardDescription>Artículos por debajo del stock mínimo configurado</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artículo</TableHead>
                    <TableHead className="text-right">Stock Actual</TableHead>
                    <TableHead className="text-right">Stock Mínimo</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articulosBajoMinimo.slice(0, 10).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.descripcion}</TableCell>
                      <TableCell className="text-right">{a.stock ?? 0}</TableCell>
                      <TableCell className="text-right">{a.stockMinimo ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">Crítico</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {articulosBajoMinimo.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">No hay artículos con stock bajo</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
