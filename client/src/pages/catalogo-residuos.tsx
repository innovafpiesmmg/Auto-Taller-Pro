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
import { Recycle, Plus, Search, Pencil, Trash2 } from "lucide-react";
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
import type { CatalogoResiduo } from "@shared/schema";
import { insertCatalogoResiduoSchema } from "@shared/schema";

const formSchema = insertCatalogoResiduoSchema.extend({
  tiempoMaxAlmacenamiento: z.coerce.number().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CatalogoResiduos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingCatalogo, setEditingCatalogo] = useState<CatalogoResiduo | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigoLER: "",
      descripcion: "",
      clasificacion: "peligroso",
      estadoFisico: "solido",
      tiempoMaxAlmacenamiento: null,
      unidadMedida: "kg",
    },
  });

  const { data: catalogos, isLoading } = useQuery<CatalogoResiduo[]>({
    queryKey: ["/api/catalogo-residuos"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (editingCatalogo) {
        return await apiRequest(`/api/catalogo-residuos/${editingCatalogo.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      }
      return await apiRequest("/api/catalogo-residuos", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogo-residuos"] });
      setOpen(false);
      setEditingCatalogo(null);
      form.reset();
      toast({ title: editingCatalogo ? "Catálogo actualizado exitosamente" : "Catálogo creado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: editingCatalogo ? "Error al actualizar catálogo" : "Error al crear catálogo",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/catalogo-residuos/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogo-residuos"] });
      setDeletingId(null);
      toast({ title: "Catálogo eliminado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar catálogo",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleEdit = (catalogo: CatalogoResiduo) => {
    setEditingCatalogo(catalogo);
    form.setValue("codigoLER", catalogo.codigoLER);
    form.setValue("descripcion", catalogo.descripcion);
    form.setValue("clasificacion", catalogo.clasificacion);
    form.setValue("estadoFisico", catalogo.estadoFisico);
    form.setValue("tiempoMaxAlmacenamiento", catalogo.tiempoMaxAlmacenamiento);
    form.setValue("unidadMedida", catalogo.unidadMedida);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingCatalogo(null);
    form.reset();
  };

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  const filteredCatalogos = catalogos?.filter(catalogo => {
    const matchesSearch = catalogo.codigoLER.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catalogo.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getClasificacionBadge = (clasificacion: string) => {
    return clasificacion === "peligroso" ? "destructive" : "default";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Recycle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Catálogo de Residuos</h1>
            <p className="text-sm text-muted-foreground">Gestión del catálogo de residuos según LER</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          if (isOpen) setOpen(true);
          else handleCloseDialog();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-nuevo-residuo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Catálogo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCatalogo ? "Editar Catálogo" : "Nuevo Catálogo"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="codigoLER"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código LER</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-codigo-ler"
                          placeholder="Ej: 13 01 10*"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          data-testid="textarea-descripcion"
                          placeholder="Descripción del residuo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clasificacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clasificación</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-clasificacion">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="peligroso">Peligroso</SelectItem>
                            <SelectItem value="no_peligroso">No Peligroso</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estadoFisico"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Físico</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-estado-fisico">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="solido">Sólido</SelectItem>
                            <SelectItem value="liquido">Líquido</SelectItem>
                            <SelectItem value="pastoso">Pastoso</SelectItem>
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
                    name="tiempoMaxAlmacenamiento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiempo Máx. Almacenamiento (días)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-tiempo-almacenamiento"
                            type="number"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            placeholder="Días"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unidadMedida"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad de Medida</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-unidad-medida"
                            placeholder="kg, litros, etc."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending ? "Guardando..." : editingCatalogo ? "Actualizar" : "Crear"}
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
            placeholder="Buscar por código LER o descripción..."
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
              <TableHead>Código LER</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Clasificación</TableHead>
              <TableHead>Estado Físico</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredCatalogos && filteredCatalogos.length > 0 ? (
              filteredCatalogos.map((catalogo) => (
                <TableRow key={catalogo.id} data-testid={`row-catalogo-${catalogo.id}`}>
                  <TableCell data-testid={`text-codigo-${catalogo.id}`} className="font-mono">{catalogo.codigoLER}</TableCell>
                  <TableCell data-testid={`text-descripcion-${catalogo.id}`}>{catalogo.descripcion}</TableCell>
                  <TableCell>
                    <Badge variant={getClasificacionBadge(catalogo.clasificacion)} data-testid={`badge-clasificacion-${catalogo.id}`}>
                      {catalogo.clasificacion === "peligroso" ? "Peligroso" : "No Peligroso"}
                    </Badge>
                  </TableCell>
                  <TableCell data-testid={`text-estado-${catalogo.id}`} className="capitalize">{catalogo.estadoFisico}</TableCell>
                  <TableCell data-testid={`text-unidad-${catalogo.id}`}>{catalogo.unidadMedida}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(catalogo)}
                        data-testid={`button-edit-${catalogo.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(catalogo.id)}
                        data-testid={`button-delete-${catalogo.id}`}
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
                  No se encontraron catálogos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar catálogo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El catálogo será eliminado permanentemente.
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
