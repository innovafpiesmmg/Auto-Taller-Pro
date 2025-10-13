import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, User as UserIcon, Edit, Trash2, Shield } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

// Schema para crear (password requerido)
const createUserSchema = insertUserSchema;

// Schema para editar (password opcional)
const editUserSchema = insertUserSchema.extend({
  password: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof insertUserSchema>;

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const filteredUsers = users?.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.nombre.toLowerCase().includes(searchLower) ||
      (user.apellidos?.toLowerCase().includes(searchLower)) ||
      (user.email?.toLowerCase().includes(searchLower))
    );
  }) || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      nombre: "",
      apellidos: "",
      rol: "recepcion",
    },
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      form.reset({
        username: user.username,
        password: "", // No mostrar la contraseña
        email: user.email,
        nombre: user.nombre,
        apellidos: user.apellidos || "",
        rol: user.rol,
      });
    } else {
      setEditingUser(null);
      form.reset({
        username: "",
        password: "",
        email: "",
        nombre: "",
        apellidos: "",
        rol: "recepcion",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    form.reset();
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Validar que password esté presente al crear
      if (!data.password) {
        throw new Error("La contraseña es requerida");
      }
      return await apiRequest("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuario creado",
        description: "El usuario se ha creado correctamente",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Si no se proporciona contraseña, no la enviar
      const updateData: Partial<FormValues> = { ...data };
      if (!updateData.password) {
        delete (updateData as any).password;
      }
      return await apiRequest(`/api/users/${editingUser?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuario actualizado",
        description: "El usuario se ha actualizado correctamente",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      await apiRequest(`/api/users/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario se ha eliminado correctamente",
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
      });
      setDeleteId(null);
    },
  });

  const onSubmit = (data: FormValues) => {
    if (editingUser) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const getRolBadge = (rol: string) => {
    const colors = {
      admin: "bg-red-500",
      jefe_taller: "bg-blue-500",
      recepcion: "bg-green-500",
      mecanico: "bg-yellow-500",
      almacen: "bg-purple-500",
      finanzas: "bg-pink-500",
    };
    return colors[rol as keyof typeof colors] || "bg-gray-500";
  };

  const getRolLabel = (rol: string) => {
    const labels = {
      admin: "Administrador",
      jefe_taller: "Jefe de Taller",
      recepcion: "Recepción",
      mecanico: "Mecánico",
      almacen: "Almacén",
      finanzas: "Finanzas",
    };
    return labels[rol as keyof typeof labels] || rol;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
        </div>
        <Button data-testid="button-nuevo-usuario" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Usuarios del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                data-testid="input-buscar-usuario"
                placeholder="Buscar por nombre, usuario o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} data-testid={`row-usuario-${user.id}`}>
                        <TableCell className="font-medium" data-testid={`text-username-${user.id}`}>
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            {user.username}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-nombre-${user.id}`}>
                          {user.nombre} {user.apellidos}
                        </TableCell>
                        <TableCell data-testid={`text-email-${user.id}`}>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRolBadge(user.rol)} data-testid={`badge-rol-${user.id}`}>
                            {getRolLabel(user.rol)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.activo ? "default" : "secondary"}
                            data-testid={`badge-activo-${user.id}`}
                          >
                            {user.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              data-testid={`button-editar-${user.id}`}
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              data-testid={`button-eliminar-${user.id}`}
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteId(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Modifica los datos del usuario"
                : "Completa el formulario para crear un nuevo usuario"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de usuario</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-username"
                          placeholder="username"
                          {...field}
                          disabled={!!editingUser}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-email"
                          type="email"
                          placeholder="email@ejemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {editingUser ? "Contraseña (dejar vacío para mantener)" : "Contraseña"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-password"
                        type="password"
                        placeholder={editingUser ? "••••••••" : "Contraseña"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input data-testid="input-nombre" placeholder="Juan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apellidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellidos</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-apellidos"
                          placeholder="García Pérez"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select
                      data-testid="select-rol"
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin" data-testid="option-rol-admin">Administrador</SelectItem>
                        <SelectItem value="jefe_taller" data-testid="option-rol-jefe">Jefe de Taller</SelectItem>
                        <SelectItem value="recepcion" data-testid="option-rol-recepcion">Recepción</SelectItem>
                        <SelectItem value="mecanico" data-testid="option-rol-mecanico">Mecánico</SelectItem>
                        <SelectItem value="almacen" data-testid="option-rol-almacen">Almacén</SelectItem>
                        <SelectItem value="finanzas" data-testid="option-rol-finanzas">Finanzas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  data-testid="button-cancelar"
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancelar
                </Button>
                <Button
                  data-testid="button-guardar"
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingUser ? "Actualizar" : "Crear"} Usuario
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Eliminar */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-confirm-delete">
              ¿Estás seguro de eliminar este usuario?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirmar-delete"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
