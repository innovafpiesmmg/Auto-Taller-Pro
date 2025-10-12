import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Package, AlertTriangle, Eye } from "lucide-react";
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
import type { SelectArticulo } from "@shared/schema";

export default function Articulos() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: articulos, isLoading } = useQuery<SelectArticulo[]>({
    queryKey: ["/api/articulos", searchTerm],
  });

  const filteredArticulos = articulos?.filter(articulo => {
    const searchLower = searchTerm.toLowerCase();
    return (
      articulo.referencia.toLowerCase().includes(searchLower) ||
      articulo.descripcion.toLowerCase().includes(searchLower) ||
      (articulo.categoria?.toLowerCase().includes(searchLower))
    );
  }) || [];

  const totalArticulos = articulos?.length || 0;
  const stockBajo = articulos?.filter(a => a.stock <= (a.stockMinimo || 0)).length || 0;
  const valorStock = articulos?.reduce((sum, a) => sum + (a.precioCoste * a.stock), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Artículos & Recambios</h1>
          <p className="text-muted-foreground">Catálogo y control de stock</p>
        </div>
        <Button data-testid="button-nuevo-articulo">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Artículo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Artículos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-articulos">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalArticulos}
            </div>
            <p className="text-xs text-muted-foreground">
              En catálogo
            </p>
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
            <p className="text-xs text-muted-foreground">
              Requieren reposición
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-valor-stock">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${valorStock.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              Valoración actual
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Artículos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Artículos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Precio Coste</TableHead>
                  <TableHead>Precio Venta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredArticulos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Package className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay artículos en el catálogo</p>
                        <Button variant="link" className="mt-2" data-testid="button-crear-primer-articulo">
                          Añadir el primer artículo
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArticulos.map((articulo) => (
                    <TableRow key={articulo.id} data-testid={`row-articulo-${articulo.id}`}>
                      <TableCell className="font-medium" data-testid={`text-referencia-${articulo.id}`}>
                        {articulo.referencia}
                      </TableCell>
                      <TableCell data-testid={`text-descripcion-${articulo.id}`}>
                        {articulo.descripcion}
                      </TableCell>
                      <TableCell>
                        {articulo.categoria ? (
                          <Badge variant="secondary">{articulo.categoria}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell data-testid={`text-stock-${articulo.id}`}>
                        <div className="flex items-center gap-2">
                          <span>{articulo.stock}</span>
                          {articulo.stock <= (articulo.stockMinimo || 0) && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-precio-coste-${articulo.id}`}>
                        {articulo.precioCoste.toFixed(2)} €
                      </TableCell>
                      <TableCell data-testid={`text-precio-venta-${articulo.id}`}>
                        {articulo.precioVenta.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" data-testid={`button-ver-${articulo.id}`}>
                          <Eye className="h-4 w-4" />
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
    </div>
  );
}
