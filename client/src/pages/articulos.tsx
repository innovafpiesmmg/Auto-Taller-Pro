import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Package, AlertTriangle, Edit, Trash2, Download } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Articulo } from "@shared/schema";
import { insertArticuloSchema } from "@shared/schema";
import { z } from "zod";
import { PaginationControls } from "@/components/pagination-controls";
import { exportToCSV } from "@/lib/export-csv";

const fmtDecimal = (val: string | null | undefined) =>
  parseFloat(val || "0").toFixed(2);

const isLowStock = (a: Articulo) => (a.stock ?? 0) <= (a.stockMinimo ?? 0);

type FormValues = {
  referencia: string;
  descripcion: string;
  precioCoste: string;
  precioVenta: string;
  stock: number;
  stockMinimo: number;
  categoria?: string | null;
  marca?: string | null;
  igic?: string | null;
  activo?: boolean | null;
};

export default function Articulos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticulo, setEditingArticulo] = useState<Articulo | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: articulos, isLoading } = useQuery<Articulo[]>({
    queryKey: ["/api/articulos"],
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, showOnlyLowStock]);

  const filteredArticulos = articulos?.filter(articulo => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      articulo.referencia.toLowerCase().includes(searchLower) ||
      articulo.descripcion.toLowerCase().includes(searchLower) ||
      (articulo.categoria?.toLowerCase().includes(searchLower))
    );
    const matchesLowStock = showOnlyLowStock ? isLowStock(articulo) : true;
    return matchesSearch && matchesLowStock;
  }) || [];

  const paginatedArticulos = filteredArticulos.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalArticulos = articulos?.length || 0;
  const stockBajo = articulos?.filter(isLowStock).length || 0;
  const valorStock = articulos?.reduce(
    (sum, a) => sum + parseFloat(a.precioCoste || "0") * (a.stock ?? 0),
    0
  ) || 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(
      insertArticuloSchema.extend({
        precioCoste: z.string().default("0"),
        precioVenta: z.string().default("0"),
      })
    ),
    defaultValues: {
      referencia: "",
      descripcion: "",
      precioCoste: "0",
      precioVenta: "0",
      stock: 0,
      stockMinimo: 0,
      categoria: "",
    },
  });

  const handleOpenDialog = (articulo?: Articulo) => {
    if (articulo) {
      setEditingArticulo(articulo);
      form.reset({
        referencia: articulo.referencia,
        descripcion: articulo.descripcion,
        precioCoste: articulo.precioCoste ?? "0",
        precioVenta: articulo.precioVenta ?? "0",
        stock: articulo.stock ?? 0,
        stockMinimo: articulo.stockMinimo ?? 0,
        categoria: articulo.categoria || "",
      });
    } else {
      setEditingArticulo(null);
      form.reset({
        referencia: "",
        descripcion: "",
        precioCoste: "0",
        precioVenta: "0",
        stock: 0,
        stockMinimo: 0,
        categoria: "",
      });
    }
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("/api/articulos", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articulos"] });
      toast({
        title: "Artículo creado",
        description: "El artículo se ha creado correctamente",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el artículo",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest(`/api/articulos/${editingArticulo?.id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articulos"] });
      toast({
        title: "Artículo actualizado",
        description: "El artículo se ha actualizado correctamente",
      });
      setDialogOpen(false);
      setEditingArticulo(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el artículo",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/articulos/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articulos"] });
      toast({
        title: "Artículo eliminado",
        description: "El artículo se ha eliminado correctamente",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el artículo",
        variant: "destructive",
      });
    },
  });

  const handleExportCSV = () => {
    const dataToExport = filteredArticulos.map(a => ({
      referencia: a.referencia,
      descripcion: a.descripcion,
      categoria: a.categoria || '',
      precioCoste: a.precioCoste,
      precioVenta: a.precioVenta,
      stock: a.stock ?? 0,
      stockMinimo: a.stockMinimo ?? 0
    }));
    exportToCSV(dataToExport, "articulos.csv");
  };

  const onSubmit = (data: FormValues) => {
    if (editingArticulo) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Artículos & Recambios</h1>
          <p className="text-muted-foreground">Catálogo y control de stock</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} data-testid="button-exportar-articulos">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => handleOpenDialog()} data-testid="button-nuevo-articulo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Artículo
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Artículos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-articulos">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalArticulos}
            </div>
            <p className="text-xs text-muted-foreground">En catálogo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500" data-testid="text-stock-bajo">
              {isLoading ? <Skeleton className="h-8 w-16" /> : stockBajo}
            </div>
            <p className="text-xs text-muted-foreground">Requieren reposición</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-valor-stock">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${valorStock.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">Valoración actual</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Artículos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por referencia, descripción, marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-buscar-articulo"
              />
            </div>
            <Button
              variant={showOnlyLowStock ? "default" : "outline"}
              onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
              className="flex items-center gap-2 shrink-0"
              data-testid="button-filtro-stock-bajo"
            >
              <AlertTriangle className="h-4 w-4" />
              Solo stock bajo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Artículos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="hidden sm:table-cell">P. Coste</TableHead>
                  <TableHead>P. Venta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedArticulos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Package className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay artículos en el catálogo</p>
                        <Button
                          variant="ghost"
                          className="mt-2"
                          onClick={() => handleOpenDialog()}
                          data-testid="button-crear-primer-articulo"
                        >
                          Añadir el primer artículo
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedArticulos.map((articulo) => (
                    <TableRow key={articulo.id} data-testid={`row-articulo-${articulo.id}`}>
                      <TableCell className="font-medium" data-testid={`text-referencia-${articulo.id}`}>
                        <div className="flex flex-col gap-1">
                          {articulo.referencia}
                          {isLowStock(articulo) && (
                            <Badge variant="destructive" className="w-fit text-[10px] px-1 h-4">
                              Stock Bajo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-descripcion-${articulo.id}`}>
                        {articulo.descripcion}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {articulo.categoria ? (
                          <Badge variant="secondary">{articulo.categoria}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell data-testid={`text-stock-${articulo.id}`}>
                        <div className="flex items-center gap-2">
                          <span className={isLowStock(articulo) ? "text-amber-600 dark:text-amber-500 font-medium" : ""}>
                            {articulo.stock ?? 0}
                          </span>
                          {isLowStock(articulo) && (
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell" data-testid={`text-precio-coste-${articulo.id}`}>
                        {fmtDecimal(articulo.precioCoste)} €
                      </TableCell>
                      <TableCell data-testid={`text-precio-venta-${articulo.id}`}>
                        {fmtDecimal(articulo.precioVenta)} €
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(articulo)}
                            data-testid={`button-editar-${articulo.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(articulo.id)}
                            data-testid={`button-eliminar-${articulo.id}`}
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
          <PaginationControls
            total={filteredArticulos.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-articulo">
          <DialogHeader>
            <DialogTitle>{editingArticulo ? "Editar Artículo" : "Nuevo Artículo"}</DialogTitle>
            <DialogDescription>
              {editingArticulo ? "Modifica los datos del artículo" : "Completa el formulario para crear un nuevo artículo"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="referencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referencia</FormLabel>
                      <FormControl>
                        <Input placeholder="REF-001" {...field} data-testid="input-referencia" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Filtros, Aceites..." {...field} value={field.value ?? ""} data-testid="input-categoria" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control as any}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input placeholder="Descripción del artículo" {...field} data-testid="input-descripcion" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="precioCoste"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Coste (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-precio-coste"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="precioVenta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Venta (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-precio-venta"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Actual</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-stock"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="stockMinimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mínimo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-stock-minimo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancelar"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-guardar"
                >
                  {editingArticulo ? "Actualizar" : "Crear"} Artículo
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent data-testid="dialog-confirmar-eliminar">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el artículo permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-eliminar">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirmar-eliminar"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
