import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Megaphone, Plus, Search, Mail, MessageSquare } from "lucide-react";
import type { Campana } from "@shared/schema";
import { format } from "date-fns";

export default function Campanas() {
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "promocion" as const,
    estado: "borrador" as const,
    descripcion: "",
    diasAnticipacion: 0,
  });
  const { toast } = useToast();

  const estadoParam = estadoFilter !== "all" ? estadoFilter : undefined;
  const { data: campanas, isLoading } = useQuery<Campana[]>({
    queryKey: ["/api/campanas", estadoParam],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/campanas", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campanas"] });
      setOpen(false);
      setFormData({
        nombre: "",
        tipo: "promocion",
        estado: "borrador",
        descripcion: "",
        diasAnticipacion: 0,
      });
      toast({ title: "Campaña creada exitosamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al crear campaña", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const filteredCampanas = campanas?.filter(campana => {
    const matchesSearch = campana.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campana.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getEstadoBadge = (estado: string) => {
    const variants = {
      borrador: "secondary",
      activa: "default",
      pausada: "outline",
      finalizada: "secondary",
    } as const;
    return variants[estado as keyof typeof variants] || "secondary";
  };

  const getTipoBadge = (tipo: string) => {
    const labels = {
      itv: "ITV",
      revision: "Revisión",
      cumpleanos: "Cumpleaños",
      seguimiento: "Seguimiento",
      promocion: "Promoción",
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Campañas de Marketing</h1>
              <p className="text-sm text-muted-foreground">Gestiona campañas automáticas de comunicación</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-crear-campana">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Campaña
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nueva Campaña</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    data-testid="input-nombre-campana"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger data-testid="select-tipo-campana">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="itv">ITV</SelectItem>
                      <SelectItem value="revision">Revisión</SelectItem>
                      <SelectItem value="cumpleanos">Cumpleaños</SelectItem>
                      <SelectItem value="seguimiento">Seguimiento</SelectItem>
                      <SelectItem value="promocion">Promoción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    data-testid="textarea-descripcion-campana"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="diasAnticipacion">Días de Anticipación</Label>
                  <Input
                    id="diasAnticipacion"
                    type="number"
                    value={formData.diasAnticipacion}
                    onChange={(e) => setFormData({ ...formData, diasAnticipacion: parseInt(e.target.value) || 0 })}
                    data-testid="input-dias-anticipacion"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => createMutation.mutate(formData)}
                  disabled={createMutation.isPending || !formData.nombre}
                  data-testid="button-guardar-campana"
                >
                  {createMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar campañas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-buscar-campanas"
            />
          </div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-48" data-testid="select-estado-campana">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="activa">Activa</SelectItem>
              <SelectItem value="pausada">Pausada</SelectItem>
              <SelectItem value="finalizada">Finalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg flex-1 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Canales</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Días Anticipación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !filteredCampanas || filteredCampanas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Megaphone className="h-12 w-12 mb-2 opacity-50" />
                    <p>No hay campañas registradas</p>
                    <Button variant="ghost" className="mt-2" data-testid="button-crear-primera-campana">
                      Crear la primera campaña
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCampanas.map((campana) => (
                <TableRow key={campana.id} data-testid={`row-campana-${campana.id}`}>
                  <TableCell className="font-medium">
                    {campana.nombre}
                    {campana.descripcion && (
                      <p className="text-sm text-muted-foreground">{campana.descripcion}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTipoBadge(campana.tipo)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEstadoBadge(campana.estado)}>
                      {campana.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {campana.plantillaEmail && (
                        <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded" title="Email">
                          <Mail className="h-3 w-3 text-blue-600 dark:text-blue-300" />
                        </div>
                      )}
                      {campana.plantillaSms && (
                        <div className="p-1 bg-green-100 dark:bg-green-900 rounded" title="SMS">
                          <MessageSquare className="h-3 w-3 text-green-600 dark:text-green-300" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {campana.fechaInicio && campana.fechaFin ? (
                      <div className="text-sm">
                        <div>{format(new Date(campana.fechaInicio), "dd/MM/yyyy")}</div>
                        <div className="text-muted-foreground">
                          {format(new Date(campana.fechaFin), "dd/MM/yyyy")}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {campana.diasAnticipacion ? (
                      <span>{campana.diasAnticipacion} días</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      data-testid={`button-ver-campana-${campana.id}`}
                    >
                      Ver detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
