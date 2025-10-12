import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SelectOrdenReparacion } from "@shared/schema";

const estadoColors = {
  abierta: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  en_curso: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  a_la_espera: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  terminada: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  facturada: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
};

const estadoLabels = {
  abierta: "Abierta",
  en_curso: "En Curso",
  a_la_espera: "A la Espera",
  terminada: "Terminada",
  facturada: "Facturada",
};

export default function Ordenes() {
  const estados: Array<keyof typeof estadoColors> = ["abierta", "en_curso", "a_la_espera", "terminada", "facturada"];
  const [, navigate] = useLocation();

  const { data: ordenes, isLoading } = useQuery<SelectOrdenReparacion[]>({
    queryKey: ["/api/ordenes"],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Órdenes de Reparación</h1>
          <p className="text-muted-foreground">Gestión de órdenes de reparación</p>
        </div>
        <Button data-testid="button-nueva-or">
          <Plus className="h-4 w-4 mr-2" />
          Nueva OR
        </Button>
      </div>

      <div className="grid gap-4">
        {estados.map((estado) => {
          const ordenesEstado = ordenes?.filter(o => o.estado === estado) || [];
          return (
            <Card key={estado}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={estadoColors[estado]}>
                      {estadoLabels[estado]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {isLoading ? <Skeleton className="h-4 w-16 inline-block" /> : `${ordenesEstado.length} órdenes`}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="space-y-3 min-h-32" 
                  data-testid={`list-ordenes-${estado}`}
                >
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-3 w-3/4" />
                        </CardContent>
                      </Card>
                    ))
                  ) : ordenesEstado.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <p>No hay órdenes en este estado</p>
                    </div>
                  ) : (
                    ordenesEstado.map((orden) => (
                      <Card key={orden.id} className="hover-elevate" data-testid={`card-orden-${orden.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold" data-testid={`text-numero-orden-${orden.id}`}>
                                  OR-{orden.id.toString().padStart(5, '0')}
                                </span>
                                {orden.vehiculoMatricula && (
                                  <Badge variant="outline">{orden.vehiculoMatricula}</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground" data-testid={`text-descripcion-${orden.id}`}>
                                {orden.descripcion || 'Sin descripción'}
                              </p>
                              {orden.fechaEntrada && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(orden.fechaEntrada).toLocaleDateString('es-ES')}
                                </div>
                              )}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate(`/ordenes/${orden.id}`)}
                              data-testid={`button-ver-orden-${orden.id}`}
                            >
                              Ver detalles
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isLoading && ordenes && ordenes.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <ClipboardList className="h-16 w-16 mx-auto mb-3 opacity-50" />
                <p className="text-lg">No hay órdenes de reparación</p>
                <Button variant="link" className="mt-2" data-testid="button-crear-primera-or">
                  Crear la primera orden de reparación
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
