import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, Eye } from "lucide-react";
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
import type { SelectFactura } from "@shared/schema";

export default function Facturas() {
  const { data: facturas, isLoading } = useQuery<SelectFactura[]>({
    queryKey: ["/api/facturas"],
  });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  const totalHoy = facturas?.filter(f => {
    const fecha = f.fecha && new Date(f.fecha);
    return fecha && fecha >= startOfDay && fecha < startOfTomorrow;
  }).reduce((sum, f) => sum + f.total, 0) || 0;
  
  const totalMes = facturas?.filter(f => {
    const fecha = f.fecha && new Date(f.fecha);
    return fecha && fecha >= firstDayOfMonth && fecha < firstDayNextMonth;
  }).reduce((sum, f) => sum + f.total, 0) || 0;
  
  const igicMes = facturas?.filter(f => {
    const fecha = f.fecha && new Date(f.fecha);
    return fecha && fecha >= firstDayOfMonth && fecha < firstDayNextMonth;
  }).reduce((sum, f) => sum + f.igic, 0) || 0;
  
  const numFacturasMes = facturas?.filter(f => {
    const fecha = f.fecha && new Date(f.fecha);
    return fecha && fecha >= firstDayOfMonth && fecha < firstDayNextMonth;
  }).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturación</h1>
          <p className="text-muted-foreground">Gestión de facturas con IGIC</p>
        </div>
        <Button data-testid="button-nueva-factura">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Factura
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-facturacion-hoy">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${totalHoy.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              Facturado hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-facturacion-mes">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${totalMes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IGIC Repercutido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-igic-repercutido">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${igicMes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-num-facturas-mes">
              {isLoading ? <Skeleton className="h-8 w-12" /> : numFacturasMes}
            </div>
            <p className="text-xs text-muted-foreground">
              Emitidas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facturas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>IGIC</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : !facturas || facturas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Receipt className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay facturas emitidas</p>
                        <Button variant="link" className="mt-2" data-testid="button-crear-primera-factura">
                          Crear la primera factura
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  facturas.map((factura) => (
                    <TableRow key={factura.id} data-testid={`row-factura-${factura.id}`}>
                      <TableCell className="font-medium">{factura.numero}</TableCell>
                      <TableCell>
                        <Badge variant={factura.tipo === 'simplificada' ? 'secondary' : 'default'}>
                          {factura.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{factura.clienteNombre || '-'}</TableCell>
                      <TableCell>
                        {factura.fecha ? new Date(factura.fecha).toLocaleDateString('es-ES') : '-'}
                      </TableCell>
                      <TableCell>{factura.base.toFixed(2)} €</TableCell>
                      <TableCell>{factura.igic.toFixed(2)} €</TableCell>
                      <TableCell className="font-medium">{factura.total.toFixed(2)} €</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" data-testid={`button-ver-${factura.id}`}>
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
