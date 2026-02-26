import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ClipboardList, Calendar, Edit, Trash2, Search, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { OrdenReparacion, Cliente, Vehiculo } from "@shared/schema";
import { insertOrdenReparacionSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { PaginationControls } from "@/components/pagination-controls";
import { exportToCSV } from "@/lib/export-csv";

type FormValues = z.infer<typeof insertOrdenReparacionSchema>;

const estadoColors = {
  abierta: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  en_curso: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  a_la_espera: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  terminada: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  facturada: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
};

const estadoLabels = {
  abierta: "Abierta",
  en_curso: "En Curso",
  a_la_espera: "A la Espera",
  terminada: "Terminada",
  facturada: "Facturada",
};

export default function Ordenes() {
  const estados: Array<keyof typeof estadoColors> = ["abierta", "en_curso", "a_la_espera", "terminada", "facturada"];
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrden, setEditingOrden] = useState<OrdenReparacion | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: ordenes, isLoading } = useQuery<OrdenReparacion[]>({
    queryKey: ["/api/ordenes"],
  });

  const { data: clientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const { data: vehiculos } = useQuery<Vehiculo[]>({
    queryKey: ["/api/vehiculos"],
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filteredOrdenes = ordenes?.filter(orden => {
    const searchLower = searchTerm.toLowerCase();
    const cliente = clientes?.find(c => c.id === orden.clienteId);
    const vehiculo = vehiculos?.find(v => v.id === orden.vehiculoId);
    return (
      orden.codigo.toLowerCase().includes(searchLower) ||
      (cliente?.nombre.toLowerCase().includes(searchLower)) ||
      (vehiculo?.matricula.toLowerCase().includes(searchLower))
    );
  }) || [];

  const paginatedOrdenes = filteredOrdenes.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(insertOrdenReparacionSchema.extend({
      clienteId: z.number().int().min(1, "Debe seleccionar un cliente"),
      vehiculoId: z.number().int().min(1, "Debe seleccionar un vehículo"),
    })),
    defaultValues: {
      codigo: "",
      clienteId: undefined,
      vehiculoId: undefined,
      fechaApertura: new Date(),
      kmEntrada: 0,
      estado: "abierta",
      observaciones: "",
    },
  });

  const handleOpenDialog = (orden?: OrdenReparacion) => {
    if (orden) {
      setEditingOrden(orden);
      form.reset({
        codigo: orden.codigo,
        clienteId: orden.clienteId,
        vehiculoId: orden.vehiculoId,
        fechaApertura: orden.fechaApertura ? new Date(orden.fechaApertura) : new Date(),
        kmEntrada: orden.kmEntrada || 0,
        estado: orden.estado,
        observaciones: orden.observaciones || "",
      });
    } else {
      setEditingOrden(null);
      const newCodigo = `OR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      form.reset({
        codigo: newCodigo,
        clienteId: undefined,
        vehiculoId: undefined,
        fechaApertura: new Date(),
        kmEntrada: 0,
        estado: "abierta",
        observaciones: "",
      });
    }
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("/api/ordenes", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes"] });
      toast({
        title: "Orden creada",
        description: "La orden de reparación se ha creado correctamente",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la orden",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest(`/api/ordenes/${editingOrden?.id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes"] });
      toast({
        title: "Orden actualizada",
        description: "La orden de reparación se ha actualizado correctamente",
      });
      setDialogOpen(false);
      setEditingOrden(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la orden",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/ordenes/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes"] });
      toast({
        title: "Orden eliminada",
        description: "La orden de reparación se ha eliminado correctamente",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la orden",
        variant: "destructive",
      });
    },
  });

  const handleExportCSV = () => {
    const dataToExport = filteredOrdenes.map(o => ({
      codigo: o.codigo,
      fechaApertura: o.fechaApertura ? format(new Date(o.fechaApertura), 'yyyy-MM-dd') : '',
      estado: o.estado,
      kilometrajeEntrada: o.kmEntrada || 0
    }));
    exportToCSV(dataToExport, "ordenes.csv");
  };

  const onSubmit = (data: FormValues) => {
    if (editingOrden) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const clienteId = form.watch("clienteId");
  const vehiculosFiltrados = vehiculos?.filter(v => v.clienteId === clienteId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Órdenes de Reparación</h1>
          <p className="text-muted-foreground">Gestión de órdenes de reparación</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} data-testid="button-exportar-ordenes">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => handleOpenDialog()} data-testid="button-nueva-or">
            <Plus className="h-4 w-4 mr-2" />
            Nueva OR
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Órdenes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, cliente, matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-buscar-orden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {estados.map((estado) => {
          const ordenesEstado = paginatedOrdenes.filter(o => o.estado === estado);
          return (
            <Card key={estado}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={estadoColors[estado]}>
                      {estadoLabels[estado]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {isLoading ? <Skeleton className="h-4 w-16 inline-block" /> : `${ordenesEstado.length} órdenes`}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="space-y-3 min-h-32" 
                  data-testid={`list-ordenes-${estado}`}
                >
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-3 w-3/4" />
                        </CardContent>
                      </Card>
                    ))
                  ) : ordenesEstado.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <p>No hay órdenes en este estado</p>
                    </div>
                  ) : (
                    ordenesEstado.map((orden) => {
                      const cliente = clientes?.find(c => c.id === orden.clienteId);
                      const vehiculo = vehiculos?.find(v => v.id === orden.vehiculoId);
                      return (
                        <Card key={orden.id} className="hover-elevate" data-testid={`card-orden-${orden.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold" data-testid={`text-numero-orden-${orden.id}`}>
                                    {orden.codigo}
                                  </span>
                                  {vehiculo && (
                                    <Badge variant="outline">{vehiculo.matricula}</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {cliente?.nombre || 'Cliente'} - {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : 'Vehículo'}
                                </p>
                                {orden.fechaApertura && (
                                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(orden.fechaApertura).toLocaleDateString('es-ES')}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {orden.estado === 'terminada' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => navigate(`/facturas?orId=${orden.id}&clienteId=${orden.clienteId}`)}
                                    data-testid={`button-crear-factura-orden-${orden.id}`}
                                  >
                                    Crear Factura
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleOpenDialog(orden)}
                                  data-testid={`button-editar-orden-${orden.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => setDeleteId(orden.id)}
                                  data-testid={`button-eliminar-orden-${orden.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => navigate(`/ordenes/${orden.id}`)}
                                  data-testid={`button-ver-orden-${orden.id}`}
                                >
                                  Ver detalles
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <PaginationControls
        total={filteredOrdenes.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-orden">
          <DialogHeader>
            <DialogTitle>{editingOrden ? "Editar Orden de Reparación" : "Nueva Orden de Reparación"}</DialogTitle>
            <DialogDescription>
              {editingOrden ? "Modifica los datos de la orden" : "Completa el formulario para crear una nueva orden"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código OR</FormLabel>
                      <FormControl>
                        <Input placeholder="OR-123456" {...field} data-testid="input-codigo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-estado">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="abierta">Abierta</SelectItem>
                          <SelectItem value="en_curso">En Curso</SelectItem>
                          <SelectItem value="a_la_espera">A la Espera</SelectItem>
                          <SelectItem value="terminada">Terminada</SelectItem>
                          <SelectItem value="facturada">Facturada</SelectItem>
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
                  name="clienteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          form.setValue("vehiculoId", 0);
                        }}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-cliente">
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientes?.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id.toString()}>
                              {cliente.nombre} {cliente.apellidos || ''} - {cliente.nif}
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
                  name="vehiculoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehículo</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                        disabled={!clienteId || clienteId === 0}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-vehiculo">
                            <SelectValue placeholder="Seleccionar vehículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehiculosFiltrados.map((vehiculo) => (
                            <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                              {vehiculo.matricula} - {vehiculo.marca} {vehiculo.modelo}
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
                  name="fechaApertura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Apertura</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          data-testid="input-fecha"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="kmEntrada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kilometraje</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-kilometraje"
                        />
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
                    <FormLabel>Observaciones (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones sobre la orden"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-observaciones"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancelar"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-guardar"
                >
                  {editingOrden ? "Actualizar" : "Crear"} Orden
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent data-testid="dialog-confirmar-eliminar">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la orden de reparación permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-eliminar">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirmar-eliminar"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
