import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ClipboardList, Plus, Search, Pencil, Trash2 } from "lucide-react";
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
import type { RegistroResiduo, ContenedorResiduo, OrdenReparacion } from "@shared/schema";
import { insertRegistroResiduoSchema } from "@shared/schema";
import { format } from "date-fns";

const formSchema = insertRegistroResiduoSchema.extend({
  fecha: z.coerce.date(),
  orId: z.number().optional(),
  contenedorId: z.number().min(1, "Debe seleccionar un contenedor"),
});

type FormValues = z.infer<typeof formSchema>;

export default function RegistrosResiduos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<RegistroResiduo | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orId: undefined,
      contenedorId: undefined,
      cantidad: "0",
      fecha: new Date(),
      observaciones: "",
    },
  });

  const { data: registros, isLoading } = useQuery<RegistroResiduo[]>({
    queryKey: ["/api/registros-residuos"],
  });

  const { data: contenedores } = useQuery<ContenedorResiduo[]>({
    queryKey: ["/api/contenedores-residuos"],
  });

  const { data: ordenes } = useQuery<OrdenReparacion[]>({
    queryKey: ["/api/ordenes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues & { catalogoResiduoId?: number }) => {
      const payload = {
        ...data,
        fecha: data.fecha.toISOString(),
      };
      if (editingRegistro) {
        return await apiRequest(`/api/registros-residuos/${editingRegistro.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }
      return await apiRequest("/api/registros-residuos", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registros-residuos"] });
      setOpen(false);
      setEditingRegistro(null);
      form.reset();
      toast({ title: editingRegistro ? "Registro actualizado exitosamente" : "Registro creado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: editingRegistro ? "Error al actualizar registro" : "Error al crear registro",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/registros-residuos/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registros-residuos"] });
      setDeletingId(null);
      toast({ title: "Registro eliminado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar registro",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleEdit = (registro: RegistroResiduo) => {
    setEditingRegistro(registro);
    form.setValue("orId", registro.orId ?? undefined);
    form.setValue("contenedorId", registro.contenedorId ?? undefined);
    form.setValue("cantidad", registro.cantidad);
    form.setValue("fecha", new Date(registro.fecha));
    form.setValue("observaciones", registro.observaciones || "");
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingRegistro(null);
    form.reset();
  };

  const onSubmit = (data: FormValues) => {
    const contenedor = contenedores?.find(c => c.id === data.contenedorId);
    if (!contenedor) {
      toast({
        title: "Error",
        description: "Contenedor no encontrado",
        variant: "destructive"
      });
      return;
    }
    
    createMutation.mutate({
      ...data,
      catalogoResiduoId: contenedor.catalogoResiduoId
    });
  };

  const filteredRegistros = registros?.filter(registro => {
    const orden = ordenes?.find(o => o.id === registro.orId);
    const codigo = orden?.codigo?.toLowerCase() ?? "";
    const matchesSearch = codigo.includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getOrdenCodigo = (orId: number | null) => {
    if (!orId) return "-";
    const orden = ordenes?.find(o => o.id === orId);
    return orden?.codigo || orId;
  };

  const getContenedorCodigo = (contenedorId: number | null) => {
    if (!contenedorId) return "-";
    const contenedor = contenedores?.find(c => c.id === contenedorId);
    return contenedor?.codigo || contenedorId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Registros de Residuos</h1>
            <p className="text-sm text-muted-foreground">Control de generación de residuos</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          if (isOpen) setOpen(true);
          else handleCloseDialog();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-nuevo-registro">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRegistro ? "Editar Registro" : "Nuevo Registro"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="orId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orden de Reparación</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-orden">
                            <SelectValue placeholder="Seleccionar orden" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ordenes?.map((orden) => (
                            <SelectItem key={orden.id} value={orden.id.toString()}>
                              {orden.codigo}
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
                  name="contenedorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenedor</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-contenedor">
                            <SelectValue placeholder="Seleccionar contenedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contenedores?.map((contenedor) => (
                            <SelectItem key={contenedor.id} value={contenedor.id.toString()}>
                              {contenedor.codigo}
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
                    name="cantidad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-cantidad"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                          />
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
                            data-testid="input-fecha"
                            type="date"
                            value={
                              field.value instanceof Date && !isNaN(field.value.getTime())
                                ? format(field.value, "yyyy-MM-dd")
                                : ""
                            }
                            onChange={(e) => {
                              const date = new Date(e.target.value);
                              if (!isNaN(date.getTime())) {
                                field.onChange(date);
                              }
                            }}
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
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-observaciones"
                          placeholder="Observaciones (opcional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending ? "Guardando..." : editingRegistro ? "Actualizar" : "Crear"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-buscar"
            placeholder="Buscar por código de orden..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>OR</TableHead>
              <TableHead>Contenedor</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredRegistros && filteredRegistros.length > 0 ? (
              filteredRegistros.map((registro) => (
                <TableRow key={registro.id} data-testid={`row-registro-${registro.id}`}>
                  <TableCell data-testid={`text-orden-${registro.id}`} className="font-mono">{getOrdenCodigo(registro.orId)}</TableCell>
                  <TableCell data-testid={`text-contenedor-${registro.id}`}>{getContenedorCodigo(registro.contenedorId)}</TableCell>
                  <TableCell data-testid={`text-cantidad-${registro.id}`}>{registro.cantidad}</TableCell>
                  <TableCell data-testid={`text-fecha-${registro.id}`}>{format(new Date(registro.fecha), "dd/MM/yyyy")}</TableCell>
                  <TableCell data-testid={`text-observaciones-${registro.id}`}>{registro.observaciones || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(registro)}
                        data-testid={`button-edit-${registro.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(registro.id)}
                        data-testid={`button-delete-${registro.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              data-testid="button-confirm-delete"
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
