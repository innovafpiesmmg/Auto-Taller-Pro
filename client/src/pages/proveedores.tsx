import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building, Eye } from "lucide-react";
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
import type { Proveedor } from "@shared/schema";

export default function Proveedores() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: proveedores, isLoading } = useQuery<Proveedor[]>({
    queryKey: ["/api/proveedores", searchTerm],
  });

  const filteredProveedores = proveedores?.filter(proveedor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      proveedor.codigo.toLowerCase().includes(searchLower) ||
      proveedor.nombre.toLowerCase().includes(searchLower) ||
      proveedor.nif.toLowerCase().includes(searchLower) ||
      (proveedor.email?.toLowerCase().includes(searchLower)) ||
      (proveedor.telefono?.includes(searchTerm))
    );
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proveedores</h1>
          <p className="text-muted-foreground">Gestión de proveedores del taller</p>
        </div>
        <Button data-testid="button-nuevo-proveedor">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Proveedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, nombre, NIF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-buscar-proveedor"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>NIF</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredProveedores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Building className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay proveedores registrados</p>
                        <Button variant="ghost" className="mt-2" data-testid="button-crear-primer-proveedor">
                          Crear el primer proveedor
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProveedores.map((proveedor) => (
                    <TableRow key={proveedor.id} data-testid={`row-proveedor-${proveedor.id}`}>
                      <TableCell className="font-medium" data-testid={`text-codigo-${proveedor.id}`}>
                        {proveedor.codigo}
                      </TableCell>
                      <TableCell data-testid={`text-nombre-${proveedor.id}`}>
                        {proveedor.nombre}
                      </TableCell>
                      <TableCell data-testid={`text-nif-${proveedor.id}`}>
                        {proveedor.nif}
                      </TableCell>
                      <TableCell data-testid={`text-email-${proveedor.id}`}>
                        {proveedor.email || '-'}
                      </TableCell>
                      <TableCell data-testid={`text-telefono-${proveedor.id}`}>
                        {proveedor.telefono || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={proveedor.activo ? 'default' : 'secondary'}>
                          {proveedor.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" data-testid={`button-ver-${proveedor.id}`}>
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
