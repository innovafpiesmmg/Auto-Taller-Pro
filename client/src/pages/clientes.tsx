import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, User, Eye } from "lucide-react";
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
import type { SelectCliente } from "@shared/schema";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clientes, isLoading } = useQuery<SelectCliente[]>({
    queryKey: ["/api/clientes", searchTerm],
  });

  const filteredClientes = clientes?.filter(cliente => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cliente.nif.toLowerCase().includes(searchLower) ||
      cliente.nombre.toLowerCase().includes(searchLower) ||
      (cliente.apellidos?.toLowerCase().includes(searchLower)) ||
      (cliente.razonSocial?.toLowerCase().includes(searchLower)) ||
      (cliente.email?.toLowerCase().includes(searchLower)) ||
      (cliente.movil?.includes(searchTerm))
    );
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestión de clientes del taller</p>
        </div>
        <Button data-testid="button-nuevo-cliente">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, NIF, teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-buscar-cliente"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIF</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <User className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay clientes registrados</p>
                        <Button variant="link" className="mt-2" data-testid="button-crear-primer-cliente">
                          Crear el primer cliente
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id} data-testid={`row-cliente-${cliente.id}`}>
                      <TableCell className="font-medium" data-testid={`text-nif-${cliente.id}`}>
                        {cliente.nif}
                      </TableCell>
                      <TableCell data-testid={`text-nombre-${cliente.id}`}>
                        {cliente.tipo === 'empresa' ? cliente.razonSocial : `${cliente.nombre} ${cliente.apellidos || ''}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cliente.tipo === 'particular' ? 'secondary' : 'default'}>
                          {cliente.tipo === 'particular' ? 'Particular' : 'Empresa'}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-email-${cliente.id}`}>
                        {cliente.email || '-'}
                      </TableCell>
                      <TableCell data-testid={`text-telefono-${cliente.id}`}>
                        {cliente.movil || cliente.telefono || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" data-testid={`button-ver-${cliente.id}`}>
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
