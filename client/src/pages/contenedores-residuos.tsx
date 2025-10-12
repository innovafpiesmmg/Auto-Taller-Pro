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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Package, Plus, Search, Pencil, Trash2 } from "lucide-react";
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
import type { ContenedorResiduo, CatalogoResiduo } from "@shared/schema";
import { insertContenedorResiduoSchema } from "@shared/schema";

const formSchema = insertContenedorResiduoSchema;

type FormValues = z.infer<typeof formSchema>;

export default function ContenedoresResiduos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingContenedor, setEditingContenedor] = useState<ContenedorResiduo | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: "",
      catalogoResiduoId: 0,
      ubicacion: "",
      capacidadMaxima: "0",
      estado: "disponible",
      observaciones: "",
    },
  });

  const { data: contenedores, isLoading } = useQuery<ContenedorResiduo[]>({
    queryKey: ["/api/contenedores-residuos"],
  });

  const { data: catalogos } = useQuery<CatalogoResiduo[]>({
    queryKey: ["/api/catalogo-residuos"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (editingContenedor) {
        return await apiRequest(`/api/contenedores-residuos/${editingContenedor.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      }
      return await apiRequest("/api/contenedores-residuos", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contenedores-residuos"] });
      setOpen(false);
      setEditingContenedor(null);
      form.reset();
      toast({ title: editingContenedor ? "Contenedor actualizado exitosamente" : "Contenedor creado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: editingContenedor ? "Error al actualizar contenedor" : "Error al crear contenedor",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/contenedores-residuos/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contenedores-residuos"] });
      setDeletingId(null);
      toast({ title: "Contenedor eliminado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar contenedor",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleEdit = (contenedor: ContenedorResiduo) => {
    setEditingContenedor(contenedor);
    form.setValue("codigo", contenedor.codigo);
    form.setValue("catalogoResiduoId", contenedor.catalogoResiduoId);
    form.setValue("ubicacion", contenedor.ubicacion);
    form.setValue("capacidadMaxima", contenedor.capacidadMaxima);
    form.setValue("estado", contenedor.estado);
    form.setValue("observaciones", contenedor.observaciones || "");
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingContenedor(null);
    form.reset();
  };

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  const filteredContenedores = contenedores?.filter(contenedor => {
    const matchesSearch = contenedor.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contenedor.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getEstadoBadge = (estado: string) => {
    const variants = {
      disponible: "default",
      en_uso: "secondary",
      lleno: "destructive",
      en_recogida: "outline",
    } as const;
    return variants[estado as keyof typeof variants] || "secondary";
  };

  const getEstadoLabel = (estado: string) => {
    const labels = {
      disponible: "Disponible",
      en_uso: "En Uso",
      lleno: "Lleno",
      en_recogida: "En Recogida",
    } as const;
    return labels[estado as keyof typeof labels] || estado;
  };

  const getCatalogoNombre = (catalogoId: number) => {
    const catalogo = catalogos?.find(c => c.id === catalogoId);
    return catalogo ? `${catalogo.codigoLER} - ${catalogo.descripcion}` : catalogoId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Contenedores de Residuos</h1>
            <p className="text-sm text-muted-foreground">Gestión de contenedores y almacenamiento</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          if (isOpen) setOpen(true);
          else handleCloseDialog();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-nuevo-contenedor">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contenedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContenedor ? "Editar Contenedor" : "Nuevo Contenedor"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-codigo"
                          placeholder="Ej: CONT-001"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="catalogoResiduoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Residuo</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-catalogo">
                            <SelectValue placeholder="Seleccionar tipo de residuo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {catalogos?.map((catalogo) => (
                            <SelectItem key={catalogo.id} value={catalogo.id.toString()}>
                              {catalogo.codigoLER} - {catalogo.descripcion}
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
                    name="capacidadMaxima"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidad Máxima</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-capacidad"
                            type="number"
                            step="0.01"
                            placeholder="100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ubicacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-ubicacion"
                            placeholder="Ej: Almacén A - Zona 3"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-estado">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="disponible">Disponible</SelectItem>
                          <SelectItem value="en_uso">En Uso</SelectItem>
                          <SelectItem value="lleno">Lleno</SelectItem>
                          <SelectItem value="en_recogida">En Recogida</SelectItem>
                        </SelectContent>
                      </Select>
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
                    {createMutation.isPending ? "Guardando..." : editingContenedor ? "Actualizar" : "Crear"}
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
            placeholder="Buscar por código o ubicación..."
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
              <TableHead>Código</TableHead>
              <TableHead>Tipo de Residuo</TableHead>
              <TableHead>Capacidad Máx.</TableHead>
              <TableHead>Cantidad Actual</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredContenedores && filteredContenedores.length > 0 ? (
              filteredContenedores.map((contenedor) => (
                <TableRow key={contenedor.id} data-testid={`row-contenedor-${contenedor.id}`}>
                  <TableCell data-testid={`text-codigo-${contenedor.id}`} className="font-mono">{contenedor.codigo}</TableCell>
                  <TableCell data-testid={`text-catalogo-${contenedor.id}`}>{getCatalogoNombre(contenedor.catalogoResiduoId)}</TableCell>
                  <TableCell data-testid={`text-capacidad-${contenedor.id}`}>{contenedor.capacidadMaxima}</TableCell>
                  <TableCell data-testid={`text-cantidad-actual-${contenedor.id}`}>{contenedor.cantidadActual}</TableCell>
                  <TableCell data-testid={`text-ubicacion-${contenedor.id}`}>{contenedor.ubicacion || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getEstadoBadge(contenedor.estado)} data-testid={`badge-estado-${contenedor.id}`}>
                      {getEstadoLabel(contenedor.estado)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(contenedor)}
                        data-testid={`button-edit-${contenedor.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(contenedor.id)}
                        data-testid={`button-delete-${contenedor.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No se encontraron contenedores
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contenedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El contenedor será eliminado permanentemente.
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
