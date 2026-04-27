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
  AlertTriangle,
  Receipt,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import type { Cita, OrdenReparacion, Cliente, Vehiculo, Articulo } from "@shared/schema";
import { format, startOfDay, isSameDay, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
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
  estadosOrdenes: { estado: string; count: number }[];
}

const COLORS = ["#3b82f6", "#f59e0b", "#22c55e", "#a855f7"];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const canManageFacturas = user?.roles?.some((r: string) => ["admin", "finanzas"].includes(r));

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
    refetchInterval: 30000,
  });

  const { data: articulos } = useQuery<Articulo[]>({
    queryKey: ["/api/articulos"],
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

  const createORMutation = useMutation({
    mutationFn: async (cita: Cita) => {
      return await apiRequest("/api/ordenes", {
        method: "POST",
        body: {
          clienteId: cita.clienteId,
          vehiculoId: cita.vehiculoId,
          citaId: cita.id,
          estado: "abierta",
          fechaApertura: new Date().toISOString(),
          kmEntrada: 0,
        },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes"] });
      toast({ title: "Orden de reparación creada", description: "Redirigiendo al detalle de la OR..." });
      setLocation(`/ordenes/${data.id}`);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo crear la orden", variant: "destructive" });
    },
  });

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const citasHoy = citas?.filter(c => 
    c.fechaHora && isSameDay(new Date(c.fechaHora), today)
  ) || [];

  const citasManana = citas?.filter(c =>
    c.fechaHora && isSameDay(new Date(c.fechaHora), tomorrow)
  ) || [];

  const getOrdenParaCita = (citaId: number) =>
    ordenes?.find(o => o.citaId === citaId) ?? null;

  const pendientesFacturar = ordenes?.filter(o => o.estado === "terminada").slice(0, 5) || [];
  const ordenesRecientes = ordenes?.filter(o => o.estado !== "terminada").slice(0, 5) || [];

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
    if (!stats?.estadosOrdenes) return [];
    return stats.estadosOrdenes.map(item => ({
      name: item.estado.replace('_', ' ').charAt(0).toUpperCase() + item.estado.replace('_', ' ').slice(1),
      value: item.count
    }));
  };

  const articulosBajoStockCount = articulos?.filter(a => (a.stock ?? 0) <= (a.stockMinimo ?? 0)).length || 0;

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

        <Card 
          className="border-red-200 dark:border-red-900 cursor-pointer hover-elevate"
          onClick={() => setLocation("/articulos")}
          data-testid="card-stock-bajo"
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600" data-testid="text-stock-bajo-kpi">
                {articulosBajoStockCount}
              </div>
            )}
            <p className="text-xs text-red-600">Ver artículos</p>
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
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Citas de Hoy
              {citasHoy.length > 0 && <Badge variant="secondary">{citasHoy.length}</Badge>}
            </CardTitle>
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
                    className="border rounded-lg p-3 space-y-1"
                    data-testid={`cita-hoy-${cita.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">
                          {cita.fechaHora ? format(new Date(cita.fechaHora), "HH:mm", { locale: es }) : "Sin hora"}
                        </span>
                        <Badge variant={cita.estado === 'confirmada' ? 'default' : 'secondary'} className="shrink-0">
                          {cita.estado}
                        </Badge>
                      </div>
                      {(() => {
                        const orExistente = getOrdenParaCita(cita.id);
                        return orExistente ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocation(`/ordenes/${orExistente.id}`)}
                            data-testid={`button-ver-or-dashboard-${cita.id}`}
                            className="shrink-0 text-xs"
                          >
                            <ChevronRight className="h-3 w-3 mr-1" />
                            Ver OR
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => createORMutation.mutate(cita)}
                            disabled={createORMutation.isPending}
                            data-testid={`button-crear-or-dashboard-${cita.id}`}
                            className="shrink-0 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Crear OR
                          </Button>
                        );
                      })()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{getClienteName(cita.clienteId)}</p>
                      <p>{getVehiculoInfo(cita.vehiculoId)}</p>
                      {cita.motivo && <p className="text-xs mt-1">{cita.motivo}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-500" />
              Pendientes de Facturar
              {pendientesFacturar.length > 0 && (
                <Badge className="bg-amber-500 text-white ml-1">{pendientesFacturar.length}</Badge>
              )}
            </CardTitle>
            <Button asChild variant="ghost" size="sm" data-testid="button-ver-pendientes">
              <Link href="/ordenes">Ver todas <ChevronRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2" data-testid="list-pendientes-facturar">
              {isLoadingOrdenes ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : pendientesFacturar.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Sin ORs pendientes de facturar</p>
                  </div>
                </div>
              ) : (
                pendientesFacturar.map((orden) => (
                  <div
                    key={orden.id}
                    className="flex items-center justify-between gap-2 border border-amber-200 dark:border-amber-900 rounded-md px-3 py-2 bg-amber-50/50 dark:bg-amber-950/20"
                    data-testid={`pendiente-facturar-${orden.id}`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{orden.codigo}</p>
                      <p className="text-xs text-muted-foreground truncate">{getClienteName(orden.clienteId)} · {getVehiculoInfo(orden.vehiculoId)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setLocation(`/ordenes/${orden.id}`)}
                        data-testid={`button-ver-or-${orden.id}`}
                      >
                        Ver
                      </Button>
                      {canManageFacturas && (
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/facturas?orId=${orden.id}&clienteId=${orden.clienteId}`)}
                          data-testid={`button-facturar-${orden.id}`}
                        >
                          <Receipt className="h-3 w-3 mr-1" />
                          Facturar
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Citas de Mañana ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Citas de Mañana
            {citasManana.length > 0 && <Badge variant="secondary">{citasManana.length}</Badge>}
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/citas">Ver agenda <ChevronRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingCitas ? (
            <Skeleton className="h-16 w-full" />
          ) : citasManana.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <p>Sin citas programadas para mañana</p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {citasManana.map((cita) => (
                <div key={cita.id} className="flex items-center gap-3 border rounded-md px-3 py-2" data-testid={`cita-manana-${cita.id}`}>
                  <div className="flex flex-col items-center text-center min-w-[36px]">
                    <span className="text-xs font-bold text-primary">
                      {cita.fechaHora ? format(new Date(cita.fechaHora), "HH:mm") : "--"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{getClienteName(cita.clienteId)}</p>
                    <p className="text-xs text-muted-foreground truncate">{getVehiculoInfo(cita.vehiculoId)}</p>
                    {cita.motivo && <p className="text-xs text-muted-foreground truncate">{cita.motivo}</p>}
                  </div>
                  <Badge variant={cita.estado === 'confirmada' ? 'default' : 'secondary'} className="shrink-0 text-xs">
                    {cita.estado}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
