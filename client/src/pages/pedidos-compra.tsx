import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus, ShoppingCart, Truck, Pencil, Trash2,
  PackageSearch, ChevronRight, X, PackageCheck, PackageX, Clock
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { PedidoCompra, Proveedor, LineaPedido, Articulo } from "@shared/schema";
import { insertPedidoCompraSchema, insertLineaPedidoSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

const estadoPedidoConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendiente: { label: "Pendiente", variant: "secondary" },
  enviado: { label: "Enviado", variant: "default" },
  recibido_parcial: { label: "Recibido Parcial", variant: "default" },
  recibido: { label: "Recibido", variant: "outline" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

const estadoLineaConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pendiente: { label: "Pendiente", variant: "secondary", icon: Clock },
  en_transito: { label: "En tránsito", variant: "default", icon: Truck },
  recibido: { label: "Recibido", variant: "outline", icon: PackageCheck },
  cancelado: { label: "Cancelado", variant: "destructive", icon: PackageX },
};

const pedidoFormSchema = insertPedidoCompraSchema.extend({
  fecha: z.coerce.date(),
  fechaEntregaEstimada: z.coerce.date().optional(),
  createdById: z.number().optional(),
});

const lineaFormSchema = z.object({
  articuloId: z.number({ required_error: "Selecciona un artículo" }),
  cantidad: z.string().min(1, "Requerido"),
  precioUnitario: z.string().min(1, "Requerido"),
  igic: z.string().default("7.00"),
  estado: z.string().default("pendiente"),
  fechaPrevistaEntrega: z.coerce.date().optional(),
});

type PedidoFormValues = z.infer<typeof pedidoFormSchema>;
type LineaFormValues = z.infer<typeof lineaFormSchema>;

export default function PedidosCompra() {
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [open, setOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<PedidoCompra | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailPedido, setDetailPedido] = useState<PedidoCompra | null>(null);
  const [deleteLineaId, setDeleteLineaId] = useState<number | null>(null);
  const [editingLinea, setEditingLinea] = useState<LineaPedido | null>(null);
  const { toast } = useToast();

  const { data: pedidos, isLoading } = useQuery<PedidoCompra[]>({
    queryKey: ["/api/pedidos-compra"],
  });
  const { data: proveedores } = useQuery<Proveedor[]>({
    queryKey: ["/api/proveedores"],
  });
  const { data: articulos } = useQuery<Articulo[]>({
    queryKey: ["/api/articulos"],
  });
  const { data: lineas, isLoading: lineasLoading } = useQuery<LineaPedido[]>({
    queryKey: ["/api/pedidos-compra", detailPedido?.id, "lineas"],
    enabled: !!detailPedido,
  });

  const pedidoForm = useForm<PedidoFormValues>({
    resolver: zodResolver(pedidoFormSchema),
    defaultValues: {
      numero: "", proveedorId: undefined, fecha: new Date(),
      fechaEntregaEstimada: undefined, estado: "pendiente", total: "0", observaciones: "",
    },
  });

  const lineaForm = useForm<LineaFormValues>({
    resolver: zodResolver(lineaFormSchema),
    defaultValues: {
      articuloId: undefined as any, cantidad: "1", precioUnitario: "0",
      igic: "7.00", estado: "pendiente", fechaPrevistaEntrega: undefined,
    },
  });

  const cantidadVal = lineaForm.watch("cantidad");
  const precioVal = lineaForm.watch("precioUnitario");
  const igicVal = lineaForm.watch("igic");
  const subtotal = (parseFloat(cantidadVal) || 0) * (parseFloat(precioVal) || 0);
  const importeLinea = subtotal * (1 + (parseFloat(igicVal) || 0) / 100);

  const totalLineas = (lineas || []).reduce((sum, l) => sum + parseFloat(l.importe), 0);

  const createPedidoMutation = useMutation({
    mutationFn: (data: PedidoFormValues) =>
      apiRequest("/api/pedidos-compra", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pedidos-compra"] });
      toast({ title: "Pedido creado" });
      handleClosePedidoDialog();
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const updatePedidoMutation = useMutation({
    mutationFn: (data: PedidoFormValues) =>
      apiRequest(`/api/pedidos-compra/${editingPedido!.id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pedidos-compra"] });
      toast({ title: "Pedido actualizado" });
      handleClosePedidoDialog();
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deletePedidoMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/pedidos-compra/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pedidos-compra"] });
      toast({ title: "Pedido eliminado" });
      setDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const createLineaMutation = useMutation({
    mutationFn: (data: LineaFormValues) => {
      const importe = ((parseFloat(data.cantidad) || 0) * (parseFloat(data.precioUnitario) || 0) * (1 + (parseFloat(data.igic) || 0) / 100)).toFixed(2);
      const body: Record<string, any> = {
        articuloId: data.articuloId,
        cantidad: data.cantidad,
        cantidadRecibida: "0",
        precioUnitario: data.precioUnitario,
        igic: data.igic,
        importe,
        estado: data.estado,
      };
      if (data.fechaPrevistaEntrega) body.fechaPrevistaEntrega = data.fechaPrevistaEntrega;
      return apiRequest(`/api/pedidos-compra/${detailPedido!.id}/lineas`, {
        method: "POST",
        body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pedidos-compra", detailPedido?.id, "lineas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pedidos-compra"] });
      toast({ title: "Artículo añadido al pedido" });
      lineaForm.reset({ articuloId: undefined as any, cantidad: "1", precioUnitario: "0", igic: "7.00", estado: "pendiente" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const updateLineaMutation = useMutation({
    mutationFn: (data: LineaFormValues) => {
      const importe = ((parseFloat(data.cantidad) || 0) * (parseFloat(data.precioUnitario) || 0) * (1 + (parseFloat(data.igic) || 0) / 100)).toFixed(2);
      const body: Record<string, any> = {
        cantidad: data.cantidad,
        precioUnitario: data.precioUnitario,
        igic: data.igic,
        importe,
        estado: data.estado,
      };
      if (data.fechaPrevistaEntrega) body.fechaPrevistaEntrega = data.fechaPrevistaEntrega;
      return apiRequest(`/api/pedidos-compra/lineas/${editingLinea!.id}`, {
        method: "PUT",
        body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pedidos-compra", detailPedido?.id, "lineas"] });
      toast({ title: "Línea actualizada" });
      setEditingLinea(null);
      lineaForm.reset({ articuloId: undefined as any, cantidad: "1", precioUnitario: "0", igic: "7.00", estado: "pendiente" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteLineaMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/pedidos-compra/lineas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pedidos-compra", detailPedido?.id, "lineas"] });
      toast({ title: "Artículo eliminado del pedido" });
      setDeleteLineaId(null);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const handleEditPedido = (pedido: PedidoCompra) => {
    setEditingPedido(pedido);
    pedidoForm.reset({
      numero: pedido.numero,
      proveedorId: pedido.proveedorId,
      fecha: new Date(pedido.fecha),
      fechaEntregaEstimada: pedido.fechaEntregaEstimada ? new Date(pedido.fechaEntregaEstimada) : undefined,
      estado: pedido.estado,
      total: pedido.total.toString(),
      observaciones: pedido.observaciones || "",
    });
    setOpen(true);
  };

  const handleClosePedidoDialog = () => {
    setOpen(false);
    setEditingPedido(null);
    pedidoForm.reset();
  };

  const handleEditLinea = (linea: LineaPedido) => {
    setEditingLinea(linea);
    lineaForm.reset({
      articuloId: linea.articuloId,
      cantidad: linea.cantidad,
      precioUnitario: linea.precioUnitario,
      igic: linea.igic || "7.00",
      estado: linea.estado,
      fechaPrevistaEntrega: linea.fechaPrevistaEntrega ? new Date(linea.fechaPrevistaEntrega) : undefined,
    });
  };

  const pedidosFiltrados = (pedidos || []).filter(p =>
    estadoFilter === "todos" || p.estado === estadoFilter
  );

  const counts = {
    todos: pedidos?.length || 0,
    pendiente: pedidos?.filter(p => p.estado === "pendiente").length || 0,
    enviado: pedidos?.filter(p => p.estado === "enviado").length || 0,
    recibido: pedidos?.filter(p => p.estado === "recibido").length || 0,
  };

  const proveedorNombre = (id: number) =>
    proveedores?.find(p => p.id === id)?.nombre || `Proveedor #${id}`;

  const articuloNombre = (id: number) =>
    articulos?.find(a => a.id === id)?.descripcion || `Artículo #${id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Pedidos de Compra</h1>
          <p className="text-muted-foreground">Gestión de pedidos a proveedores</p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="button-nuevo-pedido">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total", value: counts.todos, icon: ShoppingCart },
          { label: "Pendientes", value: counts.pendiente, icon: Clock },
          { label: "Enviados", value: counts.enviado, icon: Truck },
          { label: "Recibidos", value: counts.recibido, icon: PackageCheck },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={estadoFilter} onValueChange={setEstadoFilter}>
        <TabsList>
          <TabsTrigger value="todos" data-testid="tab-todos">Todos ({counts.todos})</TabsTrigger>
          <TabsTrigger value="pendiente" data-testid="tab-pendiente">Pendientes ({counts.pendiente})</TabsTrigger>
          <TabsTrigger value="enviado" data-testid="tab-enviado">Enviados ({counts.enviado})</TabsTrigger>
          <TabsTrigger value="recibido" data-testid="tab-recibido">Recibidos ({counts.recibido})</TabsTrigger>
        </TabsList>

        <TabsContent value={estadoFilter} className="mt-6">
          <Card>
            <CardContent className="pt-4">
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Entrega Est.</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : pedidosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <div className="flex flex-col items-center text-muted-foreground">
                            <ShoppingCart className="h-10 w-10 mb-2 opacity-40" />
                            <p>No hay pedidos{estadoFilter !== "todos" ? ` en estado ${estadoFilter}` : ""}</p>
                            <Button variant="ghost" className="mt-2" onClick={() => setOpen(true)}
                              data-testid="button-crear-primer-pedido">
                              Crear el primer pedido
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pedidosFiltrados.map((pedido) => (
                        <TableRow key={pedido.id} data-testid={`row-pedido-${pedido.id}`}>
                          <TableCell className="font-mono font-medium">{pedido.numero}</TableCell>
                          <TableCell>{format(new Date(pedido.fecha), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{proveedorNombre(pedido.proveedorId)}</TableCell>
                          <TableCell>
                            <Badge variant={estadoPedidoConfig[pedido.estado]?.variant || "default"}>
                              {estadoPedidoConfig[pedido.estado]?.label || pedido.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {parseFloat(pedido.total).toFixed(2)} €
                          </TableCell>
                          <TableCell>
                            {pedido.fechaEntregaEstimada
                              ? format(new Date(pedido.fechaEntregaEstimada), "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" onClick={() => setDetailPedido(pedido)}
                                data-testid={`button-detalle-${pedido.id}`} title="Ver líneas de pedido">
                                <PackageSearch className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEditPedido(pedido)}
                                data-testid={`button-editar-${pedido.id}`} title="Editar pedido">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon"
                                onClick={() => { setDeleteId(pedido.id); setDeleteDialogOpen(true); }}
                                data-testid={`button-eliminar-${pedido.id}`} title="Eliminar pedido">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Crear / Editar pedido (cabecera) */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClosePedidoDialog(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPedido ? "Editar Pedido" : "Nuevo Pedido"}</DialogTitle>
          </DialogHeader>
          <Form {...pedidoForm}>
            <form onSubmit={pedidoForm.handleSubmit((d) => editingPedido ? updatePedidoMutation.mutate(d) : createPedidoMutation.mutate(d))}
              className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={pedidoForm.control} name="numero" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Pedido *</FormLabel>
                    <FormControl><Input {...field} data-testid="input-numero" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={pedidoForm.control} name="proveedorId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor *</FormLabel>
                    <Select value={field.value?.toString()} onValueChange={(v) => field.onChange(parseInt(v))}>
                      <FormControl>
                        <SelectTrigger data-testid="select-proveedor">
                          <SelectValue placeholder="Selecciona un proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {proveedores?.filter(p => p.activo).map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={pedidoForm.control} name="fecha" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha *</FormLabel>
                    <FormControl>
                      <Input type="date"
                        value={field.value && !isNaN(field.value.getTime()) ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) field.onChange(d); }}
                        data-testid="input-fecha" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={pedidoForm.control} name="fechaEntregaEstimada" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entrega Estimada</FormLabel>
                    <FormControl>
                      <Input type="date"
                        value={field.value && !isNaN(field.value.getTime()) ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          if (e.target.value) { const d = new Date(e.target.value); if (!isNaN(d.getTime())) field.onChange(d); }
                          else field.onChange(undefined);
                        }}
                        data-testid="input-fecha-entrega" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={pedidoForm.control} name="estado" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-estado"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="enviado">Enviado</SelectItem>
                        <SelectItem value="recibido_parcial">Recibido Parcial</SelectItem>
                        <SelectItem value="recibido">Recibido</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={pedidoForm.control} name="total" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total (€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} data-testid="input-total" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={pedidoForm.control} name="observaciones" render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} data-testid="input-observaciones" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleClosePedidoDialog}>Cancelar</Button>
                <Button type="submit" disabled={createPedidoMutation.isPending || updatePedidoMutation.isPending}
                  data-testid="button-guardar">
                  {createPedidoMutation.isPending || updatePedidoMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalle de líneas de pedido */}
      <Dialog open={!!detailPedido} onOpenChange={(v) => { if (!v) { setDetailPedido(null); setEditingLinea(null); lineaForm.reset({ articuloId: undefined as any, cantidad: "1", precioUnitario: "0", igic: "7.00", estado: "pendiente" }); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Pedido {detailPedido?.numero}
              <span className="text-muted-foreground font-normal text-sm ml-1">
                — {detailPedido ? proveedorNombre(detailPedido.proveedorId) : ""}
              </span>
              {detailPedido && (
                <Badge variant={estadoPedidoConfig[detailPedido.estado]?.variant || "default"} className="ml-auto">
                  {estadoPedidoConfig[detailPedido.estado]?.label}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {detailPedido && (
            <div className="space-y-2 text-sm text-muted-foreground bg-muted/40 rounded-md p-3">
              <div className="grid grid-cols-3 gap-4">
                <div><span className="font-medium text-foreground">Fecha pedido: </span>{format(new Date(detailPedido.fecha), "dd/MM/yyyy")}</div>
                <div><span className="font-medium text-foreground">Entrega estimada: </span>
                  {detailPedido.fechaEntregaEstimada ? format(new Date(detailPedido.fechaEntregaEstimada), "dd/MM/yyyy") : "—"}
                </div>
                <div><span className="font-medium text-foreground">Total pedido: </span>{lineas ? totalLineas.toFixed(2) : parseFloat(detailPedido.total).toFixed(2)} €</div>
              </div>
              {detailPedido.observaciones && <div><span className="font-medium text-foreground">Observaciones: </span>{detailPedido.observaciones}</div>}
            </div>
          )}

          {/* Tabla de líneas */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Artículos del pedido</h3>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artículo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">IGIC</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha prevista</TableHead>
                    <TableHead className="text-right">Acc.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineasLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !lineas || lineas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        No hay artículos en este pedido. Añade uno abajo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lineas.map((linea) => {
                      const cfg = estadoLineaConfig[linea.estado] || estadoLineaConfig.pendiente;
                      return (
                        <TableRow key={linea.id} data-testid={`row-linea-${linea.id}`}>
                          <TableCell className="max-w-[180px] truncate">{articuloNombre(linea.articuloId)}</TableCell>
                          <TableCell className="text-right">{parseFloat(linea.cantidad).toFixed(2)}</TableCell>
                          <TableCell className="text-right">{parseFloat(linea.precioUnitario).toFixed(2)} €</TableCell>
                          <TableCell className="text-right">{parseFloat(linea.igic || "0").toFixed(1)}%</TableCell>
                          <TableCell className="text-right font-medium">{parseFloat(linea.importe).toFixed(2)} €</TableCell>
                          <TableCell>
                            <Badge variant={cfg.variant} className="whitespace-nowrap">
                              {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {linea.fechaPrevistaEntrega
                              ? format(new Date(linea.fechaPrevistaEntrega), "dd/MM/yyyy")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" onClick={() => handleEditLinea(linea)}
                                data-testid={`button-editar-linea-${linea.id}`} title="Editar">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon"
                                onClick={() => setDeleteLineaId(linea.id)}
                                data-testid={`button-eliminar-linea-${linea.id}`} title="Eliminar">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {lineas && lineas.length > 0 && (
              <div className="text-right text-sm font-medium pr-2">
                Total líneas: <span className="text-base">{totalLineas.toFixed(2)} €</span>
              </div>
            )}
          </div>

          {/* Formulario añadir / editar línea */}
          <div className="border rounded-md p-4 space-y-3 bg-muted/20">
            <h3 className="font-semibold text-sm">
              {editingLinea ? "Editar artículo" : "Añadir artículo al pedido"}
              {editingLinea && (
                <Button variant="ghost" size="icon" className="ml-2 h-6 w-6" onClick={() => {
                  setEditingLinea(null);
                  lineaForm.reset({ articuloId: undefined as any, cantidad: "1", precioUnitario: "0", igic: "7.00", estado: "pendiente" });
                }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </h3>
            <Form {...lineaForm}>
              <form onSubmit={lineaForm.handleSubmit((d) => editingLinea ? updateLineaMutation.mutate(d) : createLineaMutation.mutate(d))}
                className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FormField control={lineaForm.control} name="articuloId" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Artículo *</FormLabel>
                      <Select
                        value={field.value != null ? String(field.value) : ""}
                        onValueChange={(v) => {
                          const id = parseInt(v);
                          field.onChange(id);
                          const art = articulos?.find(a => a.id === id);
                          if (art) {
                            lineaForm.setValue("precioUnitario", art.precioCoste?.toString() || "0");
                            lineaForm.setValue("igic", art.igic?.toString() || "7.00");
                          }
                        }}
                        disabled={!!editingLinea}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-articulo">
                            <SelectValue placeholder="Selecciona un artículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {articulos?.map(a => (
                            <SelectItem key={a.id} value={a.id.toString()}>
                              {a.referencia ? `[${a.referencia}] ` : ""}{a.descripcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={lineaForm.control} name="cantidad" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} data-testid="input-linea-cantidad" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={lineaForm.control} name="precioUnitario" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio unit. (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} data-testid="input-linea-precio" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FormField control={lineaForm.control} name="igic" render={({ field }) => (
                    <FormItem>
                      <FormLabel>IGIC (%)</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-igic"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="3.00">3%</SelectItem>
                          <SelectItem value="7.00">7%</SelectItem>
                          <SelectItem value="9.50">9.5%</SelectItem>
                          <SelectItem value="15.00">15%</SelectItem>
                          <SelectItem value="20.00">20%</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={lineaForm.control} name="estado" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado artículo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-estado-linea"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_transito">En tránsito</SelectItem>
                          <SelectItem value="recibido">Recibido</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={lineaForm.control} name="fechaPrevistaEntrega" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha prevista</FormLabel>
                      <FormControl>
                        <Input type="date"
                          value={field.value && !isNaN((field.value as Date).getTime()) ? format(field.value as Date, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            if (e.target.value) { const d = new Date(e.target.value); if (!isNaN(d.getTime())) field.onChange(d); }
                            else field.onChange(undefined);
                          }}
                          data-testid="input-linea-fecha-prevista" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex flex-col justify-end gap-1">
                    <span className="text-xs text-muted-foreground">Importe calculado</span>
                    <div className="h-9 flex items-center px-3 border rounded-md bg-muted text-sm font-medium">
                      {importeLinea.toFixed(2)} €
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {editingLinea && (
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      setEditingLinea(null);
                      lineaForm.reset({ articuloId: undefined as any, cantidad: "1", precioUnitario: "0", igic: "7.00", estado: "pendiente" });
                    }}>
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" size="sm"
                    disabled={createLineaMutation.isPending || updateLineaMutation.isPending}
                    data-testid="button-guardar-linea">
                    {editingLinea ? (
                      <><Pencil className="h-4 w-4 mr-1" /> Actualizar</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-1" /> Añadir artículo</>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm delete pedido */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="alert-dialog-eliminar">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará el pedido y todas sus líneas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deletePedidoMutation.mutate(deleteId)}
              disabled={deletePedidoMutation.isPending}>
              {deletePedidoMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete línea */}
      <AlertDialog open={!!deleteLineaId} onOpenChange={(v) => { if (!v) setDeleteLineaId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar artículo del pedido?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará esta línea del pedido.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteLineaId && deleteLineaMutation.mutate(deleteLineaId)}
              disabled={deleteLineaMutation.isPending}>
              {deleteLineaMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
