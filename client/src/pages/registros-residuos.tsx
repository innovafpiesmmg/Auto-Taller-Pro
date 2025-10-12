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
import type { RegistroResiduo, ContenedorResiduo, OrdenReparacion } from "@shared/schema";
import { format } from "date-fns";

export default function RegistrosResiduos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<RegistroResiduo | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    orId: "",
    contenedorId: "",
    cantidad: "",
    fecha: new Date().toISOString().split('T')[0],
    observaciones: "",
  });
  const { toast } = useToast();

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
    mutationFn: async (data: any) => {
      if (editingRegistro) {
        return await apiRequest(`/api/registros-residuos/${editingRegistro.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...data,
            orId: parseInt(data.orId),
            contenedorId: parseInt(data.contenedorId),
            cantidad: parseFloat(data.cantidad),
            fecha: new Date(data.fecha).toISOString(),
          }),
        });
      }
      return await apiRequest("/api/registros-residuos", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          orId: parseInt(data.orId),
          contenedorId: parseInt(data.contenedorId),
          cantidad: parseFloat(data.cantidad),
          fecha: new Date(data.fecha).toISOString(),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registros-residuos"] });
      setOpen(false);
      setEditingRegistro(null);
      setFormData({
        orId: "",
        contenedorId: "",
        cantidad: "",
        fecha: new Date().toISOString().split('T')[0],
        observaciones: "",
      });
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
    setFormData({
      orId: registro.orId.toString(),
      contenedorId: registro.contenedorId.toString(),
      cantidad: registro.cantidad.toString(),
      fecha: new Date(registro.fecha).toISOString().split('T')[0],
      observaciones: registro.observaciones || "",
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingRegistro(null);
    setFormData({
      orId: "",
      contenedorId: "",
      cantidad: "",
      fecha: new Date().toISOString().split('T')[0],
      observaciones: "",
    });
  };

  const filteredRegistros = registros?.filter(registro => {
    const orden = ordenes?.find(o => o.id === registro.orId);
    const matchesSearch = orden?.numeroOrden?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getOrdenNumero = (ordenId: number) => {
    const orden = ordenes?.find(o => o.id === ordenId);
    return orden?.numeroOrden || `#${ordenId}`;
  };

  const getContenedorCodigo = (contenedorId: number) => {
    const contenedor = contenedores?.find(c => c.id === contenedorId);
    return contenedor?.codigo || contenedorId;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Registros de Residuos</h1>
            <p className="text-sm text-muted-foreground">Control de generación de residuos por orden de reparación</p>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orId">Orden de Reparación</Label>
                <Select
                  value={formData.orId}
                  onValueChange={(value) => setFormData({ ...formData, orId: value })}
                >
                  <SelectTrigger id="orId" data-testid="select-orden">
                    <SelectValue placeholder="Seleccionar orden" />
                  </SelectTrigger>
                  <SelectContent>
                    {ordenes?.map((orden) => (
                      <SelectItem key={orden.id} value={orden.id.toString()}>
                        {orden.numeroOrden} - {orden.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contenedorId">Contenedor</Label>
                <Select
                  value={formData.contenedorId}
                  onValueChange={(value) => setFormData({ ...formData, contenedorId: value })}
                >
                  <SelectTrigger id="contenedorId" data-testid="select-contenedor">
                    <SelectValue placeholder="Seleccionar contenedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {contenedores?.filter(c => c.estado === "disponible" || c.estado === "en_uso").map((contenedor) => (
                      <SelectItem key={contenedor.id} value={contenedor.id.toString()}>
                        {contenedor.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  data-testid="input-cantidad"
                  type="number"
                  step="0.01"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  placeholder="10.5"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha de Generación</Label>
                <Input
                  id="fecha"
                  data-testid="input-fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  data-testid="textarea-observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Notas adicionales (opcional)"
                />
              </div>

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
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search"
            placeholder="Buscar por número de orden..."
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
              <TableHead>Orden</TableHead>
              <TableHead>Contenedor</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Fecha Generación</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredRegistros && filteredRegistros.length > 0 ? (
              filteredRegistros.map((registro) => (
                <TableRow key={registro.id}>
                  <TableCell data-testid={`text-orden-${registro.id}`} className="font-medium">
                    {getOrdenNumero(registro.orId)}
                  </TableCell>
                  <TableCell data-testid={`text-contenedor-${registro.id}`}>
                    {getContenedorCodigo(registro.contenedorId)}
                  </TableCell>
                  <TableCell data-testid={`text-cantidad-${registro.id}`}>
                    {registro.cantidad}
                  </TableCell>
                  <TableCell data-testid={`text-fecha-${registro.id}`}>
                    {format(new Date(registro.fecha), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell data-testid={`text-observaciones-${registro.id}`} className="max-w-xs truncate">
                    {registro.observaciones || "-"}
                  </TableCell>
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
