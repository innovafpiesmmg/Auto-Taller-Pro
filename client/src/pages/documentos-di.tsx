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
import { FileText, Plus, Search, Pencil, Trash2 } from "lucide-react";
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
import type { DocumentoDI, GestorResiduo } from "@shared/schema";
import { format } from "date-fns";

export default function DocumentosDI() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState<DocumentoDI | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    numero: "",
    gestorId: "",
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaRecogida: new Date().toISOString().split('T')[0],
    estado: "borrador" as "borrador" | "emitido" | "cerrado" | "anulado",
    transportistaRazonSocial: "",
    transportistaMatricula: "",
    observaciones: "",
  });
  const { toast } = useToast();

  const { data: documentos, isLoading } = useQuery<DocumentoDI[]>({
    queryKey: ["/api/documentos-di"],
  });

  const { data: gestores } = useQuery<GestorResiduo[]>({
    queryKey: ["/api/gestores-residuos"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingDocumento) {
        return await apiRequest(`/api/documentos-di/${editingDocumento.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...data,
            gestorId: parseInt(data.gestorId),
            fechaEmision: new Date(data.fechaEmision).toISOString(),
            fechaRecogida: new Date(data.fechaRecogida).toISOString(),
          }),
        });
      }
      return await apiRequest("/api/documentos-di", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          gestorId: parseInt(data.gestorId),
          fechaEmision: new Date(data.fechaEmision).toISOString(),
          fechaRecogida: new Date(data.fechaRecogida).toISOString(),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documentos-di"] });
      setOpen(false);
      setEditingDocumento(null);
      setFormData({
        numero: "",
        gestorId: "",
        fechaEmision: new Date().toISOString().split('T')[0],
        fechaRecogida: new Date().toISOString().split('T')[0],
        estado: "borrador",
        transportistaRazonSocial: "",
        transportistaMatricula: "",
        observaciones: "",
      });
      toast({ title: editingDocumento ? "Documento DI actualizado exitosamente" : "Documento DI creado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: editingDocumento ? "Error al actualizar documento DI" : "Error al crear documento DI",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/documentos-di/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documentos-di"] });
      setDeletingId(null);
      toast({ title: "Documento DI eliminado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar documento DI",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleEdit = (documento: DocumentoDI) => {
    setEditingDocumento(documento);
    setFormData({
      numero: documento.numero,
      gestorId: documento.gestorId.toString(),
      fechaEmision: new Date(documento.fechaEmision).toISOString().split('T')[0],
      fechaRecogida: new Date(documento.fechaRecogida).toISOString().split('T')[0],
      estado: documento.estado,
      transportistaRazonSocial: documento.transportistaRazonSocial || "",
      transportistaMatricula: documento.transportistaMatricula || "",
      observaciones: documento.observaciones || "",
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingDocumento(null);
    setFormData({
      numero: "",
      gestorId: "",
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaRecogida: new Date().toISOString().split('T')[0],
      estado: "borrador",
      transportistaRazonSocial: "",
      transportistaMatricula: "",
      observaciones: "",
    });
  };

  const filteredDocumentos = documentos?.filter(documento => {
    const matchesSearch = documento.numero.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getEstadoBadge = (estado: string) => {
    const variants = {
      borrador: "outline",
      emitido: "secondary",
      cerrado: "default",
      anulado: "destructive",
    } as const;
    return variants[estado as keyof typeof variants] || "secondary";
  };

  const getEstadoLabel = (estado: string) => {
    const labels = {
      borrador: "Borrador",
      emitido: "Emitido",
      cerrado: "Cerrado",
      anulado: "Anulado",
    } as const;
    return labels[estado as keyof typeof labels] || estado;
  };

  const getGestorNombre = (gestorId: number) => {
    const gestor = gestores?.find(g => g.id === gestorId);
    return gestor?.razonSocial || gestorId;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Documentos de Identificación (DI)</h1>
            <p className="text-sm text-muted-foreground">Gestión de documentos de traslado de residuos</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          if (isOpen) setOpen(true);
          else handleCloseDialog();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-nuevo-di">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Documento DI
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDocumento ? "Editar Documento DI" : "Nuevo Documento DI"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número DI</Label>
                <Input
                  id="numero"
                  data-testid="input-numero-di"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="DI-2025-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gestorId">Gestor Autorizado</Label>
                <Select
                  value={formData.gestorId}
                  onValueChange={(value) => setFormData({ ...formData, gestorId: value })}
                >
                  <SelectTrigger id="gestorId" data-testid="select-gestor">
                    <SelectValue placeholder="Seleccionar gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    {gestores?.filter(g => g.autorizacionVigente).map((gestor) => (
                      <SelectItem key={gestor.id} value={gestor.id.toString()}>
                        {gestor.razonSocial} - NIMA: {gestor.nima}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaEmision">Fecha de Emisión</Label>
                  <Input
                    id="fechaEmision"
                    data-testid="input-fecha-emision"
                    type="date"
                    value={formData.fechaEmision}
                    onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })}
                    required
                  />
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transportistaRazonSocial">Transportista</Label>
                  <Input
                    id="transportistaRazonSocial"
                    data-testid="input-transportista"
                    value={formData.transportistaRazonSocial}
                    onChange={(e) => setFormData({ ...formData, transportistaRazonSocial: e.target.value })}
                    placeholder="Nombre del transportista"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transportistaMatricula">Matrícula Transporte</Label>
                  <Input
                    id="transportistaMatricula"
                    data-testid="input-matricula"
                    value={formData.transportistaMatricula}
                    onChange={(e) => setFormData({ ...formData, transportistaMatricula: e.target.value })}
                    placeholder="1234-ABC"
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
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="emitido">Emitido</SelectItem>
                    <SelectItem value="cerrado">Cerrado</SelectItem>
                    <SelectItem value="anulado">Anulado</SelectItem>
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
                  placeholder="Notas adicionales (opcional)"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending ? "Guardando..." : editingDocumento ? "Actualizar" : "Crear"}
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
            placeholder="Buscar por número DI..."
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
              <TableHead>Número DI</TableHead>
              <TableHead>Gestor</TableHead>
              <TableHead>Fecha Emisión</TableHead>
              <TableHead>Fecha Recogida</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredDocumentos && filteredDocumentos.length > 0 ? (
              filteredDocumentos.map((documento) => (
                <TableRow key={documento.id}>
                  <TableCell data-testid={`text-numero-${documento.id}`} className="font-mono font-medium">
                    {documento.numero}
                  </TableCell>
                  <TableCell data-testid={`text-gestor-${documento.id}`}>
                    {getGestorNombre(documento.gestorId)}
                  </TableCell>
                  <TableCell data-testid={`text-fecha-emision-${documento.id}`}>
                    {format(new Date(documento.fechaEmision), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell data-testid={`text-fecha-recogida-${documento.id}`}>
                    {format(new Date(documento.fechaRecogida), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEstadoBadge(documento.estado)} data-testid={`badge-estado-${documento.id}`}>
                      {getEstadoLabel(documento.estado)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(documento)}
                        data-testid={`button-edit-${documento.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(documento.id)}
                        data-testid={`button-delete-${documento.id}`}
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
                  No se encontraron documentos DI
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento DI?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento DI será eliminado permanentemente.
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
