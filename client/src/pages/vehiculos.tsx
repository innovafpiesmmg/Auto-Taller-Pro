import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Car, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { SelectVehiculo } from "@shared/schema";

export default function Vehiculos() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vehiculos, isLoading } = useQuery<SelectVehiculo[]>({
    queryKey: ["/api/vehiculos", searchTerm],
  });

  const filteredVehiculos = vehiculos?.filter(vehiculo => {
    const searchLower = searchTerm.toLowerCase();
    return (
      vehiculo.matricula.toLowerCase().includes(searchLower) ||
      (vehiculo.vin?.toLowerCase().includes(searchLower)) ||
      vehiculo.marca.toLowerCase().includes(searchLower) ||
      vehiculo.modelo.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehículos</h1>
          <p className="text-muted-foreground">Gestión de vehículos</p>
        </div>
        <Button data-testid="button-nuevo-vehiculo">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Vehículo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Vehículos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por matrícula, VIN, marca, modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-buscar-vehiculo"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Vehículos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Kilómetros</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredVehiculos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Car className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay vehículos registrados</p>
                        <Button variant="link" className="mt-2" data-testid="button-crear-primer-vehiculo">
                          Registrar el primer vehículo
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehiculos.map((vehiculo) => (
                    <TableRow key={vehiculo.id} data-testid={`row-vehiculo-${vehiculo.id}`}>
                      <TableCell className="font-medium" data-testid={`text-matricula-${vehiculo.id}`}>
                        {vehiculo.matricula}
                      </TableCell>
                      <TableCell data-testid={`text-marca-${vehiculo.id}`}>
                        {vehiculo.marca}
                      </TableCell>
                      <TableCell data-testid={`text-modelo-${vehiculo.id}`}>
                        {vehiculo.modelo}
                      </TableCell>
                      <TableCell data-testid={`text-cliente-${vehiculo.id}`}>
                        Cliente ID: {vehiculo.clienteId}
                      </TableCell>
                      <TableCell data-testid={`text-km-${vehiculo.id}`}>
                        {vehiculo.kilometrosActuales ? `${vehiculo.kilometrosActuales.toLocaleString()} km` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" data-testid={`button-ver-${vehiculo.id}`}>
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
