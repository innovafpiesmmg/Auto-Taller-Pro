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
import type { ContenedorResiduo, CatalogoResiduo } from "@shared/schema";

export default function ContenedoresResiduos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingContenedor, setEditingContenedor] = useState<ContenedorResiduo | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    catalogoResiduoId: "",
    capacidadMaxima: "",
    ubicacion: "",
    estado: "disponible" as "disponible" | "en_uso" | "lleno" | "en_recogida",
    observaciones: "",
  });
  const { toast } = useToast();

  const { data: contenedores, isLoading } = useQuery<ContenedorResiduo[]>({
    queryKey: ["/api/contenedores-residuos"],
  });

  const { data: catalogos } = useQuery<CatalogoResiduo[]>({
    queryKey: ["/api/catalogo-residuos"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingContenedor) {
        return await apiRequest(`/api/contenedores-residuos/${editingContenedor.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...data,
            catalogoResiduoId: parseInt(data.catalogoResiduoId),
            capacidadMaxima: parseFloat(data.capacidadMaxima),
          }),
        });
      }
      return await apiRequest("/api/contenedores-residuos", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          catalogoResiduoId: parseInt(data.catalogoResiduoId),
          capacidadMaxima: parseFloat(data.capacidadMaxima),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contenedores-residuos"] });
      setOpen(false);
      setEditingContenedor(null);
      setFormData({
        codigo: "",
        catalogoResiduoId: "",
        capacidadMaxima: "",
        ubicacion: "",
        estado: "disponible",
        observaciones: "",
      });
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
    setFormData({
      codigo: contenedor.codigo,
      catalogoResiduoId: contenedor.catalogoResiduoId.toString(),
      capacidadMaxima: contenedor.capacidadMaxima.toString(),
      ubicacion: contenedor.ubicacion || "",
      estado: contenedor.estado,
      observaciones: contenedor.observaciones || "",
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingContenedor(null);
    setFormData({
      codigo: "",
      catalogoResiduoId: "",
      capacidadMaxima: "",
      ubicacion: "",
      estado: "disponible",
      observaciones: "",
    });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  data-testid="input-codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ej: CONT-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="catalogoResiduoId">Tipo de Residuo</Label>
                <Select
                  value={formData.catalogoResiduoId}
                  onValueChange={(value) => setFormData({ ...formData, catalogoResiduoId: value })}
                >
                  <SelectTrigger id="catalogoResiduoId" data-testid="select-catalogo">
                    <SelectValue placeholder="Seleccionar tipo de residuo" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogos?.map((catalogo) => (
                      <SelectItem key={catalogo.id} value={catalogo.id.toString()}>
                        {catalogo.codigoLER} - {catalogo.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacidadMaxima">Capacidad Máxima</Label>
                  <Input
                    id="capacidadMaxima"
                    data-testid="input-capacidad"
                    type="number"
                    step="0.01"
                    value={formData.capacidadMaxima}
                    onChange={(e) => setFormData({ ...formData, capacidadMaxima: e.target.value })}
                    placeholder="100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    data-testid="input-ubicacion"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    placeholder="Ej: Almacén A - Zona 3"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: any) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger id="estado" data-testid="select-estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="en_uso">En Uso</SelectItem>
                    <SelectItem value="lleno">Lleno</SelectItem>
                    <SelectItem value="en_recogida">En Recogida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  data-testid="textarea-observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Observaciones (opcional)"
                />
              </div>

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
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search"
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
                <TableRow key={contenedor.id}>
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
