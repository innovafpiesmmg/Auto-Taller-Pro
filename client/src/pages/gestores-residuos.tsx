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
import { Input } from "@/components/ui/input";
import { Truck, Plus, Search, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
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
import type { GestorResiduo } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

export default function GestoresResiduos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingGestor, setEditingGestor] = useState<GestorResiduo | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    razonSocial: "",
    nif: "",
    nima: "",
    direccion: "",
    telefono: "",
    email: "",
    autorizacionVigente: true,
    notas: "",
  });
  const { toast } = useToast();

  const { data: gestores, isLoading } = useQuery<GestorResiduo[]>({
    queryKey: ["/api/gestores-residuos"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingGestor) {
        return await apiRequest(`/api/gestores-residuos/${editingGestor.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      }
      return await apiRequest("/api/gestores-residuos", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gestores-residuos"] });
      setOpen(false);
      setEditingGestor(null);
      setFormData({
        razonSocial: "",
        nif: "",
        nima: "",
        direccion: "",
        telefono: "",
        email: "",
        autorizacionVigente: true,
        notas: "",
      });
      toast({ title: editingGestor ? "Gestor actualizado exitosamente" : "Gestor creado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: editingGestor ? "Error al actualizar gestor" : "Error al crear gestor",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/gestores-residuos/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gestores-residuos"] });
      setDeletingId(null);
      toast({ title: "Gestor eliminado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar gestor",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleEdit = (gestor: GestorResiduo) => {
    setEditingGestor(gestor);
    setFormData({
      razonSocial: gestor.razonSocial,
      nif: gestor.nif,
      nima: gestor.nima,
      direccion: gestor.direccion || "",
      telefono: gestor.telefono || "",
      email: gestor.email || "",
      autorizacionVigente: gestor.autorizacionVigente,
      notas: gestor.notas || "",
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingGestor(null);
    setFormData({
      razonSocial: "",
      nif: "",
      nima: "",
      direccion: "",
      telefono: "",
      email: "",
      autorizacionVigente: true,
      notas: "",
    });
  };

  const filteredGestores = gestores?.filter(gestor => {
    const matchesSearch = gestor.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gestor.nif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gestor.nima.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestores de Residuos</h1>
            <p className="text-sm text-muted-foreground">Gestión de empresas autorizadas para tratamiento de residuos</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          if (isOpen) setOpen(true);
          else handleCloseDialog();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-nuevo-gestor">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Gestor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGestor ? "Editar Gestor" : "Nuevo Gestor"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="razonSocial">Razón Social</Label>
                <Input
                  id="razonSocial"
                  data-testid="input-razon-social"
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                  placeholder="Nombre de la empresa"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nif">NIF</Label>
                  <Input
                    id="nif"
                    data-testid="input-nif"
                    value={formData.nif}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                    placeholder="B12345678"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nima">Número NIMA</Label>
                  <Input
                    id="nima"
                    data-testid="input-nima"
                    value={formData.nima}
                    onChange={(e) => setFormData({ ...formData, nima: e.target.value })}
                    placeholder="Número de inscripción NIMA"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  data-testid="input-direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Dirección completa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    data-testid="input-telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="922123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contacto@gestor.com"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autorizacionVigente"
                  data-testid="checkbox-autorizacion"
                  checked={formData.autorizacionVigente}
                  onCheckedChange={(checked) => setFormData({ ...formData, autorizacionVigente: checked as boolean })}
                />
                <Label htmlFor="autorizacionVigente" className="cursor-pointer">
                  Autorización vigente
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  data-testid="textarea-notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas adicionales (opcional)"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending ? "Guardando..." : editingGestor ? "Actualizar" : "Crear"}
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
            placeholder="Buscar por razón social, NIF o NIMA..."
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
              <TableHead>Razón Social</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead>NIMA</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredGestores && filteredGestores.length > 0 ? (
              filteredGestores.map((gestor) => (
                <TableRow key={gestor.id}>
                  <TableCell data-testid={`text-razon-${gestor.id}`} className="font-medium">{gestor.razonSocial}</TableCell>
                  <TableCell data-testid={`text-nif-${gestor.id}`} className="font-mono">{gestor.nif}</TableCell>
                  <TableCell data-testid={`text-nima-${gestor.id}`} className="font-mono">{gestor.nima}</TableCell>
                  <TableCell data-testid={`text-contacto-${gestor.id}`}>
                    <div className="text-sm">
                      {gestor.telefono && <div>{gestor.telefono}</div>}
                      {gestor.email && <div className="text-muted-foreground">{gestor.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {gestor.autorizacionVigente ? (
                      <Badge variant="default" data-testid={`badge-estado-${gestor.id}`}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Autorizado
                      </Badge>
                    ) : (
                      <Badge variant="destructive" data-testid={`badge-estado-${gestor.id}`}>
                        <XCircle className="h-3 w-3 mr-1" />
                        No Autorizado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(gestor)}
                        data-testid={`button-edit-${gestor.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(gestor.id)}
                        data-testid={`button-delete-${gestor.id}`}
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
                  No se encontraron gestores
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gestor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El gestor será eliminado permanentemente.
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
