import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Eye } from "lucide-react";
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
import type { Ubicacion } from "@shared/schema";

export default function Ubicaciones() {
  const { data: ubicaciones, isLoading } = useQuery<Ubicacion[]>({
    queryKey: ["/api/ubicaciones"],
  });

  const ubicacionesData = ubicaciones || [];
  const ubicacionesActivas = ubicacionesData.filter(u => u.activa).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ubicaciones de Almacén</h1>
          <p className="text-muted-foreground">Gestión de ubicaciones y zonas</p>
        </div>
        <Button data-testid="button-nueva-ubicacion">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Ubicación
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ubicaciones</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ubicacionesData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ubicacionesActivas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
                        <Button variant="ghost" className="mt-2" data-testid="button-crear-primera-ubicacion">
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
                        <Badge variant={ubicacion.activa ? 'default' : 'secondary'}>
                          {ubicacion.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" data-testid={`button-ver-${ubicacion.id}`}>
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
