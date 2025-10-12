import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import type { CatalogoResiduo } from "@shared/schema";

export default function CatalogoResiduos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingCatalogo, setEditingCatalogo] = useState<CatalogoResiduo | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    codigoLER: "",
    descripcion: "",
    clasificacion: "peligroso" as "peligroso" | "no_peligroso",
    estadoFisico: "solido" as "solido" | "liquido" | "pastoso",
    tiempoMaxAlmacenamiento: "",
    unidadMedida: "kg",
  });
  const { toast } = useToast();

  const { data: catalogos, isLoading } = useQuery<CatalogoResiduo[]>({
    queryKey: ["/api/catalogo-residuos"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        tiempoMaxAlmacenamiento: data.tiempoMaxAlmacenamiento ? parseInt(data.tiempoMaxAlmacenamiento) : null,
      };
      if (editingCatalogo) {
        return await apiRequest(`/api/catalogo-residuos/${editingCatalogo.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }
      return await apiRequest("/api/catalogo-residuos", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogo-residuos"] });
      setOpen(false);
      setEditingCatalogo(null);
      setFormData({
        codigoLER: "",
        descripcion: "",
        clasificacion: "peligroso",
        estadoFisico: "solido",
        tiempoMaxAlmacenamiento: "",
        unidadMedida: "kg",
      });
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
    setFormData({
      codigoLER: catalogo.codigoLER,
      descripcion: catalogo.descripcion,
      clasificacion: catalogo.clasificacion,
      estadoFisico: catalogo.estadoFisico,
      tiempoMaxAlmacenamiento: catalogo.tiempoMaxAlmacenamiento?.toString() || "",
      unidadMedida: catalogo.unidadMedida,
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingCatalogo(null);
    setFormData({
      codigoLER: "",
      descripcion: "",
      clasificacion: "peligroso",
      estadoFisico: "solido",
      tiempoMaxAlmacenamiento: "",
      unidadMedida: "kg",
    });
  };

  const filteredCatalogos = catalogos?.filter(catalogo => {
    const matchesSearch = catalogo.codigoLER.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catalogo.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getClasificacionBadge = (clasificacion: string) => {
    return clasificacion === "peligroso" ? "destructive" : "default";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
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
            <Button data-testid="button-nuevo-catalogo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Catálogo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCatalogo ? "Editar Catálogo" : "Nuevo Catálogo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigoLER">Código LER</Label>
                <Input
                  id="codigoLER"
                  data-testid="input-codigo-ler"
                  value={formData.codigoLER}
                  onChange={(e) => setFormData({ ...formData, codigoLER: e.target.value })}
                  placeholder="Ej: 13 01 10*"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  data-testid="textarea-descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del residuo"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clasificacion">Clasificación</Label>
                  <Select
                    value={formData.clasificacion}
                    onValueChange={(value: "peligroso" | "no_peligroso") => setFormData({ ...formData, clasificacion: value })}
                  >
                    <SelectTrigger id="clasificacion" data-testid="select-clasificacion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peligroso">Peligroso</SelectItem>
                      <SelectItem value="no_peligroso">No Peligroso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estadoFisico">Estado Físico</Label>
                  <Select
                    value={formData.estadoFisico}
                    onValueChange={(value: "solido" | "liquido" | "pastoso") => setFormData({ ...formData, estadoFisico: value })}
                  >
                    <SelectTrigger id="estadoFisico" data-testid="select-estado-fisico">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solido">Sólido</SelectItem>
                      <SelectItem value="liquido">Líquido</SelectItem>
                      <SelectItem value="pastoso">Pastoso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tiempoMaxAlmacenamiento">Tiempo Máx. Almacenamiento (días)</Label>
                  <Input
                    id="tiempoMaxAlmacenamiento"
                    data-testid="input-tiempo-almacenamiento"
                    type="number"
                    value={formData.tiempoMaxAlmacenamiento}
                    onChange={(e) => setFormData({ ...formData, tiempoMaxAlmacenamiento: e.target.value })}
                    placeholder="Días"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidadMedida">Unidad de Medida</Label>
                  <Input
                    id="unidadMedida"
                    data-testid="input-unidad-medida"
                    value={formData.unidadMedida}
                    onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                    placeholder="kg, litros, etc."
                    required
                  />
                </div>
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
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search"
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
                <TableRow key={catalogo.id}>
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
