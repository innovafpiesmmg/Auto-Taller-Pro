import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, PackageCheck, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Recepcion } from "@shared/schema";
import { format } from "date-fns";

export default function Recepciones() {
  const { data: recepciones, isLoading } = useQuery<Recepcion[]>({
    queryKey: ["/api/recepciones"],
  });

  const recepcionesData = recepciones || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recepciones de Almacén</h1>
          <p className="text-muted-foreground">Registro de mercancía recibida</p>
        </div>
        <Button data-testid="button-nueva-recepcion">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Recepción
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recepciones</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recepcionesData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recepcionesData.filter(r => {
                const fecha = new Date(r.fecha);
                const ahora = new Date();
                return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recepcionesData.filter(r => {
                const fecha = new Date(r.fecha);
                const hoy = new Date();
                return fecha.toDateString() === hoy.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Recepciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Albarán Proveedor</TableHead>
                  <TableHead>Recibido Por</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : recepcionesData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <PackageCheck className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay recepciones registradas</p>
                        <Button variant="ghost" className="mt-2" data-testid="button-crear-primera-recepcion">
                          Crear la primera recepción
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  recepcionesData.map((recepcion) => (
                    <TableRow key={recepcion.id} data-testid={`row-recepcion-${recepcion.id}`}>
                      <TableCell className="font-medium" data-testid={`text-numero-${recepcion.id}`}>
                        {recepcion.numero}
                      </TableCell>
                      <TableCell data-testid={`text-fecha-${recepcion.id}`}>
                        {format(new Date(recepcion.fecha), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell data-testid={`text-proveedor-${recepcion.id}`}>
                        Proveedor #{recepcion.proveedorId}
                      </TableCell>
                      <TableCell data-testid={`text-pedido-${recepcion.id}`}>
                        {recepcion.pedidoId ? `Pedido #${recepcion.pedidoId}` : '-'}
                      </TableCell>
                      <TableCell data-testid={`text-albaran-${recepcion.id}`}>
                        {recepcion.albaranProveedor || '-'}
                      </TableCell>
                      <TableCell data-testid={`text-recibido-por-${recepcion.id}`}>
                        {recepcion.recibidoPorId ? `Usuario #${recepcion.recibidoPorId}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" data-testid={`button-ver-${recepcion.id}`}>
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
