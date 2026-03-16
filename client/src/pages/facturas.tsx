import { useState, useEffect, useRef } from "react";
import { useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Receipt, Edit, Trash2, Printer, Search, Download, Wrench, Package, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Factura, Cliente, LineaFactura, ConfigEmpresa } from "@shared/schema";
import { insertFacturaSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { FacturaPrint } from "@/components/factura-print";
import { PaginationControls } from "@/components/pagination-controls";
import { exportToCSV } from "@/lib/export-csv";

type FormValues = z.infer<typeof insertFacturaSchema>;

interface LineaForm {
  tipo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  igic: number;
}

function calcTotales(lineas: LineaForm[]) {
  const base = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  const igic = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario * (l.igic / 100), 0);
  return { base, igic, total: base + igic };
}

export default function Facturas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [printFactura, setPrintFactura] = useState<(Factura & { lineas?: LineaFactura[] }) | null>(null);
  const [lineas, setLineas] = useState<LineaForm[]>([]);
  const [origenLabel, setOrigenLabel] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();
  const canManageFacturas = user?.roles?.some(r => ["admin", "finanzas"].includes(r)) ?? false;

  const { data: facturas, isLoading } = useQuery<Factura[]>({ queryKey: ["/api/facturas"] });
  const { data: clientes } = useQuery<Cliente[]>({ queryKey: ["/api/clientes"] });
  const { data: empresa } = useQuery<ConfigEmpresa>({ queryKey: ["/api/config/empresa"] });

  const search = useSearch();
  const handledSearch = useRef<string>("");

  // ── Auto-abrir desde URL params ──────────────────
  useEffect(() => {
    if (!search || !clientes) return;

    const params = new URLSearchParams(search);
    const orId = params.get("orId");
    const presupuestoId = params.get("presupuestoId");
    const clienteId = params.get("clienteId");

    if (clienteId && !dialogOpen && !editingFactura && handledSearch.current !== search) {
      handledSearch.current = search;
      const cId = parseInt(clienteId);
      form.setValue("clienteId", cId);

      if (orId) {
        const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };

        Promise.all([
          fetch(`/api/ordenes/${orId}`, { headers }).then(r => r.ok ? r.json() : null),
          fetch(`/api/ordenes/${orId}/partes`, { headers }).then(r => r.ok ? r.json() : []),
          fetch(`/api/ordenes/${orId}/consumos`, { headers }).then(r => r.ok ? r.json() : []),
        ]).then(([orden, partes, consumos]) => {
          const lineasOR: LineaForm[] = [
            ...partes.map((p: any) => ({
              tipo: "mano_obra",
              descripcion: p.descripcion || "Mano de obra",
              cantidad: parseFloat(p.tiempoEstimado || "1"),
              precioUnitario: parseFloat(p.precioMO || "45"),
              igic: 0,
            })),
            ...consumos.map((c: any) => ({
              tipo: "articulo",
              descripcion: c.articulo?.descripcion || `Artículo #${c.articuloId}`,
              cantidad: parseFloat(c.cantidad || "1"),
              precioUnitario: parseFloat(c.precioUnitario || "0"),
              igic: parseFloat(c.igic || "7"),
            })),
          ];

          if (lineasOR.length === 0 && orden) {
            lineasOR.push({
              tipo: "otros",
              descripcion: `Trabajos OR ${orden.codigo || orId}`,
              cantidad: 1,
              precioUnitario: 0,
              igic: 7,
            });
          }

          setLineas(lineasOR);
          setOrigenLabel(`Orden de Reparación ${orden?.codigo || `#${orId}`}`);
          setDialogOpen(true);
        });
      } else if (presupuestoId) {
        const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };

        fetch(`/api/presupuestos/${presupuestoId}`, { headers })
          .then(r => r.ok ? r.json() : null)
          .then(pres => {
            if (pres?.lineas) {
              const lineasPres = JSON.parse(pres.lineas).map((l: any) => ({
                tipo: l.tipo || "otros",
                descripcion: l.descripcion || "",
                cantidad: parseFloat(l.cantidad || "1"),
                precioUnitario: parseFloat(l.precioUnitario || "0"),
                igic: parseFloat(l.igic || "7"),
              }));
              setLineas(lineasPres);
            }
            setOrigenLabel(`Presupuesto #${presupuestoId}`);
            setDialogOpen(true);
          });
      } else {
        setDialogOpen(true);
      }
    }
  }, [search, clientes, dialogOpen, editingFactura]);

  useEffect(() => { setPage(1); }, [searchTerm]);

  // Recalcular totales del formulario cuando cambian las líneas
  useEffect(() => {
    if (lineas.length > 0) {
      const t = calcTotales(lineas);
      form.setValue("baseImponible", parseFloat(t.base.toFixed(2)));
      form.setValue("totalIgic", parseFloat(t.igic.toFixed(2)));
      form.setValue("total", parseFloat(t.total.toFixed(2)));
    }
  }, [lineas]);

  const filteredFacturas = facturas?.filter(factura => {
    const searchLower = searchTerm.toLowerCase();
    const cliente = clientes?.find(c => c.id === factura.clienteId);
    return (
      factura.numero.toLowerCase().includes(searchLower) ||
      factura.serie.toLowerCase().includes(searchLower) ||
      (cliente?.nombre.toLowerCase().includes(searchLower)) ||
      (cliente?.nif?.toLowerCase().includes(searchLower))
    );
  }) || [];

  const paginatedFacturas = filteredFacturas.slice((page - 1) * pageSize, page * pageSize);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const totalHoy = facturas?.filter(f => {
    const fecha = f.fecha && new Date(f.fecha);
    return fecha && fecha >= startOfDay && fecha < startOfTomorrow;
  }).reduce((sum, f) => sum + parseFloat(f.total.toString()), 0) || 0;

  const totalMes = facturas?.filter(f => {
    const fecha = f.fecha && new Date(f.fecha);
    return fecha && fecha >= firstDayOfMonth && fecha < firstDayNextMonth;
  }).reduce((sum, f) => sum + parseFloat(f.total.toString()), 0) || 0;

  const igicMes = facturas?.filter(f => {
    const fecha = f.fecha && new Date(f.fecha);
    return fecha && fecha >= firstDayOfMonth && fecha < firstDayNextMonth;
  }).reduce((sum, f) => sum + parseFloat(f.totalIgic.toString()), 0) || 0;

  const numFacturasMes = facturas?.filter(f => {
    const fecha = f.fecha && new Date(f.fecha);
    return fecha && fecha >= firstDayOfMonth && fecha < firstDayNextMonth;
  }).length || 0;

  const form = useForm<any>({
    resolver: zodResolver(insertFacturaSchema.extend({
      clienteId: z.number().int().min(1, "Debe seleccionar un cliente"),
    })),
    defaultValues: {
      serie: "F", tipo: "ordinaria",
      clienteId: undefined, fecha: new Date(),
      baseImponible: 0, totalIgic: 0, total: 0, observaciones: "",
    },
  });

  const handleOpenDialog = (factura?: Factura) => {
    setLineas([]);
    setOrigenLabel("");
    if (factura) {
      setEditingFactura(factura);
      form.reset({
        serie: factura.serie, tipo: factura.tipo,
        clienteId: factura.clienteId,
        fecha: factura.fecha ? new Date(factura.fecha) : new Date(),
        baseImponible: Number(factura.baseImponible),
        totalIgic: Number(factura.totalIgic),
        total: Number(factura.total),
        observaciones: factura.observaciones || "",
      });
      // Cargar líneas existentes si las hay
      fetch(`/api/facturas/${factura.id}`, {
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" }
      }).then(r => r.ok ? r.json() : null).then(data => {
        if (data?.lineas?.length) {
          setLineas(data.lineas.map((l: LineaFactura) => ({
            tipo: l.tipo,
            descripcion: l.descripcion,
            cantidad: parseFloat(l.cantidad.toString()),
            precioUnitario: parseFloat(l.precioUnitario.toString()),
            igic: parseFloat(l.igic.toString()),
          })));
        }
      });
    } else {
      setEditingFactura(null);
      form.reset({
        serie: "F", tipo: "ordinaria", clienteId: undefined,
        fecha: new Date(), baseImponible: 0, totalIgic: 0, total: 0, observaciones: "",
      });
    }
    setDialogOpen(true);
  };

  const handleAddLinea = () => {
    setLineas(prev => [...prev, { tipo: "otros", descripcion: "", cantidad: 1, precioUnitario: 0, igic: 7 }]);
  };

  const handleUpdateLinea = (idx: number, field: keyof LineaForm, value: any) => {
    setLineas(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const handleRemoveLinea = (idx: number) => {
    setLineas(prev => prev.filter((_, i) => i !== idx));
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/facturas", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facturas"] });
      toast({ title: "Factura creada", description: "La factura se ha creado correctamente" });
      setDialogOpen(false);
      setLineas([]);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo crear la factura", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/facturas/${editingFactura?.id}`, { method: "PUT", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facturas"] });
      toast({ title: "Factura actualizada" });
      setDialogOpen(false);
      setEditingFactura(null);
      setLineas([]);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar la factura", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/facturas/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facturas"] });
      toast({ title: "Factura eliminada" });
      setDeleteId(null);
    },
  });

  const handleExportCSV = () => {
    exportToCSV(filteredFacturas.map(f => ({
      numero: f.numero,
      fecha: f.fecha ? format(new Date(f.fecha), "yyyy-MM-dd") : "",
      concepto: f.observaciones || "",
      baseImponible: f.baseImponible,
      totalIgic: f.totalIgic,
      total: f.total,
    })), "facturas.csv");
  };

  const onSubmit = (data: FormValues) => {
    // Recalcular totales desde líneas si existen
    const payload: any = { ...data };
    if (lineas.length > 0) {
      const t = calcTotales(lineas);
      payload.baseImponible = parseFloat(t.base.toFixed(2));
      payload.totalIgic = parseFloat(t.igic.toFixed(2));
      payload.total = parseFloat(t.total.toFixed(2));
      payload.lineas = lineas.map(l => ({
        ...l,
        importe: parseFloat((l.cantidad * l.precioUnitario).toFixed(2)),
      }));
    }
    if (editingFactura) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const totales = calcTotales(lineas);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">Facturación</h1>
          <p className="text-muted-foreground">Gestión de facturas con IGIC</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} data-testid="button-exportar-facturas">
            <Download className="h-4 w-4 mr-2" />Exportar CSV
          </Button>
          {canManageFacturas && (
            <Button onClick={() => handleOpenDialog()} data-testid="button-nueva-factura">
              <Plus className="h-4 w-4 mr-2" />Nueva Factura
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Hoy", value: totalHoy, testid: "text-facturacion-hoy", sub: "Facturado hoy" },
          { label: "Total Mes", value: totalMes, testid: "text-facturacion-mes", sub: "Este mes" },
          { label: "IGIC Repercutido", value: igicMes, testid: "text-igic-repercutido", sub: "Este mes" },
        ].map(({ label, value, testid, sub }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={testid}>
                {isLoading ? <Skeleton className="h-8 w-24" /> : `${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
              </div>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Núm. Facturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-num-facturas-mes">
              {isLoading ? <Skeleton className="h-8 w-12" /> : numFacturasMes}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, serie, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-buscar-factura"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader><CardTitle>Lista de Facturas</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">IGIC</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedFacturas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Receipt className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay facturas emitidas</p>
                        <Button variant="ghost" className="mt-2" onClick={() => handleOpenDialog()} data-testid="button-crear-primera-factura">
                          Crear la primera factura
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedFacturas.map((factura) => {
                    const cliente = clientes?.find(c => c.id === factura.clienteId);
                    return (
                      <TableRow key={factura.id} data-testid={`row-factura-${factura.id}`}>
                        <TableCell className="font-mono font-medium">{factura.numero}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {factura.tipo === "simplificada" ? "Simplificada" :
                             factura.tipo === "ordinaria" ? "Ordinaria" : "Rectificativa"}
                          </Badge>
                        </TableCell>
                        <TableCell>{cliente?.nombre || "-"}</TableCell>
                        <TableCell>{factura.fecha ? new Date(factura.fecha).toLocaleDateString("es-ES") : "-"}</TableCell>
                        <TableCell className="text-right">{parseFloat(factura.baseImponible.toString()).toFixed(2)} €</TableCell>
                        <TableCell className="text-right text-muted-foreground">{parseFloat(factura.totalIgic.toString()).toFixed(2)} €</TableCell>
                        <TableCell className="text-right font-semibold">{parseFloat(factura.total.toString()).toFixed(2)} €</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setPrintFactura(factura)} data-testid={`button-imprimir-${factura.id}`}>
                              <Printer className="h-4 w-4" />
                            </Button>
                            {canManageFacturas && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(factura)} data-testid={`button-editar-${factura.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteId(factura.id)} data-testid={`button-eliminar-${factura.id}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            total={filteredFacturas.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Dialog creación/edición */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setLineas([]); setOrigenLabel(""); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-factura">
          <DialogHeader>
            <DialogTitle>{editingFactura ? "Editar Factura" : "Nueva Factura"}</DialogTitle>
            <DialogDescription>
              {editingFactura
                ? <span>Factura: <span className="font-mono font-semibold" data-testid="text-numero-factura">{editingFactura.numero}</span>{origenLabel ? ` · ${origenLabel}` : ""}</span>
                : origenLabel
                  ? `Datos pre-rellenados desde ${origenLabel}. Revisa las líneas antes de guardar.`
                  : "El número de factura se generará automáticamente al guardar."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              {/* Cabecera de factura */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="serie" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serie</FormLabel>
                    <FormControl><Input placeholder="F" {...field} data-testid="input-serie" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tipo"><SelectValue placeholder="Tipo" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="simplificada">Simplificada</SelectItem>
                        <SelectItem value="ordinaria">Ordinaria</SelectItem>
                        <SelectItem value="rectificativa">Rectificativa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="clienteId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString() || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-cliente"><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes?.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.nombre} {c.apellidos || ""} — {c.nif}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fecha" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        data-testid="input-fecha"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Separator />

              {/* Líneas de factura */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Líneas de Factura</h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddLinea} data-testid="button-add-linea">
                    <Plus className="h-4 w-4 mr-1" />Añadir línea
                  </Button>
                </div>

                {lineas.length === 0 ? (
                  <div className="border rounded-md p-4 text-center text-sm text-muted-foreground">
                    Sin líneas. Añade manualmente o usa el flujo desde una Orden de Reparación o Presupuesto.
                  </div>
                ) : (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-28">Tipo</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="w-20 text-right">Cant.</TableHead>
                          <TableHead className="w-28 text-right">Precio Un.</TableHead>
                          <TableHead className="w-20 text-right">IGIC %</TableHead>
                          <TableHead className="w-24 text-right">Importe</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineas.map((linea, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Select value={linea.tipo} onValueChange={(v) => handleUpdateLinea(idx, "tipo", v)}>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mano_obra">
                                    <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />M.O.</span>
                                  </SelectItem>
                                  <SelectItem value="articulo">
                                    <span className="flex items-center gap-1"><Package className="h-3 w-3" />Artículo</span>
                                  </SelectItem>
                                  <SelectItem value="otros">Otros</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                className="h-8 text-sm"
                                value={linea.descripcion}
                                onChange={(e) => handleUpdateLinea(idx, "descripcion", e.target.value)}
                                data-testid={`input-linea-descripcion-${idx}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number" step="0.01" className="h-8 text-sm text-right"
                                value={linea.cantidad}
                                onChange={(e) => handleUpdateLinea(idx, "cantidad", parseFloat(e.target.value) || 0)}
                                data-testid={`input-linea-cantidad-${idx}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number" step="0.01" className="h-8 text-sm text-right"
                                value={linea.precioUnitario}
                                onChange={(e) => handleUpdateLinea(idx, "precioUnitario", parseFloat(e.target.value) || 0)}
                                data-testid={`input-linea-precio-${idx}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number" step="0.1" className="h-8 text-sm text-right"
                                value={linea.igic}
                                onChange={(e) => handleUpdateLinea(idx, "igic", parseFloat(e.target.value) || 0)}
                                data-testid={`input-linea-igic-${idx}`}
                              />
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {(linea.cantidad * linea.precioUnitario).toFixed(2)} €
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLinea(idx)} data-testid={`button-remove-linea-${idx}`}>
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Totales calculados */}
                {lineas.length > 0 && (
                  <div className="mt-3 space-y-1 text-sm border rounded-md p-3 bg-muted/30">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base imponible</span>
                      <span>{totales.base.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total IGIC</span>
                      <span>{totales.igic.toFixed(2)} €</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between font-bold text-base">
                      <span>TOTAL</span>
                      <span className="text-primary">{totales.total.toFixed(2)} €</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Totales manuales (solo visibles si no hay líneas) */}
              {lineas.length === 0 && (
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="baseImponible" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Imponible (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-base-imponible" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="totalIgic" render={({ field }) => (
                    <FormItem>
                      <FormLabel>IGIC (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-igic" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="total" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-total" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              <FormField control={form.control} name="observaciones" render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observaciones adicionales" {...field} data-testid="input-observaciones" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancelar">
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-guardar">
                  {editingFactura ? "Actualizar" : "Crear"} Factura
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog eliminar */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent data-testid="dialog-confirmar-eliminar">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-eliminar">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirmar-eliminar"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Impresión */}
      {printFactura && (
        <FacturaPrint
          open={!!printFactura}
          onOpenChange={(open) => !open && setPrintFactura(null)}
          factura={printFactura}
          cliente={clientes?.find(c => c.id === printFactura.clienteId)}
          empresa={empresa}
        />
      )}
    </div>
  );
}
