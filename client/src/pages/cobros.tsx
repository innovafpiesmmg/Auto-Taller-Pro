import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, DollarSign, Eye } from "lucide-react";
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
import type { SelectCobro } from "@shared/schema";

export default function Cobros() {
  const { data: cobros, isLoading } = useQuery<SelectCobro[]>({
    queryKey: ["/api/cobros"],
  });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const cobrosHoy = cobros?.filter(c => 
    c.fecha && new Date(c.fecha) >= startOfDay
  ) || [];
  
  const efectivoHoy = cobrosHoy.filter(c => c.metodoPago === 'efectivo').reduce((sum, c) => sum + c.importe, 0);
  const tarjetaHoy = cobrosHoy.filter(c => c.metodoPago === 'tarjeta').reduce((sum, c) => sum + c.importe, 0);
  const transferenciasHoy = cobrosHoy.filter(c => c.metodoPago === 'transferencia').reduce((sum, c) => sum + c.importe, 0);
  const totalCobradoHoy = cobrosHoy.reduce((sum, c) => sum + c.importe, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cobros & Caja</h1>
          <p className="text-muted-foreground">Gestión de cobros y arqueo de caja</p>
        </div>
        <Button data-testid="button-nuevo-cobro">
          <DollarSign className="h-4 w-4 mr-2" />
          Registrar Cobro
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectivo Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-efectivo-hoy">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${efectivoHoy.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              En caja
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarjeta Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-tarjeta-hoy">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${tarjetaHoy.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              TPV
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transferencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-transferencias-hoy">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${transferenciasHoy.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              Hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-cobrado-hoy">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${totalCobradoHoy.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
            </div>
            <p className="text-xs text-muted-foreground">
              Hoy
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Movimientos de Caja</CardTitle>
            <Button variant="outline" data-testid="button-arqueo-caja">
              Arqueo de Caja
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : cobrosHoy.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Wallet className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay movimientos de caja registrados hoy</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  cobrosHoy.map((cobro) => (
                    <TableRow key={cobro.id} data-testid={`row-cobro-${cobro.id}`}>
                      <TableCell>
                        {cobro.fecha ? new Date(cobro.fecha).toLocaleString('es-ES', { 
                          dateStyle: 'short', 
                          timeStyle: 'short' 
                        }) : '-'}
                      </TableCell>
                      <TableCell>{cobro.facturaNumero || '-'}</TableCell>
                      <TableCell>{cobro.clienteNombre || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {cobro.metodoPago}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{cobro.importe.toFixed(2)} €</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cobro.referencia || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" data-testid={`button-ver-${cobro.id}`}>
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
