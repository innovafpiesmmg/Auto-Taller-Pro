import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Car,
  User as UserIcon,
  Plus,
  CheckCircle2,
  Clock,
  Wrench,
  Package,
  FileText,
  PlayCircle,
  CheckCircle,
  Printer,
  ClipboardCheck,
  Trash2,
  Save,
  PauseCircle,
  StickyNote,
  Gauge,
  AlertCircle,
  ChevronRight,
  Receipt,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RecepcionChecklist } from "@/components/recepcion-checklist";
import { CamaraFotos } from "@/components/camara-fotos";
import { RecepcionPrint } from "@/components/recepcion-print";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  insertParteTrabajoSchema,
  insertConsumoArticuloSchema,
  type OrdenReparacion,
  type ParteTrabajo,
  type ConsumoArticulo,
  type Articulo,
  type User,
  type Presupuesto,
} from "@shared/schema";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  observacion?: string;
}

type OrdenConDatos = OrdenReparacion & {
  clienteNombre?: string;
  clienteNif?: string;
  clienteTelefono?: string;
  vehiculoMatricula?: string;
  vehiculoMarca?: string;
  vehiculoModelo?: string;
  vehiculoAnio?: number;
  recepcionadoPorId?: number | null;
  recepcionadoPorNombre?: string;
};

