import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Calendar, 
  Car, 
  User as UserIcon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Package,
  FileText,
  PlayCircle,
  CheckCircle
} from "lucide-react";
import { RecepcionChecklist } from "@/components/recepcion-checklist";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import { 
  insertParteTrabajoSchema, 
  insertConsumoArticuloSchema,
  type OrdenReparacion,
  type ParteTrabajo,
  type ConsumoArticulo,
  type Articulo,
  type User
} from "@shared/schema";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  observacion?: string;
}

export default function OrdenDetalle() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: orden, isLoading: isLoadingOrden } = useQuery<OrdenReparacion & {
    clienteNombre?: string;
    clienteNif?: string;
    vehiculoMatricula?: string;
    vehiculoMarca?: string;
    vehiculoModelo?: string;
  }>({
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
      return apiRequest(`/api/ordenes/${id}`, {
        method: "PUT",
        body: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes"] });
    },
  });

  const addParteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/ordenes/${id}/partes`, {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes", id, "partes"] });
      toast({ title: "Parte de trabajo añadido" });
      parteForm.reset();
    },
  });

  const addConsumoMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/ordenes/${id}/consumos`, {
        method: "POST",
        body: data,
      });
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

  const handleSaveRecepcion = (checklist: ChecklistItem[], signature: string) => {
    updateOrdenMutation.mutate({ 
      checklistRecepcion: JSON.stringify(checklist),
      firmaDigital: signature,
    });
    toast({
      title: "Recepción guardada",
      description: "El checklist y la firma se han guardado correctamente.",
    });
  };

  const handleCreateFactura = () => {
    navigate(`/facturas?orId=${id}&clienteId=${orden?.clienteId}`);
  };

  if (isLoadingOrden || isLoadingPartes || isLoadingConsumos) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
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

  const checklist: ChecklistItem[] = orden.checklistRecepcion 
    ? JSON.parse(orden.checklistRecepcion) 
    : undefined;

  const totalMO = partes?.reduce((sum, p) => sum + (Number(p.precioMO || 0) * Number(p.tiempoEstimado || 0)), 0) || 0;
  const totalArticulos = consumos?.reduce((sum, c) => sum + (Number(c.precioUnitario || 0) * Number(c.cantidad || 0)), 0) || 0;
  const totalIgic = consumos?.reduce((sum, c) => sum + (Number(c.precioUnitario || 0) * Number(c.cantidad || 0) * (Number(c.igic || 0) / 100)), 0) || 0;
  const totalGeneral = totalMO + totalArticulos + totalIgic;

  const mecanicos = usuarios?.filter(u => u.rol === 'mecanico' || u.rol === 'jefe_taller') || [];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/ordenes")}
          data-testid="button-volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            OR-{orden.id.toString().padStart(5, '0')}
          </h1>
          <p className="text-muted-foreground">Orden de Reparación</p>
        </div>
        <div className="flex gap-2">
          {orden.estado === 'terminada' && (
            <Button 
              onClick={handleCreateFactura}
              variant="default"
              data-testid="button-crear-factura"
            >
              <FileText className="mr-2 h-4 w-4" />
              Crear Factura
            </Button>
          )}
          <Badge className="text-sm px-3 py-1" variant={
            orden.estado === 'abierta' ? 'default' :
            orden.estado === 'en_curso' ? 'secondary' :
            orden.estado === 'terminada' ? 'outline' :
            'destructive'
          }>
            {orden.estado.toUpperCase()}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acciones de Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={orden.estado === 'abierta' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('abierta')}
              disabled={updateOrdenMutation.isPending}
              data-testid="button-estado-abierta"
            >
              <Clock className="mr-2 h-4 w-4" />
              Abierta
            </Button>
            <Button 
              variant={orden.estado === 'en_curso' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('en_curso')}
              disabled={updateOrdenMutation.isPending}
              data-testid="button-estado-encurso"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              En Curso
            </Button>
            <Button 
              variant={orden.estado === 'terminada' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('terminada')}
              disabled={updateOrdenMutation.isPending}
              data-testid="button-estado-terminada"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Terminada
            </Button>
            <Button 
              variant={orden.estado === 'facturada' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('facturada')}
              disabled={true} // Se cambia automáticamente al facturar
              data-testid="button-estado-facturada"
            >
              <FileText className="mr-2 h-4 w-4" />
              Facturada
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserIcon className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{orden.clienteNombre || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">NIF</p>
              <p className="font-medium">{orden.clienteNif || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5" />
              Información del Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Matrícula</p>
                <p className="font-medium">{orden.vehiculoMatricula || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">KM Entrada</p>
                <p className="font-medium">{orden.kmEntrada || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Marca / Modelo</p>
              <p className="font-medium">
                {orden.vehiculoMarca} {orden.vehiculoModelo}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5" />
            Partes de Trabajo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Mecánico</TableHead>
                <TableHead className="text-right">Horas</TableHead>
                <TableHead className="text-right">Precio/h</TableHead>
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
                    <TableCell>{mecanico ? `${mecanico.nombre} ${mecanico.apellidos || ''}` : '-'}</TableCell>
                    <TableCell className="text-right">{Number(parte.tiempoEstimado).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{Number(parte.precioMO).toFixed(2)}€</TableCell>
                    <TableCell className="text-right">{(Number(parte.precioMO) * Number(parte.tiempoEstimado)).toFixed(2)}€</TableCell>
                    <TableCell className="text-center">
                      {parte.completado ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /> : <Clock className="h-4 w-4 text-amber-500 mx-auto" />}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!partes || partes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No hay partes de trabajo registrados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium mb-4">Añadir Parte de Trabajo</h4>
            <Form {...parteForm}>
              <form onSubmit={parteForm.handleSubmit((data) => addParteMutation.mutate(data))} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <FormField
                  control={parteForm.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej. Cambio de aceite" data-testid="input-parte-descripcion" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={parteForm.control}
                  name="mecanicoId"
                  render={({ field }) => (
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
                  )}
                />
                <FormField
                  control={parteForm.control}
                  name="tiempoEstimado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.25" {...field} data-testid="input-parte-horas" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={addParteMutation.isPending} data-testid="button-add-parte">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Consumos de Artículos (Recambios)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referencia</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Un.</TableHead>
                <TableHead className="text-right">IGIC</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consumos?.map((consumo) => (
                <TableRow key={consumo.id}>
                  <TableCell className="font-mono text-xs">{consumo.articulo?.referencia || '-'}</TableCell>
                  <TableCell>{consumo.articulo?.descripcion || '-'}</TableCell>
                  <TableCell className="text-right">{Number(consumo.cantidad).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{Number(consumo.precioUnitario).toFixed(2)}€</TableCell>
                  <TableCell className="text-right">{Number(consumo.igic).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{(Number(consumo.precioUnitario) * Number(consumo.cantidad)).toFixed(2)}€</TableCell>
                </TableRow>
              ))}
              {(!consumos || consumos.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No hay artículos consumidos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium mb-4">Añadir Recambio</h4>
            <Form {...consumoForm}>
              <form onSubmit={consumoForm.handleSubmit((data) => addConsumoMutation.mutate(data))} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <FormField
                  control={consumoForm.control}
                  name="articuloId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Artículo</FormLabel>
                      <Select 
                        onValueChange={(val) => {
                          const id = parseInt(val);
                          field.onChange(id);
                          const art = articulos?.find(a => a.id === id);
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
                              {a.referencia} - {a.descripcion} ({Number(a.precioVenta).toFixed(2)}€)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={consumoForm.control}
                  name="cantidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" {...field} data-testid="input-consumo-cantidad" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={consumoForm.control}
                  name="precioUnitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Unit.</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} data-testid="input-consumo-precio" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={addConsumoMutation.isPending} data-testid="button-add-consumo">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Resumen Económico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Mano de Obra:</span>
            <span>{totalMO.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Recambios:</span>
            <span>{totalArticulos.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total IGIC:</span>
            <span>{totalIgic.toFixed(2)}€</span>
          </div>
          <Separator />
          <div className="flex justify-between text-xl font-bold">
            <span>TOTAL GENERAL:</span>
            <span className="text-primary">{totalGeneral.toFixed(2)}€</span>
          </div>
        </CardContent>
      </Card>

      <RecepcionChecklist
        onSave={handleSaveRecepcion}
        initialChecklist={checklist}
        initialSignature={orden.firmaDigital || undefined}
      />
    </div>
  );
}
