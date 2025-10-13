import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Car, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Vehiculo, InsertVehiculo, Cliente } from "@shared/schema";
import { insertVehiculoSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

type FormValues = z.infer<typeof insertVehiculoSchema>;

export default function Vehiculos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: vehiculos, isLoading } = useQuery<Vehiculo[]>({
    queryKey: ["/api/vehiculos"],
  });

  const { data: clientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const filteredVehiculos = vehiculos?.filter(vehiculo => {
    const searchLower = searchTerm.toLowerCase();
    return (
      vehiculo.matricula.toLowerCase().includes(searchLower) ||
      (vehiculo.vin?.toLowerCase().includes(searchLower)) ||
      vehiculo.marca.toLowerCase().includes(searchLower) ||
      vehiculo.modelo.toLowerCase().includes(searchLower)
    );
  }) || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(insertVehiculoSchema.extend({
      clienteId: z.number().int().min(1, "Debe seleccionar un cliente"),
    })),
    defaultValues: {
      clienteId: undefined,
      matricula: "",
      vin: "",
      marca: "",
      modelo: "",
      version: "",
      año: undefined,
      combustible: "",
      km: undefined,
      itvFecha: undefined,
      seguro: "",
      color: "",
      observaciones: "",
    },
  });

  const handleOpenDialog = (vehiculo?: Vehiculo) => {
    if (vehiculo) {
      setEditingVehiculo(vehiculo);
      form.reset({
        clienteId: vehiculo.clienteId,
        matricula: vehiculo.matricula,
        vin: vehiculo.vin || "",
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        version: vehiculo.version || "",
        año: vehiculo.año || undefined,
        combustible: vehiculo.combustible || "",
        km: vehiculo.km || undefined,
        itvFecha: vehiculo.itvFecha || undefined,
        seguro: vehiculo.seguro || "",
        color: vehiculo.color || "",
        observaciones: vehiculo.observaciones || "",
      });
    } else {
      setEditingVehiculo(null);
      form.reset({
        clienteId: undefined,
        matricula: "",
        vin: "",
        marca: "",
        modelo: "",
        version: "",
        año: undefined,
        combustible: "",
        km: undefined,
        itvFecha: undefined,
        seguro: "",
        color: "",
        observaciones: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVehiculo(null);
    form.reset();
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) =>
      await apiRequest("/api/vehiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehiculos"] });
      toast({
        title: "Vehículo registrado",
        description: "El vehículo se ha registrado correctamente",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo registrar el vehículo",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!editingVehiculo) throw new Error("No hay vehículo seleccionado");
      return await apiRequest(`/api/vehiculos/${editingVehiculo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehiculos"] });
      toast({
        title: "Vehículo actualizado",
        description: "El vehículo se ha actualizado correctamente",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el vehículo",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      await apiRequest(`/api/vehiculos/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehiculos"] });
      toast({
        title: "Vehículo eliminado",
        description: "El vehículo se ha eliminado correctamente",
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el vehículo",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (editingVehiculo) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const getClienteNombre = (clienteId: number) => {
    const cliente = clientes?.find(c => c.id === clienteId);
    if (!cliente) return "-";
    return cliente.tipo === "empresa" 
      ? cliente.razonSocial 
      : `${cliente.nombre} ${cliente.apellidos || ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehículos</h1>
          <p className="text-muted-foreground">Gestión de vehículos</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-nuevo-vehiculo">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Vehículo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Vehículos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por matrícula, VIN, marca, modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-buscar-vehiculo"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Vehículos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Kilómetros</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredVehiculos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Car className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay vehículos registrados</p>
                        <Button 
                          variant="ghost" 
                          className="mt-2"
                          onClick={() => handleOpenDialog()}
                          data-testid="button-crear-primer-vehiculo"
                        >
                          Registrar el primer vehículo
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehiculos.map((vehiculo) => (
                    <TableRow key={vehiculo.id} data-testid={`row-vehiculo-${vehiculo.id}`}>
                      <TableCell className="font-medium" data-testid={`text-matricula-${vehiculo.id}`}>
                        {vehiculo.matricula}
                      </TableCell>
                      <TableCell>{vehiculo.marca}</TableCell>
                      <TableCell>{vehiculo.modelo}</TableCell>
                      <TableCell>{getClienteNombre(vehiculo.clienteId)}</TableCell>
                      <TableCell>{vehiculo.km ? `${vehiculo.km} km` : "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenDialog(vehiculo)}
                          data-testid={`button-editar-${vehiculo.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDeleteId(vehiculo.id)}
                          data-testid={`button-eliminar-${vehiculo.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVehiculo ? "Editar Vehículo" : "Nuevo Vehículo"}
            </DialogTitle>
            <DialogDescription>
              {editingVehiculo
                ? "Modifica los datos del vehículo"
                : "Completa los datos del nuevo vehículo"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clienteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-cliente">
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes?.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.tipo === "empresa" 
                              ? cliente.razonSocial 
                              : `${cliente.nombre} ${cliente.apellidos || ""}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="matricula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matrícula *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="1234ABC" data-testid="input-matricula" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIN/Bastidor</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="WVW..." data-testid="input-vin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="marca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Toyota" data-testid="input-marca" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Corolla" data-testid="input-modelo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versión</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1.8 Hybrid" data-testid="input-version" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="año"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Año</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="2020" 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ""}
                          data-testid="input-año"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="combustible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Combustible</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Gasolina" data-testid="input-combustible" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="km"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kilómetros</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="50000" 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ""}
                          data-testid="input-km"
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
                  name="itvFecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha ITV</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date" 
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                          data-testid="input-itv"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Blanco" data-testid="input-color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="seguro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seguro</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Mapfre" data-testid="input-seguro" />
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
                      <Textarea {...field} placeholder="Notas adicionales" data-testid="input-observaciones" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  data-testid="button-cancelar"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-guardar-vehiculo"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Guardando..."
                    : "Guardar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El vehículo será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-eliminar">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
