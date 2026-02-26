import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  ClipboardList, 
  Euro, 
  TrendingUp, 
  Users,
  Car,
  Plus,
  Clock,
  AlertTriangle
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { Cita, OrdenReparacion, Cliente, Vehiculo } from "@shared/schema";
import { format, startOfDay, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
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

interface DashboardStats {
  ordenesAbiertas: number;
  citasHoy: number;
  ingresosHoy: number;
  ocupacion: number;
  totalClientes: number;
  totalVehiculos: number;
  ordenesDelMes: number;
  ingresosMensuales: { mes: string; total: number }[];
  articulosBajoStock: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
    refetchInterval: 30000,
  });

  const { data: citas, isLoading: isLoadingCitas } = useQuery<Cita[]>({
    queryKey: ["/api/citas"],
    refetchInterval: 30000,
  });

  const { data: ordenes, isLoading: isLoadingOrdenes } = useQuery<OrdenReparacion[]>({
    queryKey: ["/api/ordenes"],
    refetchInterval: 30000,
  });

  const { data: clientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
    refetchInterval: 30000,
  });

  const { data: vehiculos } = useQuery<Vehiculo[]>({
    queryKey: ["/api/vehiculos"],
    refetchInterval: 30000,
  });

  const today = startOfDay(new Date());
  const citasHoy = citas?.filter(c => 
    c.fechaHora && isSameDay(new Date(c.fechaHora), today)
  ) || [];

  const ordenesRecientes = ordenes?.slice(0, 5) || [];

  const getClienteName = (clienteId: number) => {
    const cliente = clientes?.find(c => c.id === clienteId);
    if (!cliente) return "Cliente desconocido";
    return cliente.tipo === 'empresa' ? cliente.razonSocial : `${cliente.nombre} ${cliente.apellidos}`;
  };

  const getVehiculoInfo = (vehiculoId: number) => {
    const vehiculo = vehiculos?.find(v => v.id === vehiculoId);
    return vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.matricula}` : "Vehículo desconocido";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const getEstadoData = () => {
    if (!ordenes) return [];
    const estados = {
      abierta: 0,
      en_curso: 0,
      terminada: 0,
      facturada: 0,
    };
    ordenes.forEach(o => {
      if (o.estado in estados) {
        estados[o.estado as keyof typeof estados]++;
      }
    });
    return Object.entries(estados).map(([name, value]) => ({ 
      name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1), 
      value 
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de actividad del taller</p>
        </div>
        <div className="flex gap-2">
          <Button asChild data-testid="button-nueva-cita">
            <Link href="/citas">
              <Calendar className="h-4 w-4 mr-2" />
              Nueva Cita
            </Link>
          </Button>
          <Button asChild variant="default" data-testid="button-nueva-or">
            <Link href="/ordenes">
              <Plus className="h-4 w-4 mr-2" />
              Nueva OR
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OR Abiertas</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-or-abiertas">
                {stats?.ordenesAbiertas || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              En progreso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-citas-hoy">
                {stats?.citasHoy || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Hoy</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-ingresos-hoy">
                {formatCurrency(stats?.ingresosHoy || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Facturado hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-ocupacion">
                {stats?.ocupacion || 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Boxes ocupados
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600" data-testid="text-stock-bajo-kpi">
                {stats?.articulosBajoStock || 0}
              </div>
            )}
            <Button asChild variant="ghost" size="sm" className="h-auto p-0 text-xs text-red-600 hover:text-red-700">
              <Link href="/articulos">Ver artículos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por mes (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" data-testid="chart-ingresos">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.ingresosMensuales || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" name="Total Facturado" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Órdenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" data-testid="chart-estados">
              {isLoadingOrdenes ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getEstadoData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getEstadoData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Citas de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="list-citas-hoy">
              {isLoadingCitas ? (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              ) : citasHoy.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay citas programadas para hoy</p>
                  </div>
                </div>
              ) : (
                citasHoy.map((cita) => (
                  <div 
                    key={cita.id} 
                    className="border rounded-lg p-3 space-y-1 hover-elevate"
                    data-testid={`cita-hoy-${cita.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {cita.fechaHora ? format(new Date(cita.fechaHora), "HH:mm", { locale: es }) : "Sin hora"}
                        </span>
                      </div>
                      <Badge variant={cita.estado === 'confirmada' ? 'default' : 'secondary'}>
                        {cita.estado}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{getClienteName(cita.clienteId)}</p>
                      <p>{getVehiculoInfo(cita.vehiculoId)}</p>
                      <p className="text-xs mt-1">{cita.motivo}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Órdenes Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="list-ordenes-recientes">
              {isLoadingOrdenes ? (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              ) : ordenesRecientes.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay órdenes de reparación</p>
                  </div>
                </div>
              ) : (
                ordenesRecientes.map((orden) => (
                  <div 
                    key={orden.id} 
                    className="border rounded-lg p-3 space-y-1 hover-elevate"
                    data-testid={`orden-reciente-${orden.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">OR #{orden.codigo}</span>
                      <Badge variant={
                        orden.estado === 'abierta' ? 'default' : 
                        orden.estado === 'en_curso' ? 'secondary' :
                        orden.estado === 'terminada' ? 'default' : 'secondary'
                      }>
                        {orden.estado.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{getClienteName(orden.clienteId)}</p>
                      <p>{getVehiculoInfo(orden.vehiculoId)}</p>
                      <p className="text-xs mt-1">
                        {orden.fechaApertura ? format(new Date(orden.fechaApertura), "dd MMM yyyy", { locale: es }) : "Sin fecha"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-20 mb-2" />
            ) : (
              <div className="text-3xl font-bold mb-2" data-testid="text-total-clientes">
                {stats?.totalClientes || 0}
              </div>
            )}
            <Button asChild variant="outline" size="sm" className="w-full" data-testid="button-ver-clientes">
              <Link href="/clientes">Ver todos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehículos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-20 mb-2" />
            ) : (
              <div className="text-3xl font-bold mb-2" data-testid="text-total-vehiculos">
                {stats?.totalVehiculos || 0}
              </div>
            )}
            <Button asChild variant="outline" size="sm" className="w-full" data-testid="button-ver-vehiculos">
              <Link href="/vehiculos">Ver todos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              OR del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-20 mb-2" />
            ) : (
              <div className="text-3xl font-bold mb-2" data-testid="text-or-mes">
                {stats?.ordenesDelMes || 0}
              </div>
            )}
            <Button asChild variant="outline" size="sm" className="w-full" data-testid="button-ver-ordenes">
              <Link href="/ordenes">Ver todas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
