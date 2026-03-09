import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Receipt, ClipboardList, Users as UsersIcon, Package, 
  TrendingUp, AlertTriangle, UserPlus, Clock,
  BarChart2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#a855f7', '#ef4444', '#06b6d4'];

export default function Informes() {
  const { data: facturas, isLoading: loadingFacturas } = useQuery<any[]>({ queryKey: ["/api/facturas"] });
  const { data: ordenes, isLoading: loadingOrdenes } = useQuery<any[]>({ queryKey: ["/api/ordenes"] });
  const { data: clientes, isLoading: loadingClientes } = useQuery<any[]>({ queryKey: ["/api/clientes"] });
  const { data: articulos, isLoading: loadingArticulos } = useQuery<any[]>({ queryKey: ["/api/articulos"] });

  if (loadingFacturas || loadingOrdenes || loadingClientes || loadingArticulos) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // --- Procesamiento Facturación ---
  const now = new Date();
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const totalFacturadoMes = facturas?.filter(f => {
    const d = new Date(f.fecha);
    return d >= monthStart;
  }).reduce((acc, f) => acc + parseFloat(f.total || "0"), 0) || 0;

  const totalFacturadoMesAnterior = facturas?.filter(f => {
    const d = new Date(f.fecha);
    return d >= lastMonthStart && d <= lastMonthEnd;
  }).reduce((acc, f) => acc + parseFloat(f.total || "0"), 0) || 0;

  const variacionFacturacion = totalFacturadoMesAnterior === 0 ? 100 : 
    ((totalFacturadoMes - totalFacturadoMesAnterior) / totalFacturadoMesAnterior) * 100;

  // Gráfico Facturación por Mes (últimos 6 meses)
  const facturacionMensual = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(now, 5 - i);
    const label = format(date, 'MMM', { locale: es });
    const total = facturas?.filter(f => isSameMonth(new Date(f.fecha), date))
      .reduce((acc, f) => acc + parseFloat(f.total || "0"), 0) || 0;
    return { mes: label.charAt(0).toUpperCase() + label.slice(1), total };
  });

  // Top 5 Clientes por Facturación
  const facturacionPorCliente = facturas?.reduce((acc: any, f) => {
    acc[f.clienteId] = (acc[f.clienteId] || 0) + parseFloat(f.total || "0");
    return acc;
  }, {});

  const topClientes = Object.entries(facturacionPorCliente || {})
    .map(([id, total]) => {
      const cliente = clientes?.find(c => c.id === parseInt(id));
      return { 
        nombre: cliente ? (cliente.nombre || cliente.razonSocial) : `Cliente ${id}`,
        total: total as number
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // --- Procesamiento Órdenes ---
  const ordenesMes = ordenes?.filter(o => new Date(o.fechaApertura) >= monthStart).length || 0;
  const ordenesAbiertas = ordenes?.filter(o => ["abierta", "en_curso"].includes(o.estado)).length || 0;
  
  const distribucionEstados = ordenes?.reduce((acc: any[], o) => {
    const existing = acc.find(item => item.name === o.estado);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: o.estado, value: 1 });
    }
    return acc;
  }, []).map(item => ({ ...item, name: item.name.replace('_', ' ').charAt(0).toUpperCase() + item.name.slice(1).replace('_', ' ') }));

  // --- Procesamiento Clientes ---
  const clientesNuevosMes = clientes?.filter(c => new Date(c.createdAt) >= monthStart).length || 0;
  const distribucionTipoCliente = [
    { name: 'Particular', value: clientes?.filter(c => c.tipo === 'particular').length || 0 },
    { name: 'Empresa', value: clientes?.filter(c => c.tipo === 'empresa').length || 0 }
  ];

  // --- Procesamiento Inventario ---
  const articulosBajoStock = articulos?.filter(a => (a.stock || 0) <= (a.stockMinimo || 0)) || [];
  const valorTotalInventario = articulos?.reduce((acc, a) => acc + ( (a.stock || 0) * parseFloat(a.precioCoste || "0") ), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Informes & Estadísticas</h1>
      </div>

      <Tabs defaultValue="facturacion" className="space-y-4">
        <TabsList data-testid="tabs-informes">
          <TabsTrigger value="facturacion">Facturación</TabsTrigger>
          <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="facturacion" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Facturado este Mes</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalFacturadoMes)}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className={variacionFacturacion >= 0 ? "text-green-600" : "text-red-600"}>
                    {variacionFacturacion >= 0 ? "+" : ""}{variacionFacturacion.toFixed(1)}%
                  </span>{" "}
                  respecto al mes anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Facturas Emitidas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{facturas?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Total histórico</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Evolución de Ingresos</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={facturacionMensual}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => `${value}€`} />
                    <Tooltip 
                      formatter={(value: any) => [new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value), 'Total']}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top 5 Clientes</CardTitle>
                <CardDescription>Por volumen de facturación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {topClientes.map((c, i) => (
                    <div className="flex items-center" key={i}>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{c.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c.total)}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">#{i + 1}</div>
                    </div>
                  ))}
                  {topClientes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Sin datos suficientes</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ordenes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Órdenes este Mes</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ordenesMes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Taller</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ordenesAbiertas}</div>
                <p className="text-xs text-muted-foreground">Abiertas o En Curso</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionEstados}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distribucionEstados?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientes?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nuevos este Mes</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientesNuevosMes}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Tipo de Cliente</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionTipoCliente}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distribucionTipoCliente.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventario" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Inventario (Coste)</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valorTotalInventario)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Artículos Bajo Mínimo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{articulosBajoStock.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Artículos con Stock Bajo</CardTitle>
              <CardDescription>Artículos que requieren reposición inmediata</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Stock Actual</TableHead>
                    <TableHead className="text-right">Stock Mínimo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articulosBajoStock.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.referencia}</TableCell>
                      <TableCell>{a.descripcion}</TableCell>
                      <TableCell className="text-right">{a.stock}</TableCell>
                      <TableCell className="text-right">{a.stockMinimo}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Reponer</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {articulosBajoStock.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No hay artículos bajo el stock mínimo
                      </TableCell>
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
