import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Receipt, Edit, Trash2, Printer, Search, Download } from "lucide-react";
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
import type { Factura, Cliente, LineaFactura, ConfigEmpresa } from "@shared/schema";
import { insertFacturaSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { FacturaPrint } from "@/components/factura-print";
import { PaginationControls } from "@/components/pagination-controls";
import { exportToCSV } from "@/lib/export-csv";

type FormValues = z.infer<typeof insertFacturaSchema>;

export default function Facturas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [printFactura, setPrintFactura] = useState<(Factura & { lineas?: LineaFactura[] }) | null>(null);
  const { toast } = useToast();

  const { data: facturas, isLoading } = useQuery<Factura[]>({
    queryKey: ["/api/facturas"],
  });

  const { data: clientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orId = params.get('orId');
    const clienteId = params.get('clienteId');

    if (orId && clienteId && facturas && clientes && !dialogOpen && !editingFactura) {
      const cliente = clientes.find(c => c.id === parseInt(clienteId));
      if (cliente) {
        const newNumero = `F-${Date.now().toString().slice(-6)}`;
        form.reset({
          numero: newNumero,
          serie: "F",
          tipo: "ordinaria",
          clienteId: parseInt(clienteId),
          fecha: new Date(),
          baseImponible: 0,
          totalIgic: 0,
          total: 0,
          observaciones: `Factura generada desde OR #${orId}`,
          orId: parseInt(orId)
        });
        setDialogOpen(true);
      }
    }
  }, [facturas, clientes]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filteredFacturas = facturas?.filter(factura => {
    const searchLower = searchTerm.toLowerCase();
    const cliente = clientes?.find(c => c.id === factura.clienteId);
    return (
      factura.numero.toLowerCase().includes(searchLower) ||
      factura.serie.toLowerCase().includes(searchLower) ||
      (cliente?.nombre.toLowerCase().includes(searchLower)) ||
      (cliente?.nif.toLowerCase().includes(searchLower))
    );
  }) || [];

  const paginatedFacturas = filteredFacturas.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const { data: empresa } = useQuery<ConfigEmpresa>({
    queryKey: ["/api/config/empresa"],
  });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  const totalHoy = facturas?.filter(f => {
    const fecha = f.fecha && new Date(f.fecha);
    return fecha && fecha >= startOfDay && fecha < startOfTomorrow;
  }).reduce((sum, f) => sum + parseFloat(f.total.toString()), 0) || 0;
  
  const totalMes = facturas?.filter(f => {
    const fecha = f.fecha && new Date(f.fecha);
    return fecha && fecha >= firstDayOfMonth && fecha < firstDayNextMonth;
  }).reduce((sum, f) => sum + parseFloat(f.total.toString()), 0) || 0;
  
  const igicMes = facturas?.filter(f => {
    const fecha = f.fecha && new Date(f.fecha);
    return fecha && fecha >= firstDayOfMonth && fecha < firstDayNextMonth;
  }).reduce((sum, f) => sum + parseFloat(f.totalIgic.toString()), 0) || 0;
  
  const numFacturasMes = facturas?.filter(f => {
    const fecha = f.fecha && new Date(f.fecha);
    return fecha && fecha >= firstDayOfMonth && fecha < firstDayNextMonth;
  }).length || 0;

  const form = useForm<any>({
    resolver: zodResolver(insertFacturaSchema.extend({
      clienteId: z.number().int().min(1, "Debe seleccionar un cliente"),
    })),
    defaultValues: {
      numero: "",
      serie: "F",
      tipo: "ordinaria",
      clienteId: undefined,
      fecha: new Date(),
      baseImponible: 0,
      totalIgic: 0,
      total: 0,
      observaciones: "",
    },
  });

  const handleOpenDialog = (factura?: Factura) => {
    if (factura) {
      setEditingFactura(factura);
      form.reset({
        numero: factura.numero,
        serie: factura.serie,
        tipo: factura.tipo,
        clienteId: factura.clienteId,
        fecha: factura.fecha ? new Date(factura.fecha) : new Date(),
        baseImponible: Number(factura.baseImponible),
        totalIgic: Number(factura.totalIgic),
        total: Number(factura.total),
        observaciones: factura.observaciones || "",
      });
    } else {
      setEditingFactura(null);
      const newNumero = `F-${Date.now().toString().slice(-6)}`;
      form.reset({
        numero: newNumero,
        serie: "F",
        tipo: "ordinaria",
        clienteId: undefined,
        fecha: new Date(),
        baseImponible: 0,
        totalIgic: 0,
        total: 0,
        observaciones: "",
      });
    }
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("/api/facturas", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facturas"] });
      toast({
        title: "Factura creada",
        description: "La factura se ha creado correctamente",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la factura",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest(`/api/facturas/${editingFactura?.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facturas"] });
      toast({
        title: "Factura actualizada",
        description: "La factura se ha actualizado correctamente",
      });
      setDialogOpen(false);
      setEditingFactura(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la factura",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/facturas/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facturas"] });
      toast({
        title: "Factura eliminada",
        description: "La factura se ha eliminado correctamente",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la factura",
        variant: "destructive",
      });
    },
  });

  const handleExportCSV = () => {
    const dataToExport = filteredFacturas.map(f => ({
      numero: f.numero,
      fecha: f.fecha ? format(new Date(f.fecha), 'yyyy-MM-dd') : '',
      concepto: f.observaciones || '',
      baseImponible: f.baseImponible,
      igicPct: 7, // Default IGIC
      totalIgic: f.totalIgic,
      total: f.total
    }));
    exportToCSV(dataToExport, "facturas.csv");
  };

  const onSubmit = (data: FormValues) => {
    if (editingFactura) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturación</h1>
          <p className="text-muted-foreground">Gestión de facturas con IGIC</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} data-testid="button-exportar-facturas">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => handleOpenDialog()} data-testid="button-nueva-factura">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-facturacion-hoy">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${totalHoy.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              Facturado hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-facturacion-mes">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${totalMes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IGIC Repercutido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-igic-repercutido">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${igicMes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Núm. Facturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-num-facturas-mes">
              {isLoading ? <Skeleton className="h-8 w-12" /> : numFacturasMes}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, serie, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-buscar-factura"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : !facturas || paginatedFacturas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Receipt className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay facturas emitidas</p>
                        <Button 
                          variant="ghost" 
                          className="mt-2 text-primary" 
                          onClick={() => handleOpenDialog()}
                          data-testid="button-crear-primera-factura"
                        >
                          Crear la primera factura
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedFacturas.map((factura) => {
                    const cliente = clientes?.find(c => c.id === factura.clienteId);
                    return (
                      <TableRow key={factura.id} data-testid={`row-factura-${factura.id}`}>
                        <TableCell className="font-medium">{factura.numero}</TableCell>
                        <TableCell>{factura.serie}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {factura.tipo === 'simplificada' ? 'Simplificada' :
                             factura.tipo === 'ordinaria' ? 'Ordinaria' :
                             'Rectificativa'}
                          </Badge>
                        </TableCell>
                        <TableCell>{cliente?.nombre || 'Cliente'}</TableCell>
                        <TableCell>
                          {factura.fecha ? new Date(factura.fecha).toLocaleDateString('es-ES') : '-'}
                        </TableCell>
                        <TableCell>{parseFloat(factura.total.toString()).toFixed(2)} €</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setPrintFactura(factura)}
                              data-testid={`button-imprimir-${factura.id}`}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenDialog(factura)}
                              data-testid={`button-editar-${factura.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setDeleteId(factura.id)}
                              data-testid={`button-eliminar-${factura.id}`}
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
          <PaginationControls
            total={filteredFacturas.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-factura">
          <DialogHeader>
            <DialogTitle>{editingFactura ? "Editar Factura" : "Nueva Factura"}</DialogTitle>
            <DialogDescription>
              {editingFactura ? "Modifica los datos de la factura" : "Completa el formulario para crear una nueva factura"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="F-001" {...field} data-testid="input-numero" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serie</FormLabel>
                      <FormControl>
                        <Input placeholder="F" {...field} data-testid="input-serie" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tipo">
                            <SelectValue placeholder="Tipo de factura" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="simplificada">Simplificada</SelectItem>
                          <SelectItem value="ordinaria">Ordinaria</SelectItem>
                          <SelectItem value="rectificativa">Rectificativa</SelectItem>
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
                        onValueChange={(value) => field.onChange(parseInt(value))}
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

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="baseImponible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Imponible (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-base-imponible"
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
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-igic"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-total"
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
                        placeholder="Observaciones adicionales"
                        {...field}
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
                  {editingFactura ? "Actualizar" : "Crear"} Factura
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
              Esta acción no se puede deshacer. Se eliminará la factura permanentemente.
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

      {printFactura && (
        <FacturaPrint
          open={!!printFactura}
          onOpenChange={(open) => !open && setPrintFactura(null)}
          factura={printFactura}
          cliente={clientes?.find(c => c.id === printFactura.clienteId)}
          empresa={empresa}
        />
      )}
    </div>
  );
}
