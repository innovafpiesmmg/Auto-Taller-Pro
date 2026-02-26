import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, User, Edit, Trash2, Download } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Cliente, InsertCliente } from "@shared/schema";
import { insertClienteSchema } from "@shared/schema";
import { z } from "zod";
import { PaginationControls } from "@/components/pagination-controls";
import { exportToCSV } from "@/lib/export-csv";

type FormValues = z.infer<typeof insertClienteSchema>;

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: clientes, isLoading } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filteredClientes = clientes?.filter(cliente => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cliente.nif.toLowerCase().includes(searchLower) ||
      cliente.nombre.toLowerCase().includes(searchLower) ||
      (cliente.apellidos?.toLowerCase().includes(searchLower)) ||
      (cliente.razonSocial?.toLowerCase().includes(searchLower)) ||
      (cliente.email?.toLowerCase().includes(searchLower)) ||
      (cliente.movil?.includes(searchTerm))
    );
  }) || [];

  const paginatedClientes = filteredClientes.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(insertClienteSchema),
    defaultValues: {
      tipo: "particular",
      nif: "",
      nombre: "",
      apellidos: "",
      razonSocial: "",
      email: "",
      movil: "",
      telefono: "",
      direccion: "",
      codigoPostal: "",
      ciudad: "",
      provincia: "",
      notas: "",
      rgpdConsentimiento: false,
    },
  });

  const tipoCliente = form.watch("tipo");

  const handleOpenDialog = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      form.reset({
        tipo: cliente.tipo,
        nif: cliente.nif,
        nombre: cliente.nombre,
        apellidos: cliente.apellidos || "",
        razonSocial: cliente.razonSocial || "",
        email: cliente.email || "",
        movil: cliente.movil || "",
        telefono: cliente.telefono || "",
        direccion: cliente.direccion || "",
        codigoPostal: cliente.codigoPostal || "",
        ciudad: cliente.ciudad || "",
        provincia: cliente.provincia || "",
        notas: cliente.notas || "",
        rgpdConsentimiento: cliente.rgpdConsentimiento || false,
      });
    } else {
      setEditingCliente(null);
      form.reset({
        tipo: "particular",
        nif: "",
        nombre: "",
        apellidos: "",
        razonSocial: "",
        email: "",
        movil: "",
        telefono: "",
        direccion: "",
        codigoPostal: "",
        ciudad: "",
        provincia: "",
        notas: "",
        rgpdConsentimiento: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCliente(null);
    form.reset();
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) =>
      await apiRequest("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      toast({
        title: "Cliente creado",
        description: "El cliente se ha creado correctamente",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear el cliente",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!editingCliente) throw new Error("No hay cliente seleccionado");
      return await apiRequest(`/api/clientes/${editingCliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      toast({
        title: "Cliente actualizado",
        description: "El cliente se ha actualizado correctamente",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el cliente",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      await apiRequest(`/api/clientes/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      toast({
        title: "Cliente eliminado",
        description: "El cliente se ha eliminado correctamente",
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el cliente",
      });
    },
  });

  const handleExportCSV = () => {
    const dataToExport = filteredClientes.map(c => ({
      id: c.id,
      tipo: c.tipo,
      nombre: c.tipo === 'empresa' ? c.razonSocial : c.nombre,
      nif: c.nif,
      email: c.email || '',
      telefono: c.movil || c.telefono || '',
      ciudad: c.ciudad || ''
    }));
    exportToCSV(dataToExport, "clientes.csv");
  };

  const onSubmit = (data: FormValues) => {
    if (editingCliente) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestión de clientes del taller</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} data-testid="button-exportar-clientes">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => handleOpenDialog()} data-testid="button-nuevo-cliente">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, NIF, teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-buscar-cliente"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIF</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <User className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay clientes registrados</p>
                        <Button 
                          variant="ghost" 
                          className="mt-2" 
                          onClick={() => handleOpenDialog()}
                          data-testid="button-crear-primer-cliente"
                        >
                          Crear el primer cliente
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClientes.map((cliente) => (
                    <TableRow key={cliente.id} data-testid={`row-cliente-${cliente.id}`}>
                      <TableCell className="font-medium" data-testid={`text-nif-${cliente.id}`}>
                        {cliente.nif}
                      </TableCell>
                      <TableCell data-testid={`text-nombre-${cliente.id}`}>
                        {cliente.tipo === 'empresa' ? cliente.razonSocial : `${cliente.nombre} ${cliente.apellidos || ''}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cliente.tipo === 'particular' ? 'secondary' : 'default'}>
                          {cliente.tipo === 'particular' ? 'Particular' : 'Empresa'}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-email-${cliente.id}`}>
                        {cliente.email || '-'}
                      </TableCell>
                      <TableCell data-testid={`text-telefono-${cliente.id}`}>
                        {cliente.movil || cliente.telefono || '-'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenDialog(cliente)}
                          data-testid={`button-editar-${cliente.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDeleteId(cliente.id)}
                          data-testid={`button-eliminar-${cliente.id}`}
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
            total={filteredClientes.length}
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
              {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {editingCliente
                ? "Modifica los datos del cliente"
                : "Completa los datos del nuevo cliente"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tipo">
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="particular">Particular</SelectItem>
                        <SelectItem value="empresa">Empresa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nif"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIF/CIF</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="12345678A" data-testid="input-nif" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {tipoCliente === "particular" ? (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="Juan" 
                        data-testid="input-nombre" 
                      />
                    </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apellidos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellidos</FormLabel>
                        <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""} 
                          placeholder="García Pérez" 
                          data-testid="input-apellidos" 
                        />
                      </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="razonSocial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón Social</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""} 
                          placeholder="Empresa S.L." 
                          data-testid="input-razon-social" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""} 
                          type="email" 
                          placeholder="cliente@ejemplo.com" 
                          data-testid="input-email" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="movil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Móvil</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""} 
                          placeholder="612345678" 
                          data-testid="input-movil" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono Fijo</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="928123456" 
                        data-testid="input-telefono" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="Calle Principal, 123" 
                        data-testid="input-direccion" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="codigoPostal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Postal</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="35001" 
                        data-testid="input-cp" 
                      />
                    </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ciudad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="Las Palmas" 
                        data-testid="input-ciudad" 
                      />
                    </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="provincia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="Las Palmas" 
                        data-testid="input-provincia" 
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
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="Observaciones adicionales" 
                        data-testid="input-notas" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rgpdConsentimiento"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-rgpd"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Consentimiento RGPD
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        El cliente acepta el tratamiento de sus datos personales
                      </p>
                    </div>
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
                  data-testid="button-guardar-cliente"
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
              Esta acción no se puede deshacer. El cliente será eliminado permanentemente.
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
