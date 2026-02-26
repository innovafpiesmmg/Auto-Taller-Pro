import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Car, Edit, Trash2, Leaf, Scan, Loader2, Download } from "lucide-react";
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
import { PaginationControls } from "@/components/pagination-controls";
import { exportToCSV } from "@/lib/export-csv";

type FormValues = z.infer<typeof insertVehiculoSchema>;

export default function Vehiculos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [etiquetaDGT, setEtiquetaDGT] = useState<{
    etiqueta: string;
    info: { nombre: string; color: string; descripcion: string };
  } | null>(null);
  const [carapiMakes, setCarapiMakes] = useState<{ id: number; name: string }[]>([]);
  const [carapiModels, setCarapiModels] = useState<{ id: number; name: string }[]>([]);
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [isLoadingMakes, setIsLoadingMakes] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const { toast } = useToast();

  const { data: vehiculos, isLoading } = useQuery<Vehiculo[]>({
    queryKey: ["/api/vehiculos"],
  });

  const { data: clientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filteredVehiculos = vehiculos?.filter(vehiculo => {
    const searchLower = searchTerm.toLowerCase();
    return (
      vehiculo.matricula.toLowerCase().includes(searchLower) ||
      (vehiculo.vin?.toLowerCase().includes(searchLower)) ||
      vehiculo.marca.toLowerCase().includes(searchLower) ||
      vehiculo.modelo.toLowerCase().includes(searchLower)
    );
  }) || [];

  const paginatedVehiculos = filteredVehiculos.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

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
    setEtiquetaDGT(null); // Reset etiqueta al abrir diálogo
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
      // Si el vehículo ya tiene etiqueta ambiental, mostrarla
      if (vehiculo.etiquetaAmbiental) {
        setEtiquetaDGT({
          etiqueta: vehiculo.etiquetaAmbiental,
          info: getEtiquetaInfo(vehiculo.etiquetaAmbiental),
        });
      }
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
    setEtiquetaDGT(null);
    form.reset();
  };

  // Helper para obtener info de etiqueta desde el frontend
  const getEtiquetaInfo = (etiqueta: string) => {
    switch (etiqueta) {
      case 'CERO':
        return {
          nombre: 'CERO EMISIONES',
          color: 'blue',
          descripcion: 'Vehículo eléctrico puro o híbrido enchufable con autonomía >40km',
        };
      case 'ECO':
        return {
          nombre: 'ECO',
          color: 'eco', // Verde/azul distintivo dual
          descripcion: 'Vehículo híbrido, GNC o GLP',
        };
      case 'C':
        return {
          nombre: 'C',
          color: 'green', // Solo verde
          descripcion: 'Gasolina desde 2006 o diésel desde 2014',
        };
      case 'B':
        return {
          nombre: 'B',
          color: 'yellow',
          descripcion: 'Gasolina 2001-2005 o diésel 2006-2013',
        };
      default:
        return {
          nombre: 'SIN DISTINTIVO',
          color: 'gray',
          descripcion: 'Vehículo sin etiqueta ambiental',
        };
    }
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

  const calcularEtiquetaMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/vehiculos/${id}/etiqueta-dgt`);
    },
    onSuccess: (data: any) => {
      setEtiquetaDGT(data);
      queryClient.invalidateQueries({ queryKey: ["/api/vehiculos"] });
      toast({
        title: "Etiqueta calculada",
        description: `Etiqueta ambiental: ${data.info.nombre}`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo calcular la etiqueta",
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

  const loadMakes = async (year: number) => {
    setIsLoadingMakes(true);
    try {
      const response = await apiRequest(`/api/carapi/makes?year=${year}`);
      setCarapiMakes(response);
    } catch (error) {
      console.error("Error loading makes:", error);
      setCarapiMakes([]);
    } finally {
      setIsLoadingMakes(false);
    }
  };

  const loadModels = async (makeId: number, year: number) => {
    setIsLoadingModels(true);
    try {
      const response = await apiRequest(`/api/carapi/models?makeId=${makeId}&year=${year}`);
      setCarapiModels(response);
    } catch (error) {
      console.error("Error loading models:", error);
      setCarapiModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const decodeVin = async () => {
    const vin = form.getValues("vin");
    if (!vin || vin.length < 11) {
      toast({
        variant: "destructive",
        title: "VIN inválido",
        description: "Por favor, introduce un VIN válido (al menos 11 caracteres)",
      });
      return;
    }

    setIsDecodingVin(true);
    try {
      const data = await apiRequest(`/api/carapi/vin/${vin}`);
      
      // Rellenar el formulario
      if (data.year) form.setValue("año", data.year);
      if (data.make) form.setValue("marca", data.make);
      if (data.model) form.setValue("modelo", data.model);
      if (data.fuel_type) form.setValue("combustible", data.fuel_type);
      if (data.trim) form.setValue("version", data.trim);

      toast({
        title: "VIN Decodificado",
        description: "Los datos del vehículo se han rellenado automáticamente",
      });

      // Intentar cargar marcas para el año decodificado
      if (data.year) {
        loadMakes(data.year);
      }
    } catch (error) {
      console.error("Error decoding VIN:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo decodificar el VIN o la API no está configurada",
      });
    } finally {
      setIsDecodingVin(false);
    }
  };

  const selectedYear = form.watch("año");
  const selectedMarca = form.watch("marca");

  useEffect(() => {
    if (selectedYear && selectedYear >= 1990 && selectedYear <= new Date().getFullYear() + 1) {
      loadMakes(selectedYear);
    } else {
      setCarapiMakes([]);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (selectedMarca && carapiMakes.length > 0 && selectedYear) {
      const make = carapiMakes.find(m => m.name.toLowerCase() === selectedMarca.toLowerCase());
      if (make) {
        loadModels(make.id, selectedYear);
      } else {
        setCarapiModels([]);
      }
    } else {
      setCarapiModels([]);
    }
  }, [selectedMarca, carapiMakes, selectedYear]);

  const handleExportCSV = () => {
    const dataToExport = filteredVehiculos.map(v => ({
      id: v.id,
      matricula: v.matricula,
      vin: v.vin || '',
      marca: v.marca,
      modelo: v.modelo,
      anio: v.año || '',
      combustible: v.combustible || ''
    }));
    exportToCSV(dataToExport, "vehiculos.csv");
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} data-testid="button-exportar-vehiculos">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => handleOpenDialog()} data-testid="button-nuevo-vehiculo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Vehículo
          </Button>
        </div>
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
                  <TableHead>Etiqueta DGT</TableHead>
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
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedVehiculos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
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
                  paginatedVehiculos.map((vehiculo) => (
                    <TableRow key={vehiculo.id} data-testid={`row-vehiculo-${vehiculo.id}`}>
                      <TableCell className="font-medium" data-testid={`text-matricula-${vehiculo.id}`}>
                        {vehiculo.matricula}
                      </TableCell>
                      <TableCell>{vehiculo.marca}</TableCell>
                      <TableCell>{vehiculo.modelo}</TableCell>
                      <TableCell>{getClienteNombre(vehiculo.clienteId)}</TableCell>
                      <TableCell>
                        {vehiculo.etiquetaAmbiental ? (
                          <Badge 
                            variant={
                              getEtiquetaInfo(vehiculo.etiquetaAmbiental).color === 'blue' ? 'default' :
                              getEtiquetaInfo(vehiculo.etiquetaAmbiental).color === 'eco' ? 'default' :
                              getEtiquetaInfo(vehiculo.etiquetaAmbiental).color === 'green' ? 'default' :
                              getEtiquetaInfo(vehiculo.etiquetaAmbiental).color === 'yellow' ? 'secondary' :
                              'outline'
                            }
                            className={
                              getEtiquetaInfo(vehiculo.etiquetaAmbiental).color === 'blue' ? 'bg-blue-500' :
                              getEtiquetaInfo(vehiculo.etiquetaAmbiental).color === 'eco' ? 'bg-gradient-to-r from-green-500 to-blue-500' :
                              getEtiquetaInfo(vehiculo.etiquetaAmbiental).color === 'green' ? 'bg-green-600' :
                              getEtiquetaInfo(vehiculo.etiquetaAmbiental).color === 'yellow' ? 'bg-yellow-500 text-black' :
                              ''
                            }
                            data-testid={`badge-etiqueta-${vehiculo.id}`}
                          >
                            {getEtiquetaInfo(vehiculo.etiquetaAmbiental).nombre}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
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
          <PaginationControls
            total={filteredVehiculos.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
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
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            placeholder="WVW..." 
                            data-testid="input-vin" 
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={decodeVin} 
                          disabled={isDecodingVin}
                          title="Decodificar VIN"
                          data-testid="button-decode-vin"
                        >
                          {isDecodingVin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                        </Button>
                      </div>
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
                      {carapiMakes.length > 0 ? (
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-marca">
                              <SelectValue placeholder="Selecciona marca" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {carapiMakes.map((make) => (
                              <SelectItem key={make.id} value={make.name}>
                                {make.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input {...field} placeholder="Toyota" data-testid="input-marca" />
                        </FormControl>
                      )}
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
                      {carapiModels.length > 0 ? (
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-modelo">
                              <SelectValue placeholder="Selecciona modelo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {carapiModels.map((model) => (
                              <SelectItem key={model.id} value={model.name}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input {...field} placeholder="Corolla" data-testid="input-modelo" />
                        </FormControl>
                      )}
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
                        <Input 
                          {...field} 
                          value={field.value || ""} 
                          placeholder="1.8 Hybrid" 
                          data-testid="input-version" 
                        />
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
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            placeholder="Gasolina" 
                            data-testid="input-combustible" 
                          />
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
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            placeholder="Blanco" 
                            data-testid="input-color" 
                          />
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
                        <Input 
                          {...field} 
                          value={field.value || ""} 
                          placeholder="Mapfre" 
                          data-testid="input-seguro" 
                        />
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
                        <Textarea 
                          {...field} 
                          value={field.value || ""} 
                          placeholder="Notas adicionales" 
                          data-testid="input-observaciones" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              {/* Etiqueta Ambiental DGT */}
              {editingVehiculo && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-semibold text-sm">Etiqueta Ambiental DGT</h4>
                        <p className="text-xs text-muted-foreground">
                          Calculada según año y combustible
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {etiquetaDGT && (
                        <div className="flex flex-col items-end gap-1">
                          <Badge 
                            variant={
                              etiquetaDGT.info.color === 'blue' ? 'default' :
                              etiquetaDGT.info.color === 'eco' ? 'default' :
                              etiquetaDGT.info.color === 'green' ? 'default' :
                              etiquetaDGT.info.color === 'yellow' ? 'secondary' :
                              'outline'
                            }
                            className={
                              etiquetaDGT.info.color === 'blue' ? 'bg-blue-500' :
                              etiquetaDGT.info.color === 'eco' ? 'bg-gradient-to-r from-green-500 to-blue-500' :
                              etiquetaDGT.info.color === 'green' ? 'bg-green-600' :
                              etiquetaDGT.info.color === 'yellow' ? 'bg-yellow-500 text-black' :
                              ''
                            }
                            data-testid="badge-etiqueta-dgt"
                          >
                            {etiquetaDGT.info.nombre}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {etiquetaDGT.info.descripcion}
                          </span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editingVehiculo && calcularEtiquetaMutation.mutate(editingVehiculo.id)}
                        disabled={
                          !form.watch("año") || 
                          !form.watch("combustible") || 
                          calcularEtiquetaMutation.isPending
                        }
                        data-testid="button-calcular-etiqueta-dgt"
                      >
                        {calcularEtiquetaMutation.isPending ? "Calculando..." : "Calcular Etiqueta"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

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
