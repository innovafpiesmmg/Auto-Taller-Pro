import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wallet, DollarSign, Edit, Trash2 } from "lucide-react";
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
import type { SelectCobro, SelectFactura } from "@shared/schema";
import { insertCobroSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

type FormValues = z.infer<typeof insertCobroSchema>;

export default function Cobros() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCobro, setEditingCobro] = useState<SelectCobro | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: cobros, isLoading } = useQuery<SelectCobro[]>({
    queryKey: ["/api/cobros"],
  });

  const { data: facturas } = useQuery<SelectFactura[]>({
    queryKey: ["/api/facturas"],
  });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  
  const cobrosHoy = cobros?.filter(c => {
    const fecha = c.fecha && new Date(c.fecha);
    return fecha && fecha >= startOfDay && fecha < startOfTomorrow;
  }) || [];
  
  const efectivoHoy = cobrosHoy.filter(c => c.metodoPago === 'efectivo').reduce((sum, c) => sum + parseFloat(c.importe.toString()), 0);
  const tarjetaHoy = cobrosHoy.filter(c => c.metodoPago === 'tarjeta').reduce((sum, c) => sum + parseFloat(c.importe.toString()), 0);
  const transferenciasHoy = cobrosHoy.filter(c => c.metodoPago === 'transferencia').reduce((sum, c) => sum + parseFloat(c.importe.toString()), 0);
  const totalCobradoHoy = cobrosHoy.reduce((sum, c) => sum + parseFloat(c.importe.toString()), 0);

  const form = useForm<FormValues>({
    resolver: zodResolver(insertCobroSchema),
    defaultValues: {
      facturaId: undefined,
      fecha: new Date(),
      importe: 0,
      metodoPago: "efectivo",
      referencia: "",
      notas: "",
    },
  });

  const handleOpenDialog = (cobro?: SelectCobro) => {
    if (cobro) {
      setEditingCobro(cobro);
      form.reset({
        facturaId: cobro.facturaId || undefined,
        fecha: cobro.fecha ? new Date(cobro.fecha) : new Date(),
        importe: parseFloat(cobro.importe.toString()),
        metodoPago: cobro.metodoPago,
        referencia: cobro.referencia || "",
        notas: cobro.notas || "",
      });
    } else {
      setEditingCobro(null);
      form.reset({
        facturaId: undefined,
        fecha: new Date(),
        importe: 0,
        metodoPago: "efectivo",
        referencia: "",
        notas: "",
      });
    }
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("/api/cobros", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cobros"] });
      toast({
        title: "Cobro registrado",
        description: "El cobro se ha registrado correctamente",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el cobro",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest(`/api/cobros/${editingCobro?.id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cobros"] });
      toast({
        title: "Cobro actualizado",
        description: "El cobro se ha actualizado correctamente",
      });
      setDialogOpen(false);
      setEditingCobro(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el cobro",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/cobros/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cobros"] });
      toast({
        title: "Cobro eliminado",
        description: "El cobro se ha eliminado correctamente",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el cobro",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (editingCobro) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cobros & Caja</h1>
          <p className="text-muted-foreground">Gestión de cobros y arqueo de caja</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-nuevo-cobro">
          <DollarSign className="h-4 w-4 mr-2" />
          Registrar Cobro
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectivo Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-efectivo-hoy">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${efectivoHoy.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              En caja
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarjeta Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-tarjeta-hoy">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${tarjetaHoy.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              TPV
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transferencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-transferencias-hoy">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${transferenciasHoy.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              Hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-cobrado-hoy">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${totalCobradoHoy.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              Hoy
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cobros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : !cobros || cobros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Wallet className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay cobros registrados</p>
                        <Button 
                          variant="link" 
                          className="mt-2" 
                          onClick={() => handleOpenDialog()}
                          data-testid="button-crear-primer-cobro"
                        >
                          Registrar el primer cobro
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  cobros.map((cobro) => {
                    const factura = facturas?.find(f => f.id === cobro.facturaId);
                    return (
                      <TableRow key={cobro.id} data-testid={`row-cobro-${cobro.id}`}>
                        <TableCell>
                          {cobro.fecha ? new Date(cobro.fecha).toLocaleDateString('es-ES') : '-'}
                        </TableCell>
                        <TableCell>{factura ? factura.numero : '-'}</TableCell>
                        <TableCell>{parseFloat(cobro.importe.toString()).toFixed(2)} €</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {cobro.metodoPago === 'efectivo' ? 'Efectivo' :
                             cobro.metodoPago === 'tarjeta' ? 'Tarjeta' :
                             cobro.metodoPago === 'transferencia' ? 'Transferencia' :
                             'Bizum'}
                          </Badge>
                        </TableCell>
                        <TableCell>{cobro.referencia || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenDialog(cobro)}
                              data-testid={`button-editar-${cobro.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setDeleteId(cobro.id)}
                              data-testid={`button-eliminar-${cobro.id}`}
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
        <DialogContent className="max-w-2xl" data-testid="dialog-cobro">
          <DialogHeader>
            <DialogTitle>{editingCobro ? "Editar Cobro" : "Nuevo Cobro"}</DialogTitle>
            <DialogDescription>
              {editingCobro ? "Modifica los datos del cobro" : "Completa el formulario para registrar un nuevo cobro"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="facturaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Factura (opcional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-factura">
                            <SelectValue placeholder="Sin factura asociada" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sin factura</SelectItem>
                          {facturas?.map((factura) => (
                            <SelectItem key={factura.id} value={factura.id.toString()}>
                              {factura.numero} - {parseFloat(factura.total.toString()).toFixed(2)} €
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="importe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Importe (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-importe"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metodoPago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-metodo-pago">
                            <SelectValue placeholder="Seleccionar método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="tarjeta">Tarjeta</SelectItem>
                          <SelectItem value="transferencia">Transferencia</SelectItem>
                          <SelectItem value="bizum">Bizum</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="referencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Número de transacción, recibo..."
                        {...field}
                        data-testid="input-referencia"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        data-testid="input-notas"
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
                  {editingCobro ? "Actualizar" : "Registrar"} Cobro
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
              Esta acción no se puede deshacer. Se eliminará el cobro permanentemente.
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
