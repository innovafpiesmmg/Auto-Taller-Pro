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
import { TruckIcon, Plus, Search, Pencil, Trash2 } from "lucide-react";
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
import type { RecogidaResiduo, DocumentoDI, ContenedorResiduo } from "@shared/schema";
import { format } from "date-fns";

export default function RecogidasResiduos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingRecogida, setEditingRecogida] = useState<RecogidaResiduo | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    documentoDIId: "",
    contenedorId: "",
    fechaRecogida: new Date().toISOString().split('T')[0],
    cantidadRecogida: "",
    observaciones: "",
  });
  const { toast } = useToast();

  const { data: recogidas, isLoading } = useQuery<RecogidaResiduo[]>({
    queryKey: ["/api/recogidas-residuos"],
  });

  const { data: documentosDI } = useQuery<DocumentoDI[]>({
    queryKey: ["/api/documentos-di"],
  });

  const { data: contenedores } = useQuery<ContenedorResiduo[]>({
    queryKey: ["/api/contenedores-residuos"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingRecogida) {
        return await apiRequest(`/api/recogidas-residuos/${editingRecogida.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...data,
            documentoDIId: parseInt(data.documentoDIId),
            contenedorId: parseInt(data.contenedorId),
            cantidadRecogida: parseFloat(data.cantidadRecogida),
            fechaRecogida: new Date(data.fechaRecogida).toISOString(),
          }),
        });
      }
      return await apiRequest("/api/recogidas-residuos", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          documentoDIId: parseInt(data.documentoDIId),
          contenedorId: parseInt(data.contenedorId),
          cantidadRecogida: parseFloat(data.cantidadRecogida),
          fechaRecogida: new Date(data.fechaRecogida).toISOString(),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recogidas-residuos"] });
      setOpen(false);
      setEditingRecogida(null);
      setFormData({
        documentoDIId: "",
        contenedorId: "",
        fechaRecogida: new Date().toISOString().split('T')[0],
        cantidadRecogida: "",
        observaciones: "",
      });
      toast({ title: editingRecogida ? "Recogida actualizada exitosamente" : "Recogida creada exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: editingRecogida ? "Error al actualizar recogida" : "Error al crear recogida",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/recogidas-residuos/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recogidas-residuos"] });
      setDeletingId(null);
      toast({ title: "Recogida eliminada exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar recogida",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleEdit = (recogida: RecogidaResiduo) => {
    setEditingRecogida(recogida);
    setFormData({
      documentoDIId: recogida.documentoDIId?.toString() || "",
      contenedorId: recogida.contenedorId.toString(),
      fechaRecogida: new Date(recogida.fechaRecogida).toISOString().split('T')[0],
      cantidadRecogida: recogida.cantidadRecogida.toString(),
      observaciones: recogida.observaciones || "",
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingRecogida(null);
    setFormData({
      documentoDIId: "",
      contenedorId: "",
      fechaRecogida: new Date().toISOString().split('T')[0],
      cantidadRecogida: "",
      observaciones: "",
    });
  };

  const filteredRecogidas = recogidas?.filter(recogida => {
    const documento = documentosDI?.find(d => d.id === recogida.documentoDIId);
    const matchesSearch = documento?.numero.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getDocumentoNumero = (documentoId: number | null) => {
    if (!documentoId) return "-";
    const documento = documentosDI?.find(d => d.id === documentoId);
    return documento?.numero || `#${documentoId}`;
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
          <TruckIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Recogidas de Residuos</h1>
            <p className="text-sm text-muted-foreground">Control de recogida y traslado de residuos</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          if (isOpen) setOpen(true);
          else handleCloseDialog();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-nueva-recogida">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Recogida
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRecogida ? "Editar Recogida" : "Nueva Recogida"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentoDIId">Documento DI</Label>
                <Select
                  value={formData.documentoDIId}
                  onValueChange={(value) => setFormData({ ...formData, documentoDIId: value })}
                >
                  <SelectTrigger id="documentoDIId" data-testid="select-documento">
                    <SelectValue placeholder="Seleccionar documento DI" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentosDI?.map((documento) => (
                      <SelectItem key={documento.id} value={documento.id.toString()}>
                        {documento.numero} - {format(new Date(documento.fechaRecogida), "dd/MM/yyyy")}
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
                    {contenedores?.map((contenedor) => (
                      <SelectItem key={contenedor.id} value={contenedor.id.toString()}>
                        {contenedor.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaRecogida">Fecha de Recogida</Label>
                  <Input
                    id="fechaRecogida"
                    data-testid="input-fecha-recogida"
                    type="date"
                    value={formData.fechaRecogida}
                    onChange={(e) => setFormData({ ...formData, fechaRecogida: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cantidadRecogida">Cantidad Recogida</Label>
                  <Input
                    id="cantidadRecogida"
                    data-testid="input-cantidad"
                    type="number"
                    step="0.01"
                    value={formData.cantidadRecogida}
                    onChange={(e) => setFormData({ ...formData, cantidadRecogida: e.target.value })}
                    placeholder="100.5"
                    required
                  />
                </div>
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
                  {createMutation.isPending ? "Guardando..." : editingRecogida ? "Actualizar" : "Crear"}
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
            placeholder="Buscar por documento DI..."
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
              <TableHead>Documento DI</TableHead>
              <TableHead>Contenedor</TableHead>
              <TableHead>Fecha Recogida</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredRecogidas && filteredRecogidas.length > 0 ? (
              filteredRecogidas.map((recogida) => (
                <TableRow key={recogida.id}>
                  <TableCell data-testid={`text-documento-${recogida.id}`} className="font-mono">
                    {getDocumentoNumero(recogida.documentoDIId)}
                  </TableCell>
                  <TableCell data-testid={`text-contenedor-${recogida.id}`}>
                    {getContenedorCodigo(recogida.contenedorId)}
                  </TableCell>
                  <TableCell data-testid={`text-fecha-${recogida.id}`}>
                    {format(new Date(recogida.fechaRecogida), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell data-testid={`text-cantidad-${recogida.id}`}>
                    {recogida.cantidadRecogida}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(recogida)}
                        data-testid={`button-edit-${recogida.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(recogida.id)}
                        data-testid={`button-delete-${recogida.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No se encontraron recogidas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar recogida?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La recogida será eliminada permanentemente.
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
