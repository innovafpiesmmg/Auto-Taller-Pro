import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MapPin, Pencil } from "lucide-react";
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
  Dialog,
  DialogContent,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Ubicacion } from "@shared/schema";
import { insertUbicacionSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

const formSchema = insertUbicacionSchema.extend({
  activa: z.boolean().optional().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export default function Ubicaciones() {
  const [open, setOpen] = useState(false);
  const [editingUbicacion, setEditingUbicacion] = useState<Ubicacion | null>(null);
  const { toast } = useToast();

  const { data: ubicaciones, isLoading } = useQuery<Ubicacion[]>({
    queryKey: ["/api/ubicaciones"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      tipo: "",
      pasillo: "",
      estanteria: "",
      nivel: "",
      activa: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("/api/ubicaciones", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ubicaciones"] });
      toast({
        title: "Ubicación creada",
        description: "La ubicación se ha creado correctamente",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear la ubicación",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!editingUbicacion) throw new Error("No hay ubicación seleccionada");
      return await apiRequest(`/api/ubicaciones/${editingUbicacion.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ubicaciones"] });
      toast({
        title: "Ubicación actualizada",
        description: "La ubicación se ha actualizado correctamente",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la ubicación",
      });
    },
  });

  const handleEdit = (ubicacion: Ubicacion) => {
    setEditingUbicacion(ubicacion);
    form.reset({
      codigo: ubicacion.codigo,
      nombre: ubicacion.nombre,
      tipo: ubicacion.tipo || "",
      pasillo: ubicacion.pasillo || "",
      estanteria: ubicacion.estanteria || "",
      nivel: ubicacion.nivel || "",
      activa: ubicacion.activa ?? true,
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingUbicacion(null);
    form.reset();
  };

  const onSubmit = (data: FormValues) => {
    if (editingUbicacion) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const ubicacionesData = ubicaciones || [];
  const ubicacionesActivas = ubicacionesData.filter(u => u.activa).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ubicaciones de Almacén</h1>
          <p className="text-muted-foreground">Gestión de ubicaciones y zonas</p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="button-nueva-ubicacion">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Ubicación
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ubicaciones</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ubicacionesData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ubicacionesActivas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ubicacionesData.length - ubicacionesActivas}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Ubicaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Pasillo</TableHead>
                  <TableHead>Estantería</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : ubicacionesData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <MapPin className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay ubicaciones registradas</p>
                        <Button variant="ghost" className="mt-2" onClick={() => setOpen(true)} data-testid="button-crear-primera-ubicacion">
                          Crear la primera ubicación
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  ubicacionesData.map((ubicacion) => (
                    <TableRow key={ubicacion.id} data-testid={`row-ubicacion-${ubicacion.id}`}>
                      <TableCell className="font-medium" data-testid={`text-codigo-${ubicacion.id}`}>
                        {ubicacion.codigo}
                      </TableCell>
                      <TableCell data-testid={`text-nombre-${ubicacion.id}`}>
                        {ubicacion.nombre}
                      </TableCell>
                      <TableCell data-testid={`text-tipo-${ubicacion.id}`}>
                        {ubicacion.tipo || '-'}
                      </TableCell>
                      <TableCell data-testid={`text-pasillo-${ubicacion.id}`}>
                        {ubicacion.pasillo || '-'}
                      </TableCell>
                      <TableCell data-testid={`text-estanteria-${ubicacion.id}`}>
                        {ubicacion.estanteria || '-'}
                      </TableCell>
                      <TableCell data-testid={`text-nivel-${ubicacion.id}`}>
                        {ubicacion.nivel || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ubicacion.activa ? 'default' : 'secondary'} data-testid={`badge-estado-${ubicacion.id}`}>
                          {ubicacion.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(ubicacion)} data-testid={`button-editar-${ubicacion.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(open) => { if (open) setOpen(true); else handleCloseDialog(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUbicacion ? 'Editar Ubicación' : 'Nueva Ubicación'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código*</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-codigo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} data-testid="input-tipo" placeholder="Estantería, Palé, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre*</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-nombre" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="pasillo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pasillo</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} data-testid="input-pasillo" placeholder="A, B, C..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estanteria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estantería</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} data-testid="input-estanteria" placeholder="1, 2, 3..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nivel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} data-testid="input-nivel" placeholder="Superior, Medio, Inferior..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="activa"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ubicación Activa</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-activa"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog} data-testid="button-cancelar">
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-guardar">
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