export default function OrdenDetalle() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [printOpen, setPrintOpen] = useState(false);
  const [obsValue, setObsValue] = useState<string>("");
  const [obsEditing, setObsEditing] = useState(false);
  const [kmSalidaValue, setKmSalidaValue] = useState<string>("");

  const { data: orden, isLoading: isLoadingOrden } = useQuery<OrdenConDatos>({
    queryKey: ["/api/ordenes", id],
    enabled: !!id,
  });

  const { data: partes, isLoading: isLoadingPartes } = useQuery<ParteTrabajo[]>({
    queryKey: ["/api/ordenes", id, "partes"],
    enabled: !!id,
  });

  const { data: consumos, isLoading: isLoadingConsumos } = useQuery<(ConsumoArticulo & { articulo?: Articulo })[]>({
    queryKey: ["/api/ordenes", id, "consumos"],
    enabled: !!id,
  });

  const { data: articulos } = useQuery<Articulo[]>({
    queryKey: ["/api/articulos"],
  });

  const { data: usuarios } = useQuery<User[]>({
    queryKey: ["/api/users/directorio"],
  });

  const { data: presupuestoVinculado } = useQuery<Presupuesto | null>({
    queryKey: ["/api/ordenes", id, "presupuesto"],
    enabled: !!id,
  });

  const aprobarPresupuestoMutation = useMutation({
    mutationFn: async (presupuestoId: number) => {
      return apiRequest(`/api/presupuestos/${presupuestoId}/aprobar`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes", id, "presupuesto"] });
      queryClient.invalidateQueries({ queryKey: ["/api/presupuestos"] });
      toast({ title: "Presupuesto aprobado", description: "Ya puedes iniciar los trabajos en esta OR." });
    },
    onError: (error: any) => {
      toast({ title: "Error al aprobar", description: error.message, variant: "destructive" });
    },
  });

  const presupuestoPendiente = !!(presupuestoVinculado && !presupuestoVinculado.aprobado);

  const updateOrdenMutation = useMutation({
    mutationFn: async (updates: Partial<OrdenReparacion>) => {
      return apiRequest(`/api/ordenes/${id}`, { method: "PUT", body: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudieron guardar los cambios. Comprueba la conexión.",
        variant: "destructive",
      });
    },
  });

  // Wrapper que añade onSuccess/onError por llamada sin duplicar el onError global
  const updateOrden = (
    updates: Partial<OrdenReparacion>,
    callbacks?: { onSuccess?: () => void }
  ) => {
    updateOrdenMutation.mutate(updates, {
      onSuccess: () => {
        callbacks?.onSuccess?.();
      },
    });
  };

  const addParteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/ordenes/${id}/partes`, { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes", id, "partes"] });
      toast({ title: "Parte de trabajo añadido" });
      parteForm.reset({
        descripcion: "",
        mecanicoId: undefined,
        tiempoEstimado: "1.00",
        precioMO: "45.00",
        completado: false,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al añadir parte",
        description: error.message || "No se pudo guardar el parte de trabajo.",
        variant: "destructive",
      });
    },
  });

  const addConsumoMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/ordenes/${id}/consumos`, { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes", id, "consumos"] });
      toast({ title: "Recambio añadido" });
      consumoForm.reset({
        articuloId: undefined,
        cantidad: "1.00",
        precioUnitario: "0.00",
        igic: "7.00",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al añadir recambio",
        description: error.message || "No se pudo guardar el recambio.",
        variant: "destructive",
      });
    },
  });

  const deleteParteMutation = useMutation({
    mutationFn: async (parteId: number) => {
      return apiRequest(`/api/ordenes/${id}/partes/${parteId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes", id, "partes"] });
      toast({ title: "Parte de trabajo eliminada" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar parte",
        description: error.message || "No se pudo eliminar la parte.",
        variant: "destructive",
      });
    },
  });

  const deleteConsumoMutation = useMutation({
    mutationFn: async (consumoId: number) => {
      return apiRequest(`/api/ordenes/${id}/consumos/${consumoId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes", id, "consumos"] });
      toast({ title: "Recambio eliminado" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar recambio",
        description: error.message || "No se pudo eliminar el recambio.",
        variant: "destructive",
      });
    },
  });

  const parteForm = useForm({
    resolver: zodResolver(insertParteTrabajoSchema.omit({ orId: true })),
    defaultValues: {
      descripcion: "",
      mecanicoId: undefined,
      tiempoEstimado: "1.00",
      precioMO: "45.00",
      completado: false,
    },
  });

  const consumoForm = useForm({
    resolver: zodResolver(insertConsumoArticuloSchema.omit({ orId: true })),
    defaultValues: {
      articuloId: undefined,
      cantidad: "1.00",
      precioUnitario: "0.00",
      igic: "7.00",
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateOrden({ estado: newStatus as any });
  };

  const handleRecepcionistChange = (userId: string) => {
    updateOrden({ recepcionadoPorId: parseInt(userId) });
  };

  const handleSaveRecepcion = (checklist: ChecklistItem[], signature: string) => {
    updateOrden(
      {
        checklistRecepcion: JSON.stringify(checklist),
        firmaDigital: signature,
      },
      {
        onSuccess: () => {
          toast({
            title: "Recepción guardada",
            description: "Checklist y firma guardados correctamente.",
          });
        },
      }
    );
  };

  const handleSaveFotos = (fotos: string[]) => {
    updateOrden({ fotosRecepcion: JSON.stringify(fotos) });
  };

  // Sync inline editable fields when orden loads
  const prevOrdenId = useRef<number | null>(null);
  if (orden && orden.id !== prevOrdenId.current) {
    prevOrdenId.current = orden.id;
    setObsValue(orden.observaciones ?? "");
    setKmSalidaValue(orden.kmSalida != null ? String(orden.kmSalida) : "");
  }

  const handleSaveObs = () => {
    updateOrden({ observaciones: obsValue }, {
      onSuccess: () => toast({ title: "Observaciones guardadas" }),
    });
    setObsEditing(false);
  };

  const handleSaveKmSalida = () => {
    const km = kmSalidaValue !== "" ? parseInt(kmSalidaValue, 10) : null;
    updateOrden({ kmSalida: km });
  };

  const handleCreateFactura = () => {
    navigate(`/facturas?orId=${id}&clienteId=${orden?.clienteId}`);
  };

  if (isLoadingOrden || isLoadingPartes || isLoadingConsumos) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Orden no encontrada</p>
      </div>
    );
  }

  const checklist: ChecklistItem[] | undefined = orden.checklistRecepcion
    ? JSON.parse(orden.checklistRecepcion)
    : undefined;

  const fotosRecepcion: string[] = (() => {
    try { return JSON.parse((orden as any).fotosRecepcion || "[]"); }
    catch { return []; }
  })();

  const totalMO = partes?.reduce((sum, p) => sum + (Number(p.precioMO || 0) * Number(p.tiempoEstimado || 0)), 0) || 0;
  const totalArticulos = consumos?.reduce((sum, c) => sum + (Number(c.precioUnitario || 0) * Number(c.cantidad || 0)), 0) || 0;
  const totalIgic = consumos?.reduce((sum, c) => sum + (Number(c.precioUnitario || 0) * Number(c.cantidad || 0) * (Number(c.igic || 0) / 100)), 0) || 0;
  const totalGeneral = totalMO + totalArticulos + totalIgic;

  const mecanicos = usuarios?.filter(u => u.roles?.some((r: string) => ["mecanico", "jefe_taller"].includes(r))) || [];
  const recepcionistas = usuarios?.filter(u => u.roles?.some((r: string) => ["recepcion", "admin", "jefe_taller"].includes(r))) || [];

  const recepcionCompleta = !!(orden.checklistRecepcion && orden.firmaDigital && orden.recepcionadoPorId);

  const pasosFlujo = [
    { id: "recepcion", label: "Recepción", icon: ClipboardCheck, done: recepcionCompleta },
    { id: "trabajo", label: "Trabajo", icon: Wrench, done: ["en_curso", "a_la_espera", "terminada", "facturada"].includes(orden.estado) },
    { id: "terminada", label: "Terminada", icon: CheckCircle, done: ["terminada", "facturada"].includes(orden.estado) },
    { id: "facturada", label: "Facturada", icon: Receipt, done: orden.estado === "facturada" },
  ];

  return (
    <div className="space-y-6 pb-20">

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/ordenes")} data-testid="button-volver" className="mt-1 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">{orden.codigo}</h1>
            {orden.estado === "terminada" && (
              <Button onClick={handleCreateFactura} data-testid="button-crear-factura">
                <Receipt className="mr-2 h-4 w-4" />
                Crear Factura
              </Button>
            )}
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {orden.fechaApertura ? format(new Date(orden.fechaApertura), "dd MMM yyyy HH:mm", { locale: es }) : "-"}
            {orden.clienteNombre && (
              <><span className="mx-1">·</span><UserIcon className="h-3.5 w-3.5 shrink-0" />{orden.clienteNombre}</>
            )}
            {orden.vehiculoMatricula && (
              <><span className="mx-1">·</span><Car className="h-3.5 w-3.5 shrink-0" />{orden.vehiculoMatricula}</>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)} className="shrink-0" data-testid="button-imprimir-recepcion-header">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {/* ── Barra de progreso del flujo ──────────────────────────────────── */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            {pasosFlujo.map((paso, index) => {
              const isCurrent =
                (paso.id === "recepcion" && !pasosFlujo[1].done) ||
                (paso.id === "trabajo" && pasosFlujo[1].done && !pasosFlujo[2].done) ||
                (paso.id === "terminada" && pasosFlujo[2].done && !pasosFlujo[3].done) ||
                (paso.id === "facturada" && pasosFlujo[3].done);
              return (
                <div key={paso.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                      paso.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCurrent
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted bg-muted/30 text-muted-foreground"
                    }`}>
                      <paso.icon className="h-4 w-4" />
                    </div>
                    <span className={`text-xs font-medium ${paso.done || isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                      {paso.label}
                    </span>
                  </div>
                  {index < pasosFlujo.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full ${paso.done ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Presupuesto vinculado ────────────────────────────────────────── */}
      {presupuestoVinculado && (
        <div
          className="flex items-center justify-between gap-4 rounded-md border px-5 py-3 bg-muted/30"
          data-testid="banner-presupuesto-vinculado"
        >
          <div className="flex items-center gap-3 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <span className="text-muted-foreground">Presupuesto de origen: </span>
              <span className="font-semibold">{presupuestoVinculado.codigo}</span>
              <span className="text-muted-foreground ml-2">
                · {parseFloat(presupuestoVinculado.total.toString()).toFixed(2)} €
              </span>
              {presupuestoVinculado.aprobado && (
                <Badge variant="outline" className="ml-2 text-green-600 border-green-600">Aprobado</Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/presupuestos")}
            data-testid="button-ver-presupuesto"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Ver presupuesto
          </Button>
        </div>
      )}

      {/* ── Banner: lista para facturar ──────────────────────────────────── */}
      {orden.estado === "terminada" && (
        <div
          className="flex items-center justify-between gap-4 rounded-md border border-green-500/30 bg-green-50 dark:bg-green-950/30 px-5 py-3"
          data-testid="banner-pendiente-facturar"
        >
          <div className="flex items-center gap-3 text-green-800 dark:text-green-300">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Reparación completada — pendiente de facturar</p>
              <p className="text-xs opacity-75">Genera la factura para cerrar el ciclo y cobrar al cliente.</p>
            </div>
          </div>
          <Button onClick={handleCreateFactura} data-testid="button-crear-factura-banner">
            <Receipt className="mr-2 h-4 w-4" />
            Crear Factura
          </Button>
        </div>
      )}

      {/* ── SECCIÓN 1: RECEPCIÓN ──────────────────────────────────────────── */}
      <Card className={recepcionCompleta ? "border-green-500/50 dark:border-green-700/50" : ""}>
        <CardHeader className="flex flex-row items-center gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5" />
            Recepción del Vehículo
            {recepcionCompleta && (
              <Badge variant="outline" className="text-green-600 border-green-600 ml-1">
                Completada
              </Badge>
            )}
            {!recepcionCompleta && (
              <Badge variant="outline" className="text-amber-600 border-amber-600 ml-1">
                Pendiente
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Recepcionado por */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Recepcionado por</label>
            <Select
              value={orden.recepcionadoPorId?.toString() || ""}
              onValueChange={handleRecepcionistChange}
            >
              <SelectTrigger className="w-64" data-testid="select-recepcionado-por">
                <SelectValue placeholder="Seleccionar recepcionista..." />
              </SelectTrigger>
              <SelectContent>
                {recepcionistas.map(u => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.nombre} {u.apellidos || ""} — {u.roles?.join(', ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fotos de recepción */}
          <CamaraFotos fotos={fotosRecepcion} onFotosChange={handleSaveFotos} />

          {/* Checklist + Firma del cliente */}
          <RecepcionChecklist
            onSave={handleSaveRecepcion}
            initialChecklist={checklist}
            initialSignature={orden.firmaDigital || undefined}
          />
        </CardContent>
      </Card>

      {/* ── SECCIÓN 2: DATOS CLIENTE Y VEHÍCULO ──────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserIcon className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Nombre</p>
              <p className="font-medium">{orden.clienteNombre || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">NIF/CIF</p>
              <p className="font-medium">{orden.clienteNif || "-"}</p>
            </div>
            {orden.clienteTelefono && (
              <div>
                <p className="text-muted-foreground">Teléfono</p>
                <p className="font-medium">{orden.clienteTelefono}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5" />
              Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Matrícula</p>
                <p className="font-medium font-mono">{orden.vehiculoMatricula || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Km entrada</p>
                <p className="font-medium">{orden.kmEntrada?.toLocaleString("es-ES") || "-"}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Marca / Modelo</p>
              <p className="font-medium">{orden.vehiculoMarca} {orden.vehiculoModelo} {orden.vehiculoAnio ? `(${orden.vehiculoAnio})` : ""}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── BLOQUEO: Presupuesto pendiente de aprobación ────────────────── */}
      {presupuestoPendiente && presupuestoVinculado && (
        <div
          className="flex items-center justify-between gap-4 rounded-md border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 px-5 py-4"
          data-testid="banner-presupuesto-pendiente"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                Trabajos bloqueados — presupuesto pendiente de aprobación
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                El presupuesto <span className="font-mono font-bold">{presupuestoVinculado.codigo}</span> ({parseFloat(presupuestoVinculado.total.toString()).toFixed(2)} €) debe ser aprobado antes de poder iniciar o avanzar la reparación.
              </p>
            </div>
          </div>
          <Button
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
            size="sm"
            onClick={() => aprobarPresupuestoMutation.mutate(presupuestoVinculado.id)}
            disabled={aprobarPresupuestoMutation.isPending}
            data-testid="button-aprobar-presupuesto-or"
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Aprobar presupuesto
          </Button>
        </div>
      )}

      {/* ── SECCIÓN 3: ESTADO DE LA ORDEN ────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base text-muted-foreground font-medium">Cambiar estado de la OR</CardTitle>
            {presupuestoPendiente && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Bloqueada hasta aprobar presupuesto
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { estado: "abierta", label: "Abierta", icon: Clock, activeClass: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600", requiresApproval: false },
              { estado: "en_curso", label: "En curso", icon: PlayCircle, activeClass: "bg-amber-500 hover:bg-amber-600 text-white border-amber-500", requiresApproval: true },
              { estado: "a_la_espera", label: "A la espera", icon: PauseCircle, activeClass: "bg-orange-500 hover:bg-orange-600 text-white border-orange-500", requiresApproval: true },
              { estado: "terminada", label: "Terminada", icon: CheckCircle, activeClass: "bg-green-600 hover:bg-green-700 text-white border-green-600", requiresApproval: true },
            ].map(({ estado, label, icon: Icon, activeClass, requiresApproval }) => {
              const isActive = orden.estado === estado;
              const isBlocked = requiresApproval && presupuestoPendiente;
              return (
                <Button
                  key={estado}
                  variant="outline"
                  size="sm"
                  className={isActive ? activeClass : isBlocked ? "text-muted-foreground opacity-40 cursor-not-allowed" : "text-muted-foreground"}
                  onClick={() => !isBlocked && handleStatusChange(estado)}
                  disabled={updateOrdenMutation.isPending || orden.estado === "facturada" || isBlocked}
                  data-testid={`button-estado-${estado.replace("_", "")}`}
                  title={isBlocked ? "Aprueba el presupuesto para poder cambiar este estado" : undefined}
                >
                  <Icon className="mr-2 h-4 w-4" />{label}
                  {isActive && !isBlocked && <span className="ml-2 h-1.5 w-1.5 rounded-full bg-white/70 inline-block" />}
                </Button>
              );
            })}
            {orden.estado === "facturada" && (
              <Badge className="px-3 py-1.5 text-sm bg-purple-600 text-white border-purple-600" data-testid="badge-estado-facturada">
                <Receipt className="mr-2 h-4 w-4" />
                Facturada
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── SECCIÓN 3b: OBSERVACIONES Y KM SALIDA ─────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <StickyNote className="h-4 w-4" />
              Observaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {obsEditing ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={obsValue}
                  onChange={e => setObsValue(e.target.value)}
                  rows={3}
                  placeholder="Observaciones del cliente o del técnico..."
                  data-testid="textarea-observaciones"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveObs} disabled={updateOrdenMutation.isPending} data-testid="button-save-observaciones">
                    <Save className="h-3 w-3 mr-1" />
                    Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setObsEditing(false); setObsValue(orden.observaciones ?? ""); }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="text-sm cursor-pointer hover-elevate rounded-md p-2 min-h-[60px] whitespace-pre-wrap"
                onClick={() => setObsEditing(true)}
                data-testid="text-observaciones"
              >
                {obsValue || <span className="text-muted-foreground italic">Sin observaciones — pulsa para editar</span>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4" />
              Km de Salida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0"
                value={kmSalidaValue}
                onChange={e => setKmSalidaValue(e.target.value)}
                placeholder="Kilómetros al entregar"
                className="max-w-[200px]"
                data-testid="input-km-salida"
                onBlur={handleSaveKmSalida}
              />
              <Button size="sm" variant="outline" onClick={handleSaveKmSalida} disabled={updateOrdenMutation.isPending} data-testid="button-save-km-salida">
                <Save className="h-3 w-3 mr-1" />
                Guardar
              </Button>
            </div>
            {orden.kmEntrada && (
              <p className="text-xs text-muted-foreground mt-2">
                Km entrada: {Number(orden.kmEntrada).toLocaleString("es-ES")}
                {kmSalidaValue && Number(kmSalidaValue) > Number(orden.kmEntrada) && (
                  <> · Recorrido: {(Number(kmSalidaValue) - Number(orden.kmEntrada)).toLocaleString("es-ES")} km</>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── SECCIÓN 4: PARTES DE TRABAJO ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5" />
            Partes de Trabajo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Mecánico</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">€/h</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partes?.map((parte) => {
                  const mecanico = usuarios?.find(u => u.id === parte.mecanicoId);
                  return (
                    <TableRow key={parte.id}>
                      <TableCell>{parte.descripcion}</TableCell>
                      <TableCell>{mecanico ? `${mecanico.nombre}` : "-"}</TableCell>
                      <TableCell className="text-right">{Number(parte.tiempoEstimado).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(parte.precioMO).toFixed(2)}€</TableCell>
                      <TableCell className="text-right font-medium">{(Number(parte.precioMO) * Number(parte.tiempoEstimado)).toFixed(2)}€</TableCell>
                      <TableCell className="text-center">
                        {parte.completado
                          ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          : <Clock className="h-4 w-4 text-amber-500 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={deleteParteMutation.isPending}
                          onClick={() => deleteParteMutation.mutate(parte.id)}
                          data-testid={`button-delete-parte-${parte.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!partes || partes.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No hay partes de trabajo registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 border-t pt-4">
            <h4 className="font-medium mb-3 text-sm">Añadir Parte de Trabajo</h4>
            <Form {...parteForm}>
              <form
                onSubmit={parteForm.handleSubmit((data) => addParteMutation.mutate(data))}
                className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
              >
                <FormField control={parteForm.control} name="descripcion" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej. Cambio de aceite" data-testid="input-parte-descripcion" />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={parteForm.control} name="mecanicoId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mecánico</FormLabel>
                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value != null ? String(field.value) : ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-parte-mecanico">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mecanicos.map(m => (
                          <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={parteForm.control} name="tiempoEstimado" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.25" min="0" {...field} data-testid="input-parte-horas" />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={parteForm.control} name="precioMO" render={({ field }) => (
                  <FormItem>
                    <FormLabel>€/hora</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} data-testid="input-parte-precio-mo" />
                    </FormControl>
                  </FormItem>
                )} />
                <Button type="submit" disabled={addParteMutation.isPending} data-testid="button-add-parte">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>

      {/* ── SECCIÓN 5: CONSUMOS ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Recambios y Materiales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio Un.</TableHead>
                  <TableHead className="text-right">IGIC</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumos?.map((consumo) => (
                  <TableRow key={consumo.id}>
                    <TableCell className="font-mono text-xs">{consumo.articulo?.referencia || "-"}</TableCell>
                    <TableCell>{consumo.articulo?.descripcion || "-"}</TableCell>
                    <TableCell className="text-right">{Number(consumo.cantidad).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{Number(consumo.precioUnitario).toFixed(2)}€</TableCell>
                    <TableCell className="text-right">{Number(consumo.igic).toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-medium">{(Number(consumo.precioUnitario) * Number(consumo.cantidad)).toFixed(2)}€</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={deleteConsumoMutation.isPending}
                        onClick={() => deleteConsumoMutation.mutate(consumo.id)}
                        data-testid={`button-delete-consumo-${consumo.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!consumos || consumos.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No hay artículos consumidos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 border-t pt-4">
            <h4 className="font-medium mb-3 text-sm">Añadir Recambio</h4>
            <Form {...consumoForm}>
              <form
                onSubmit={consumoForm.handleSubmit((data) => addConsumoMutation.mutate(data))}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
              >
                <FormField control={consumoForm.control} name="articuloId" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Artículo</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        const artId = parseInt(val);
                        field.onChange(artId);
                        const art = articulos?.find(a => a.id === artId);
                        if (art) {
                          consumoForm.setValue("precioUnitario", art.precioVenta.toString());
                          consumoForm.setValue("igic", art.igic?.toString() || "7.00");
                        }
                      }}
                      value={field.value != null ? String(field.value) : ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-consumo-articulo">
                          <SelectValue placeholder="Seleccionar artículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {articulos?.map(a => (
                          <SelectItem key={a.id} value={a.id.toString()}>
                            {a.referencia} — {a.descripcion} ({Number(a.precioVenta).toFixed(2)}€)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={consumoForm.control} name="cantidad" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field} data-testid="input-consumo-cantidad" />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={consumoForm.control} name="precioUnitario" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Unit.</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} data-testid="input-consumo-precio" />
                    </FormControl>
                  </FormItem>
                )} />
                <Button type="submit" disabled={addConsumoMutation.isPending} data-testid="button-add-consumo">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>

      {/* ── SECCIÓN 6: RESUMEN ECONÓMICO ─────────────────────────────────── */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Resumen Económico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Mano de Obra</span>
            <span>{totalMO.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Recambios</span>
            <span>{totalArticulos.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total IGIC</span>
            <span>{totalIgic.toFixed(2)} €</span>
          </div>
          <Separator />
          <div className="flex justify-between text-xl font-bold">
            <span>TOTAL GENERAL</span>
            <span className="text-primary">{totalGeneral.toFixed(2)} €</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Dialog impresión de recepción ────────────────────────────────── */}
      <RecepcionPrint
        open={printOpen}
        onOpenChange={setPrintOpen}
        orden={orden as any}
      />
    </div>
  );
}
