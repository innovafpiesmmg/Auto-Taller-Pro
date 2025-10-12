import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart, Eye, Truck } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PedidoCompra } from "@shared/schema";
import { format } from "date-fns";

const estadoConfig = {
  pendiente: { label: "Pendiente", variant: "default" as const, icon: ShoppingCart },
  enviado: { label: "Enviado", variant: "secondary" as const, icon: Truck },
  recibido_parcial: { label: "Recibido Parcial", variant: "default" as const, icon: ShoppingCart },
  recibido: { label: "Recibido", variant: "default" as const, icon: ShoppingCart },
  cancelado: { label: "Cancelado", variant: "secondary" as const, icon: ShoppingCart },
};

export default function PedidosCompra() {
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");

  const { data: pedidos, isLoading } = useQuery<PedidoCompra[]>({
    queryKey: ["/api/pedidos-compra", estadoFilter !== "todos" ? estadoFilter : undefined],
  });

  const pedidosFiltrados = pedidos || [];

  const pedidosPorEstado = {
    todos: pedidos?.length || 0,
    pendiente: pedidos?.filter(p => p.estado === 'pendiente').length || 0,
    enviado: pedidos?.filter(p => p.estado === 'enviado').length || 0,
    recibido: pedidos?.filter(p => p.estado === 'recibido').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos de Compra</h1>
          <p className="text-muted-foreground">Gestión de pedidos a proveedores</p>
        </div>
        <Button data-testid="button-nuevo-pedido">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidosPorEstado.todos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidosPorEstado.pendiente}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidosPorEstado.enviado}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidosPorEstado.recibido}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={estadoFilter} onValueChange={setEstadoFilter}>
        <TabsList>
          <TabsTrigger value="todos" data-testid="tab-todos">Todos</TabsTrigger>
          <TabsTrigger value="pendiente" data-testid="tab-pendiente">Pendientes</TabsTrigger>
          <TabsTrigger value="enviado" data-testid="tab-enviado">Enviados</TabsTrigger>
          <TabsTrigger value="recibido" data-testid="tab-recibido">Recibidos</TabsTrigger>
        </TabsList>

        <TabsContent value={estadoFilter} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Entrega Estimada</TableHead>
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
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : pedidosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <ShoppingCart className="h-12 w-12 mb-2 opacity-50" />
                            <p>No hay pedidos {estadoFilter !== 'todos' ? `en estado ${estadoFilter}` : ''}</p>
                            <Button variant="ghost" className="mt-2" data-testid="button-crear-primer-pedido">
                              Crear el primer pedido
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pedidosFiltrados.map((pedido) => (
                        <TableRow key={pedido.id} data-testid={`row-pedido-${pedido.id}`}>
                          <TableCell className="font-medium" data-testid={`text-numero-${pedido.id}`}>
                            {pedido.numero}
                          </TableCell>
                          <TableCell data-testid={`text-fecha-${pedido.id}`}>
                            {format(new Date(pedido.fecha), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell data-testid={`text-proveedor-${pedido.id}`}>
                            Proveedor #{pedido.proveedorId}
                          </TableCell>
                          <TableCell>
                            <Badge variant={estadoConfig[pedido.estado]?.variant || 'default'}>
                              {estadoConfig[pedido.estado]?.label || pedido.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium" data-testid={`text-total-${pedido.id}`}>
                            {parseFloat(pedido.total.toString()).toFixed(2)} €
                          </TableCell>
                          <TableCell data-testid={`text-entrega-${pedido.id}`}>
                            {pedido.fechaEntregaEstimada ? format(new Date(pedido.fechaEntregaEstimada), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" data-testid={`button-ver-${pedido.id}`}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
