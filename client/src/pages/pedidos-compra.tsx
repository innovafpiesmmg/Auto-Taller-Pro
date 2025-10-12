import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart, Truck, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { PedidoCompra, Proveedor } from "@shared/schema";
import { insertPedidoCompraSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

const estadoConfig = {
  pendiente: { label: "Pendiente", variant: "default" as const, icon: ShoppingCart },
  enviado: { label: "Enviado", variant: "secondary" as const, icon: Truck },
  recibido_parcial: { label: "Recibido Parcial", variant: "default" as const, icon: ShoppingCart },
  recibido: { label: "Recibido", variant: "default" as const, icon: ShoppingCart },
  cancelado: { label: "Cancelado", variant: "secondary" as const, icon: ShoppingCart },
};

const formSchema = insertPedidoCompraSchema.extend({
  fecha: z.coerce.date(),
  fechaEntregaEstimada: z.coerce.date().optional(),
  createdById: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PedidosCompra() {
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [open, setOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<PedidoCompra | null>(null);
  const { toast } = useToast();

  const { data: pedidos, isLoading } = useQuery<PedidoCompra[]>({
    queryKey: ["/api/pedidos-compra", estadoFilter !== "todos" ? estadoFilter : undefined],
  });

  const { data: proveedores } = useQuery<Proveedor[]>({
    queryKey: ["/api/proveedores"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero: "",
      proveedorId: undefined,
      fecha: new Date(),
      fechaEntregaEstimada: undefined,
      estado: "pendiente",
      total: "0",
      observaciones: "",
      createdById: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("/api/pedidos-compra", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pedidos-compra"] });
      toast({
        title: "Pedido creado",
        description: "El pedido se ha creado correctamente",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear el pedido",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!editingPedido) throw new Error("No hay pedido seleccionado");
      return await apiRequest(`/api/pedidos-compra/${editingPedido.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pedidos-compra"] });
      toast({
        title: "Pedido actualizado",
        description: "El pedido se ha actualizado correctamente",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el pedido",
      });
    },
  });

  const handleEdit = (pedido: PedidoCompra) => {
    setEditingPedido(pedido);
    form.reset({
      numero: pedido.numero,
      proveedorId: pedido.proveedorId,
      fecha: new Date(pedido.fecha),
      fechaEntregaEstimada: pedido.fechaEntregaEstimada ? new Date(pedido.fechaEntregaEstimada) : undefined,
      estado: pedido.estado,
      total: pedido.total.toString(),
      observaciones: pedido.observaciones || "",
      createdById: pedido.createdById ?? undefined,
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingPedido(null);
    form.reset();
  };

  const onSubmit = (data: FormValues) => {
    if (editingPedido) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const pedidosFiltrados = pedidos || [];

  const pedidosPorEstado = {
    todos: pedidos?.length || 0,
    pendiente: pedidos?.filter(p => p.estado === 'pendiente').length || 0,
    enviado: pedidos?.filter(p => p.estado === 'enviado').length || 0,
    recibido: pedidos?.filter(p => p.estado === 'recibido').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidosPorEstado.todos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidosPorEstado.pendiente}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidosPorEstado.enviado}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidosPorEstado.recibido}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={estadoFilter} onValueChange={setEstadoFilter}>
        <TabsList>
          <TabsTrigger value="todos" data-testid="tab-todos">Todos</TabsTrigger>
          <TabsTrigger value="pendiente" data-testid="tab-pendiente">Pendientes</TabsTrigger>
          <TabsTrigger value="enviado" data-testid="tab-enviado">Enviados</TabsTrigger>
          <TabsTrigger value="recibido" data-testid="tab-recibido">Recibidos</TabsTrigger>
        </TabsList>

        <TabsContent value={estadoFilter} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Entrega Estimada</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : pedidosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <ShoppingCart className="h-12 w-12 mb-2 opacity-50" />
                            <p>No hay pedidos {estadoFilter !== 'todos' ? `en estado ${estadoFilter}` : ''}</p>
                            <Button variant="ghost" className="mt-2" onClick={() => setOpen(true)} data-testid="button-crear-primer-pedido">
                              Crear el primer pedido
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pedidosFiltrados.map((pedido) => (
                        <TableRow key={pedido.id} data-testid={`row-pedido-${pedido.id}`}>
                          <TableCell className="font-medium" data-testid={`text-numero-${pedido.id}`}>
                            {pedido.numero}
                          </TableCell>
                          <TableCell data-testid={`text-fecha-${pedido.id}`}>
                            {format(new Date(pedido.fecha), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell data-testid={`text-proveedor-${pedido.id}`}>
                            {proveedores?.find(p => p.id === pedido.proveedorId)?.nombre || `Proveedor #${pedido.proveedorId}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant={estadoConfig[pedido.estado]?.variant || 'default'} data-testid={`badge-estado-${pedido.id}`}>
                              {estadoConfig[pedido.estado]?.label || pedido.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium" data-testid={`text-total-${pedido.id}`}>
                            {parseFloat(pedido.total.toString()).toFixed(2)} €
                          </TableCell>
                          <TableCell data-testid={`text-entrega-${pedido.id}`}>
                            {pedido.fechaEntregaEstimada ? format(new Date(pedido.fechaEntregaEstimada), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(pedido)} data-testid={`button-editar-${pedido.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
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

      <Dialog open={open} onOpenChange={(open) => { if (open) setOpen(true); else handleCloseDialog(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPedido ? 'Editar Pedido' : 'Nuevo Pedido'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Pedido*</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-numero" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proveedorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor*</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-proveedor">
                            <SelectValue placeholder="Selecciona un proveedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {proveedores?.filter(p => p.activo).map(proveedor => (
                            <SelectItem key={proveedor.id} value={proveedor.id.toString()}>
                              {proveedor.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field}) => (
                    <FormItem>
                      <FormLabel>Fecha*</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value && !isNaN(field.value.getTime()) ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const newDate = new Date(e.target.value);
                            if (!isNaN(newDate.getTime())) {
                              field.onChange(newDate);
                            }
                          }}
                          data-testid="input-fecha"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fechaEntregaEstimada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Entrega Estimada</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value && !isNaN(field.value.getTime()) ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              const newDate = new Date(e.target.value);
                              if (!isNaN(newDate.getTime())) {
                                field.onChange(newDate);
                              }
                            } else {
                              field.onChange(undefined);
                            }
                          }}
                          data-testid="input-fecha-entrega"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado*</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-estado">
                            <SelectValue />
                          </SelectTrigger>
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
                  )}
                />

                <FormField
                  control={form.control}
                  name="total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} data-testid="input-total" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ''} data-testid="input-observaciones" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog} data-testid="button-cancelar">
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-guardar">
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
