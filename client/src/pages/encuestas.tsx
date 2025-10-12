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
import { Input } from "@/components/ui/input";
import { ClipboardList, Plus, Search, Star } from "lucide-react";
import type { Encuesta, RespuestaEncuesta } from "@shared/schema";
import { format } from "date-fns";

export default function Encuestas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "csat" as const,
    pregunta: "",
    activa: true,
  });
  const { toast } = useToast();

  const { data: encuestas, isLoading } = useQuery<Encuesta[]>({
    queryKey: ["/api/encuestas"],
  });

  const { data: respuestas } = useQuery<RespuestaEncuesta[]>({
    queryKey: ["/api/respuestas-encuestas"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/encuestas", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encuestas"] });
      setOpen(false);
      setFormData({
        nombre: "",
        tipo: "csat",
        pregunta: "",
        activa: true,
      });
      toast({ title: "Encuesta creada exitosamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al crear encuesta", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const filteredEncuestas = encuestas?.filter(encuesta => {
    const matchesSearch = encuesta.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      encuesta.pregunta.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getTipoBadge = (tipo: string) => {
    const labels = {
      nps: "Net Promoter Score",
      csat: "Customer Satisfaction",
      personalizada: "Personalizada",
    };
    const variants = {
      nps: "default",
      csat: "secondary",
      personalizada: "outline",
    } as const;
    
    return (
      <Badge variant={variants[tipo as keyof typeof variants] || "outline"}>
        {labels[tipo as keyof typeof labels] || tipo}
      </Badge>
    );
  };

  const getEstadisticas = (encuestaId: number) => {
    const respuestasEncuesta = respuestas?.filter(r => r.encuestaId === encuestaId) || [];
    const total = respuestasEncuesta.length;
    
    if (total === 0) return { total: 0, promedio: 0 };
    
    const suma = respuestasEncuesta.reduce((acc, r) => acc + (r.puntuacion || 0), 0);
    const promedio = suma / total;
    
    return { total, promedio: promedio.toFixed(1) };
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Encuestas de Satisfacción</h1>
              <p className="text-sm text-muted-foreground">Mide NPS, CSAT y feedback de clientes</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-crear-encuesta">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Encuesta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nueva Encuesta</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    data-testid="input-nombre-encuesta"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger data-testid="select-tipo-encuesta">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nps">NPS (Net Promoter Score)</SelectItem>
                      <SelectItem value="csat">CSAT (Customer Satisfaction)</SelectItem>
                      <SelectItem value="personalizada">Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pregunta">Pregunta *</Label>
                  <Textarea
                    id="pregunta"
                    value={formData.pregunta}
                    onChange={(e) => setFormData({ ...formData, pregunta: e.target.value })}
                    placeholder="Ej: ¿Qué tan satisfecho está con nuestro servicio?"
                    data-testid="textarea-pregunta-encuesta"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => createMutation.mutate(formData)}
                  disabled={createMutation.isPending || !formData.nombre || !formData.pregunta}
                  data-testid="button-guardar-encuesta"
                >
                  {createMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar encuestas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-buscar-encuestas"
          />
        </div>
      </div>

      <div className="border rounded-lg flex-1 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Pregunta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Respuestas</TableHead>
              <TableHead>Puntuación Media</TableHead>
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
            ) : !filteredEncuestas || filteredEncuestas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mb-2 opacity-50" />
                    <p>No hay encuestas registradas</p>
                    <Button variant="ghost" className="mt-2" data-testid="button-crear-primera-encuesta">
                      Crear la primera encuesta
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEncuestas.map((encuesta) => {
                const stats = getEstadisticas(encuesta.id);
                
                return (
                  <TableRow key={encuesta.id} data-testid={`row-encuesta-${encuesta.id}`}>
                    <TableCell className="font-medium">{encuesta.nombre}</TableCell>
                    <TableCell>{getTipoBadge(encuesta.tipo)}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate">{encuesta.pregunta}</p>
                    </TableCell>
                    <TableCell>
                      {encuesta.activa ? (
                        <Badge variant="default">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{stats.total}</span>
                      <span className="text-muted-foreground ml-1">respuestas</span>
                    </TableCell>
                    <TableCell>
                      {stats.total > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{stats.promedio}</span>
                          <span className="text-muted-foreground">/ 10</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-ver-encuesta-${encuesta.id}`}
                      >
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
