import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Edit, Trash2, X, ClipboardList, Receipt } from "lucide-react";
import { useLocation } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Presupuesto, Cliente, Vehiculo } from "@shared/schema";
import { insertPresupuestoSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

const presupuestoLineaSchema = z.object({
  tipo: z.enum(['mano_obra', 'articulo', 'otros']),
  descripcion: z.string().min(1, "Descripción requerida"),
  cantidad: z.number().min(0.01, "Cantidad mínima 0.01"),
  precioUnitario: z.number().min(0, "Precio no puede ser negativo"),
  igic: z.number().default(7),
});

type PresupuestoLinea = z.infer<typeof presupuestoLineaSchema>;

type FormValues = z.infer<typeof insertPresupuestoSchema> & {
  lineasArray: PresupuestoLinea[];
};

export default function Presupuestos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPresupuesto, setEditingPresupuesto] = useState<Presupuesto | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: presupuestos, isLoading } = useQuery<Presupuesto[]>({
    queryKey: ["/api/presupuestos"],
  });

  const { data: clientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const { data: vehiculos } = useQuery<Vehiculo[]>({
    queryKey: ["/api/vehiculos"],
  });

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  const pendientes = presupuestos?.filter(p => !p.aprobado).length || 0;
  const aprobadosMes = presupuestos?.filter(p => {
    const fecha = p.fecha && new Date(p.fecha);
    return p.aprobado && fecha && fecha >= firstDayOfMonth && fecha < firstDayNextMonth;
  }).length || 0;
  const totalMes = presupuestos?.filter(p => {
    const fecha = p.fecha && new Date(p.fecha);
    return fecha && fecha >= firstDayOfMonth && fecha < firstDayNextMonth;
  }).reduce((sum, p) => sum + parseFloat(p.total.toString()), 0) || 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(insertPresupuestoSchema.extend({
      clienteId: z.number().int().min(1, "Debe seleccionar un cliente"),
      vehiculoId: z.number().int().min(1, "Debe seleccionar un vehículo"),
      lineasArray: z.array(presupuestoLineaSchema),
      total: z.union([z.string(), z.number()]),
      totalIgic: z.union([z.string(), z.number()]),
    })),
    defaultValues: {
      codigo: "",
      clienteId: undefined,
      vehiculoId: undefined,
      fecha: new Date(),
      total: "0",
      totalIgic: "0",
      aprobado: false,
      notas: "",
      lineasArray: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineasArray",
  });

  const lineasArray = form.watch("lineasArray");

  useMemo(() => {
    const subtotal = lineasArray.reduce((sum, linea) => sum + (linea.cantidad * linea.precioUnitario), 0);
    const totalIgic = lineasArray.reduce((sum, linea) => sum + (linea.cantidad * linea.precioUnitario * (linea.igic / 100)), 0);
    const total = subtotal + totalIgic;

    form.setValue("total", total.toFixed(2));
    form.setValue("totalIgic", totalIgic.toFixed(2));
  }, [lineasArray, form]);

  const handleOpenDialog = (presupuesto?: Presupuesto) => {
    if (presupuesto) {
      setEditingPresupuesto(presupuesto);
      let parsedLineas = [];
      try {
        parsedLineas = JSON.parse(presupuesto.lineas || "[]");
      } catch (e) {
        console.error("Error parsing budget lines", e);
      }
      form.reset({
        codigo: presupuesto.codigo,
        clienteId: presupuesto.clienteId,
        vehiculoId: presupuesto.vehiculoId,
        fecha: presupuesto.fecha ? new Date(presupuesto.fecha) : new Date(),
        total: presupuesto.total.toString(),
        totalIgic: presupuesto.totalIgic?.toString() || "0",
        aprobado: presupuesto.aprobado || false,
        notas: presupuesto.notas || "",
        lineasArray: parsedLineas,
      });
    } else {
      setEditingPresupuesto(null);
      const newCodigo = `PRE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      form.reset({
        codigo: newCodigo,
        clienteId: undefined,
        vehiculoId: undefined,
        fecha: new Date(),
        total: "0",
        totalIgic: "0",
        aprobado: false,
        notas: "",
        lineasArray: [],
      });
    }
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("/api/presupuestos", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presupuestos"] });
      toast({
        title: "Presupuesto creado",
        description: "El presupuesto se ha creado correctamente",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el presupuesto",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest(`/api/presupuestos/${editingPresupuesto?.id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presupuestos"] });
      toast({
        title: "Presupuesto actualizado",
        description: "El presupuesto se ha actualizado correctamente",
      });
      setDialogOpen(false);
      setEditingPresupuesto(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el presupuesto",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/presupuestos/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presupuestos"] });
      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto se ha eliminado correctamente",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el presupuesto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    const { lineasArray, ...rest } = data;
    const finalData = {
      ...rest,
      lineas: JSON.stringify(lineasArray),
    };
    if (editingPresupuesto) {
      updateMutation.mutate(finalData as any);
    } else {
      createMutation.mutate(finalData as any);
    }
  };

  const clienteId = form.watch("clienteId");
  const vehiculosFiltrados = vehiculos?.filter(v => v.clienteId === clienteId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Presupuestos</h1>
          <p className="text-muted-foreground">Gestión de presupuestos</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-nuevo-presupuesto">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Presupuesto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-presupuestos-pendientes">
              {isLoading ? <Skeleton className="h-8 w-12" /> : pendientes}
            </div>
            <p className="text-xs text-muted-foreground">
              Esperando aprobación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-presupuestos-aprobados">
              {isLoading ? <Skeleton className="h-8 w-12" /> : aprobadosMes}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-presupuestos-mes">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${totalMes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              En presupuestos
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Presupuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : !presupuestos || presupuestos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay presupuestos registrados</p>
                        <Button 
                          variant="outline" 
                          className="mt-2" 
                          onClick={() => handleOpenDialog()}
                          data-testid="button-crear-primer-presupuesto"
                        >
                          Crear el primer presupuesto
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  presupuestos.map((presupuesto) => {
                    const cliente = clientes?.find(c => c.id === presupuesto.clienteId);
                    const vehiculo = vehiculos?.find(v => v.id === presupuesto.vehiculoId);
                    return (
                      <TableRow key={presupuesto.id} data-testid={`row-presupuesto-${presupuesto.id}`}>
                        <TableCell className="font-medium">{presupuesto.codigo}</TableCell>
                        <TableCell>{cliente?.nombre || 'Cliente'}</TableCell>
                        <TableCell>
                          {vehiculo ? `${vehiculo.matricula} - ${vehiculo.marca}` : '-'}
                        </TableCell>
                        <TableCell>
                          {presupuesto.fecha ? new Date(presupuesto.fecha).toLocaleDateString('es-ES') : '-'}
                        </TableCell>
                        <TableCell>{parseFloat(presupuesto.total.toString()).toFixed(2)} €</TableCell>
                        <TableCell>
                          <Badge variant={presupuesto.aprobado ? "default" : "secondary"}>
                            {presupuesto.aprobado ? "Aprobado" : "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Crear Orden de Reparación"
                              onClick={() => setLocation(`/ordenes?clienteId=${presupuesto.clienteId}&vehiculoId=${presupuesto.vehiculoId}`)}
                              data-testid={`button-crear-or-${presupuesto.id}`}
                            >
                              <ClipboardList className="h-4 w-4" />
                            </Button>
                            {presupuesto.aprobado && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Crear Factura"
                                onClick={() => setLocation(`/facturas?clienteId=${presupuesto.clienteId}`)}
                                data-testid={`button-crear-factura-${presupuesto.id}`}
                              >
                                <Receipt className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenDialog(presupuesto)}
                              data-testid={`button-editar-${presupuesto.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setDeleteId(presupuesto.id)}
                              data-testid={`button-eliminar-${presupuesto.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-presupuesto">
          <DialogHeader>
            <DialogTitle>{editingPresupuesto ? "Editar Presupuesto" : "Nuevo Presupuesto"}</DialogTitle>
            <DialogDescription>
              {editingPresupuesto ? "Modifica los datos del presupuesto" : "Completa el formulario para crear un nuevo presupuesto"}
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
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input placeholder="PRE-001" {...field} data-testid="input-codigo" />
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
                      <FormLabel>Fecha</FormLabel>
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
                  name="total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              data-testid="input-total"
                            />
                          </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalIgic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IGIC (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          data-testid="input-igic"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales"
                        {...field}
                        value={field.value ?? ""}
                        data-testid="input-notas"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Líneas de Presupuesto</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ tipo: 'articulo', descripcion: '', cantidad: 1, precioUnitario: 0, igic: 7 })}
                    data-testid="button-añadir-linea"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Línea
                  </Button>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="w-[100px]">Cant.</TableHead>
                        <TableHead className="w-[120px]">Precio (€)</TableHead>
                        <TableHead className="w-[80px]">IGIC %</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`lineasArray.${index}.tipo`}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-tipo-linea-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="mano_obra">Mano de Obra</SelectItem>
                                    <SelectItem value="articulo">Artículo</SelectItem>
                                    <SelectItem value="otros">Otros</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`lineasArray.${index}.descripcion`}
                              render={({ field }) => (
                                <FormControl>
                                  <Input {...field} placeholder="Descripción" data-testid={`input-descripcion-linea-${index}`} />
                                </FormControl>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`lineasArray.${index}.cantidad`}
                              render={({ field }) => (
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    data-testid={`input-cantidad-linea-${index}`}
                                  />
                                </FormControl>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`lineasArray.${index}.precioUnitario`}
                              render={({ field }) => (
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    data-testid={`input-precio-linea-${index}`}
                                  />
                                </FormControl>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`lineasArray.${index}.igic`}
                              render={({ field }) => (
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    data-testid={`input-igic-linea-${index}`}
                                  />
                                </FormControl>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              data-testid={`button-eliminar-linea-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {fields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            No hay líneas añadidas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

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
                  {editingPresupuesto ? "Actualizar" : "Crear"} Presupuesto
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
              Esta acción no se puede deshacer. Se eliminará el presupuesto permanentemente.
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
