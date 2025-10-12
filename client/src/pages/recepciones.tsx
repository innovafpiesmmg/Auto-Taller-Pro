import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, PackageCheck, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Recepcion, Proveedor, PedidoCompra } from "@shared/schema";
import { insertRecepcionSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

const formSchema = insertRecepcionSchema.extend({
  fecha: z.coerce.date(),
  pedidoId: z.number().optional(),
  recibidoPorId: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Recepciones() {
  const [open, setOpen] = useState(false);
  const [editingRecepcion, setEditingRecepcion] = useState<Recepcion | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: recepciones, isLoading } = useQuery<Recepcion[]>({
    queryKey: ["/api/recepciones"],
  });

  const { data: proveedores } = useQuery<Proveedor[]>({
    queryKey: ["/api/proveedores"],
  });

  const { data: pedidos } = useQuery<PedidoCompra[]>({
    queryKey: ["/api/pedidos-compra"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero: "",
      pedidoId: undefined,
      proveedorId: undefined,
      fecha: new Date(),
      albaranProveedor: "",
      recibidoPorId: undefined,
      observaciones: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("/api/recepciones", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recepciones"] });
      toast({
        title: "Recepción creada",
        description: "La recepción se ha creado correctamente",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear la recepción",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!editingRecepcion) throw new Error("No hay recepción seleccionada");
      return await apiRequest(`/api/recepciones/${editingRecepcion.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recepciones"] });
      toast({
        title: "Recepción actualizada",
        description: "La recepción se ha actualizado correctamente",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la recepción",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/recepciones/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recepciones"] });
      toast({
        title: "Recepción eliminada",
        description: "La recepción se ha eliminado correctamente",
      });
      setDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar la recepción",
      });
    },
  });

  const handleEdit = (recepcion: Recepcion) => {
    setEditingRecepcion(recepcion);
    form.reset({
      numero: recepcion.numero,
      pedidoId: recepcion.pedidoId ?? undefined,
      proveedorId: recepcion.proveedorId,
      fecha: new Date(recepcion.fecha),
      albaranProveedor: recepcion.albaranProveedor || "",
      recibidoPorId: recepcion.recibidoPorId ?? undefined,
      observaciones: recepcion.observaciones || "",
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingRecepcion(null);
    form.reset();
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const onSubmit = (data: FormValues) => {
    if (editingRecepcion) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const recepcionesData = recepciones || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recepciones de Almacén</h1>
          <p className="text-muted-foreground">Registro de mercancía recibida</p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="button-nueva-recepcion">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Recepción
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recepciones</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recepcionesData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recepcionesData.filter(r => {
                const fecha = new Date(r.fecha);
                const ahora = new Date();
                return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recepcionesData.filter(r => {
                const fecha = new Date(r.fecha);
                const hoy = new Date();
                return fecha.toDateString() === hoy.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Recepciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Albarán Proveedor</TableHead>
                  <TableHead>Recibido Por</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : recepcionesData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <PackageCheck className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay recepciones registradas</p>
                        <Button variant="ghost" className="mt-2" onClick={() => setOpen(true)} data-testid="button-crear-primera-recepcion">
                          Crear la primera recepción
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  recepcionesData.map((recepcion) => (
                    <TableRow key={recepcion.id} data-testid={`row-recepcion-${recepcion.id}`}>
                      <TableCell className="font-medium" data-testid={`text-numero-${recepcion.id}`}>
                        {recepcion.numero}
                      </TableCell>
                      <TableCell data-testid={`text-fecha-${recepcion.id}`}>
                        {format(new Date(recepcion.fecha), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell data-testid={`text-proveedor-${recepcion.id}`}>
                        {proveedores?.find(p => p.id === recepcion.proveedorId)?.nombre || `Proveedor #${recepcion.proveedorId}`}
                      </TableCell>
                      <TableCell data-testid={`text-pedido-${recepcion.id}`}>
                        {recepcion.pedidoId ? pedidos?.find(p => p.id === recepcion.pedidoId)?.numero || `Pedido #${recepcion.pedidoId}` : '-'}
                      </TableCell>
                      <TableCell data-testid={`text-albaran-${recepcion.id}`}>
                        {recepcion.albaranProveedor || '-'}
                      </TableCell>
                      <TableCell data-testid={`text-recibido-por-${recepcion.id}`}>
                        {recepcion.recibidoPorId ? `Usuario #${recepcion.recibidoPorId}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(recepcion)} data-testid={`button-editar-${recepcion.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(recepcion.id)} data-testid={`button-eliminar-${recepcion.id}`}>
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

      <Dialog open={open} onOpenChange={(open) => { if (open) setOpen(true); else handleCloseDialog(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRecepcion ? 'Editar Recepción' : 'Nueva Recepción'}
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
                      <FormLabel>Número de Recepción*</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-numero" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha*</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value && !isNaN(field.value.getTime()) ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="pedidoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pedido (opcional)</FormLabel>
                      <Select
                        value={field.value?.toString() || 'none'}
                        onValueChange={(value) => field.onChange(value === 'none' ? undefined : parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-pedido">
                            <SelectValue placeholder="Selecciona un pedido" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin pedido</SelectItem>
                          {pedidos?.map(pedido => (
                            <SelectItem key={pedido.id} value={pedido.id.toString()}>
                              {pedido.numero} - {proveedores?.find(p => p.id === pedido.proveedorId)?.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="albaranProveedor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Albarán del Proveedor</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} data-testid="input-albaran" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="alert-dialog-eliminar">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la recepción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-eliminar">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending} data-testid="button-confirmar-eliminar">
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
