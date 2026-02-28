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
} from "@shared/schema";
import { useState } from "react";
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
    queryKey: ["/api/users"],
  });

  const updateOrdenMutation = useMutation({
    mutationFn: async (updates: Partial<OrdenReparacion>) => {
      return apiRequest(`/api/ordenes/${id}`, { method: "PUT", body: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes"] });
    },
  });

  const addParteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/ordenes/${id}/partes`, { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes", id, "partes"] });
      toast({ title: "Parte de trabajo añadido" });
      parteForm.reset();
    },
  });

  const addConsumoMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/ordenes/${id}/consumos`, { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes", id, "consumos"] });
      toast({ title: "Consumo añadido" });
      consumoForm.reset();
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
    updateOrdenMutation.mutate({ estado: newStatus as any });
  };

  const handleRecepcionistChange = (userId: string) => {
    updateOrdenMutation.mutate({ recepcionadoPorId: parseInt(userId) });
  };

  const handleSaveRecepcion = (checklist: ChecklistItem[], signature: string) => {
    updateOrdenMutation.mutate({
      checklistRecepcion: JSON.stringify(checklist),
      firmaDigital: signature,
    });
    toast({
      title: "Recepción guardada",
      description: "Checklist y firma guardados correctamente.",
    });
  };

  const handleSaveFotos = (fotos: string[]) => {
    updateOrdenMutation.mutate({ fotosRecepcion: JSON.stringify(fotos) });
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

  const mecanicos = usuarios?.filter(u => u.rol === "mecanico" || u.rol === "jefe_taller") || [];
  const recepcionistas = usuarios?.filter(u => ["recepcion", "admin", "jefe_taller"].includes(u.rol)) || [];

  const recepcionCompleta = !!(orden.checklistRecepcion && orden.firmaDigital && orden.recepcionadoPorId);

  return (
    <div className="space-y-6 pb-20">

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/ordenes")} data-testid="button-volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{orden.codigo}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            {orden.fechaApertura ? format(new Date(orden.fechaApertura), "dd MMM yyyy HH:mm", { locale: es }) : "-"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orden.estado === "terminada" && (
            <Button onClick={handleCreateFactura} data-testid="button-crear-factura">
              <FileText className="mr-2 h-4 w-4" />
              Crear Factura
            </Button>
          )}
          <Badge className="text-sm px-3 py-1" variant={
            orden.estado === "abierta" ? "default" :
            orden.estado === "en_curso" ? "secondary" :
            orden.estado === "terminada" ? "outline" : "destructive"
          }>
            {orden.estado.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* ── SECCIÓN 1: RECEPCIÓN ──────────────────────────────────────────── */}
      <Card className={recepcionCompleta ? "border-green-500/50 dark:border-green-700/50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5" />
            Recepción del Vehículo
            {recepcionCompleta && (
              <Badge variant="outline" className="text-green-600 border-green-600 ml-1">
                Completada
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPrintOpen(true)}
            data-testid="button-imprimir-recepcion-trigger"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Documento
          </Button>
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
                    {u.nombre} {u.apellidos || ""} — {u.rol}
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

      {/* ── SECCIÓN 3: ESTADO DE LA ORDEN (solo taller) ──────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estado de la Reparación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { estado: "abierta", label: "Abierta", icon: <Clock className="mr-2 h-4 w-4" /> },
              { estado: "en_curso", label: "En Curso", icon: <PlayCircle className="mr-2 h-4 w-4" /> },
              { estado: "terminada", label: "Terminada", icon: <CheckCircle className="mr-2 h-4 w-4" /> },
            ].map(({ estado, label, icon }) => (
              <Button
                key={estado}
                variant={orden.estado === estado ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange(estado)}
                disabled={updateOrdenMutation.isPending}
                data-testid={`button-estado-${estado.replace("_", "")}`}
              >
                {icon}{label}
              </Button>
            ))}
            <Button
              variant={orden.estado === "facturada" ? "default" : "outline"}
              size="sm"
              disabled
              data-testid="button-estado-facturada"
            >
              <FileText className="mr-2 h-4 w-4" />
              Facturada
            </Button>
          </div>
        </CardContent>
      </Card>

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
                    </TableRow>
                  );
                })}
                {(!partes || partes.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
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
                className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
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
                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
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
                      <Input type="number" step="0.25" {...field} data-testid="input-parte-horas" />
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
                  </TableRow>
                ))}
                {(!consumos || consumos.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
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
                      value={field.value?.toString()}
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
