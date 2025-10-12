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
import { Ticket, Plus, Search, Percent, Euro } from "lucide-react";
import type { Cupon } from "@shared/schema";
import { format } from "date-fns";

export default function Cupones() {
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    descripcion: "",
    tipoDescuento: "porcentaje",
    valorDescuento: "10",
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaExpiracion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usosMaximos: 1,
  });
  const { toast } = useToast();

  const estadoParam = estadoFilter !== "all" ? estadoFilter : undefined;
  const { data: cupones, isLoading } = useQuery<Cupon[]>({
    queryKey: ["/api/cupones", undefined, estadoParam],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/cupones", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cupones"] });
      setOpen(false);
      setFormData({
        codigo: "",
        descripcion: "",
        tipoDescuento: "porcentaje",
        valorDescuento: "10",
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaExpiracion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usosMaximos: 1,
      });
      toast({ title: "Cupón creado exitosamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al crear cupón", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const filteredCupones = cupones?.filter(cupon => {
    const matchesSearch = cupon.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cupon.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getEstadoBadge = (estado: string) => {
    const variants = {
      activo: "default",
      usado: "secondary",
      expirado: "outline",
      cancelado: "destructive",
    } as const;
    return variants[estado as keyof typeof variants] || "secondary";
  };

  const formatDescuento = (cupon: Cupon) => {
    if (cupon.tipoDescuento === "porcentaje") {
      return (
        <div className="flex items-center gap-1">
          <Percent className="h-4 w-4" />
          <span className="font-medium">{cupon.valorDescuento}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1">
          <Euro className="h-4 w-4" />
          <span className="font-medium">{cupon.valorDescuento}€</span>
        </div>
      );
    }
  };

  const isExpiringSoon = (fechaExpiracion: Date) => {
    const diasRestantes = Math.floor((new Date(fechaExpiracion).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diasRestantes > 0 && diasRestantes <= 7;
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Cupones de Descuento</h1>
              <p className="text-sm text-muted-foreground">Gestiona cupones y promociones para clientes</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-crear-cupon">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cupón
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Cupón</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ej: VERANO2025"
                    data-testid="input-codigo-cupon"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    data-testid="textarea-descripcion-cupon"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipoDescuento">Tipo de Descuento *</Label>
                  <Select value={formData.tipoDescuento} onValueChange={(value) => setFormData({ ...formData, tipoDescuento: value })}>
                    <SelectTrigger data-testid="select-tipo-descuento">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">Porcentaje</SelectItem>
                      <SelectItem value="fijo">Importe Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="valorDescuento">Valor del Descuento *</Label>
                  <Input
                    id="valorDescuento"
                    type="number"
                    value={formData.valorDescuento}
                    onChange={(e) => setFormData({ ...formData, valorDescuento: e.target.value })}
                    data-testid="input-valor-descuento"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fechaInicio">Fecha Inicio *</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      data-testid="input-fecha-inicio"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fechaExpiracion">Fecha Expiración *</Label>
                    <Input
                      id="fechaExpiracion"
                      type="date"
                      value={formData.fechaExpiracion}
                      onChange={(e) => setFormData({ ...formData, fechaExpiracion: e.target.value })}
                      data-testid="input-fecha-expiracion"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="usosMaximos">Usos Máximos *</Label>
                  <Input
                    id="usosMaximos"
                    type="number"
                    value={formData.usosMaximos}
                    onChange={(e) => setFormData({ ...formData, usosMaximos: parseInt(e.target.value) || 1 })}
                    data-testid="input-usos-maximos"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => createMutation.mutate(formData)}
                  disabled={createMutation.isPending || !formData.codigo}
                  data-testid="button-guardar-cupon"
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
              placeholder="Buscar cupones por código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-buscar-cupones"
            />
          </div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-48" data-testid="select-estado-cupon">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="usado">Usado</SelectItem>
              <SelectItem value="expirado">Expirado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg flex-1 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead>Monto Mínimo</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !filteredCupones || filteredCupones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Ticket className="h-12 w-12 mb-2 opacity-50" />
                    <p>No hay cupones registrados</p>
                    <Button variant="ghost" className="mt-2" data-testid="button-crear-primer-cupon">
                      Crear el primer cupón
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCupones.map((cupon) => (
                <TableRow key={cupon.id} data-testid={`row-cupon-${cupon.id}`}>
                  <TableCell>
                    <code className="px-2 py-1 bg-muted rounded font-mono text-sm font-medium">
                      {cupon.codigo}
                    </code>
                  </TableCell>
                  <TableCell>
                    {cupon.descripcion || (
                      <span className="text-muted-foreground">Sin descripción</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDescuento(cupon)}</TableCell>
                  <TableCell>
                    {cupon.montoMinimo ? (
                      <span>{cupon.montoMinimo}€</span>
                    ) : (
                      <span className="text-muted-foreground">Sin mínimo</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {cupon.usosActuales} / {cupon.usosMaximos || '∞'}
                      </span>
                      {cupon.usosMaximos && cupon.usosActuales >= cupon.usosMaximos && (
                        <span className="text-xs text-muted-foreground">Agotado</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{format(new Date(cupon.fechaInicio), "dd/MM/yyyy")}</span>
                      <span className={isExpiringSoon(cupon.fechaExpiracion) ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}>
                        {format(new Date(cupon.fechaExpiracion), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEstadoBadge(cupon.estado)}>
                      {cupon.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      data-testid={`button-ver-cupon-${cupon.id}`}
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
