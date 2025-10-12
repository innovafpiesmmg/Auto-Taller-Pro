import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Car, User } from "lucide-react";
import { RecepcionChecklist } from "@/components/recepcion-checklist";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SelectOrdenReparacion } from "@shared/schema";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  observacion?: string;
}

export default function OrdenDetalle() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: orden, isLoading } = useQuery<SelectOrdenReparacion>({
    queryKey: ["/api/ordenes", id],
    enabled: !!id,
  });

  const updateOrdenMutation = useMutation({
    mutationFn: async ({ checklist, signature }: { checklist: ChecklistItem[], signature: string }) => {
      return apiRequest(`/api/ordenes/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          checklistRecepcion: JSON.stringify(checklist),
          firmaDigital: signature,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/ordenes"] });
      toast({
        title: "Recepción guardada",
        description: "El checklist y la firma se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar la recepción.",
        variant: "destructive",
      });
    },
  });

  const handleSaveRecepcion = (checklist: ChecklistItem[], signature: string) => {
    updateOrdenMutation.mutate({ checklist, signature });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Orden no encontrada</p>
      </div>
    );
  }

  const checklist: ChecklistItem[] = orden.checklistRecepcion 
    ? JSON.parse(orden.checklistRecepcion) 
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/ordenes")}
          data-testid="button-volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            OR-{orden.id.toString().padStart(5, '0')}
          </h1>
          <p className="text-muted-foreground">Orden de Reparación</p>
        </div>
        <Badge variant={
          orden.estado === 'abierta' ? 'default' :
          orden.estado === 'en_curso' ? 'secondary' :
          orden.estado === 'terminada' ? 'outline' :
          'destructive'
        }>
          {orden.estado}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{orden.clienteNombre || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">NIF</p>
              <p className="font-medium">{orden.clienteNif || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Información del Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Matrícula</p>
              <p className="font-medium">{orden.vehiculoMatricula || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Marca/Modelo</p>
              <p className="font-medium">
                {orden.vehiculoMarca && orden.vehiculoModelo 
                  ? `${orden.vehiculoMarca} ${orden.vehiculoModelo}`
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">KM Entrada</p>
              <p className="font-medium">{orden.kmEntrada || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detalles de la Orden
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Fecha de Apertura</p>
            <p className="font-medium">
              {orden.fechaApertura 
                ? new Date(orden.fechaApertura).toLocaleDateString('es-ES')
                : '-'}
            </p>
          </div>
          {orden.observaciones && (
            <div>
              <p className="text-sm text-muted-foreground">Observaciones</p>
              <p className="font-medium">{orden.observaciones}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <RecepcionChecklist
        onSave={handleSaveRecepcion}
        initialChecklist={checklist}
        initialSignature={orden.firmaDigital || undefined}
      />
    </div>
  );
}
