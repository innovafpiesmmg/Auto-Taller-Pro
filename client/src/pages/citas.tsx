import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, Edit, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Cita, Cliente, Vehiculo } from "@shared/schema";
import { insertCitaSchema } from "@shared/schema";
import { z } from "zod";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  startOfDay,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  setHours,
  setMinutes,
  isWithinInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type FormValues = z.infer<typeof insertCitaSchema>;

export default function Citas() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<Cita | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: citas, isLoading } = useQuery<Cita[]>({
    queryKey: ["/api/citas"],
  });

  const { data: clientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const { data: vehiculos } = useQuery<Vehiculo[]>({
    queryKey: ["/api/vehiculos"],
  });

  const today = startOfDay(new Date());
  const citasHoy = citas?.filter(c => 
    c.fechaHora && isSameDay(new Date(c.fechaHora), today)
  ) || [];

  const getCitasForDay = (day: Date) => {
    return citas?.filter(c => 
      c.fechaHora && isSameDay(new Date(c.fechaHora), day)
    ) || [];
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(insertCitaSchema.extend({
      clienteId: z.number().int().min(1, "Debe seleccionar un cliente"),
      vehiculoId: z.number().int().min(1, "Debe seleccionar un vehículo"),
    })),
    defaultValues: {
      clienteId: undefined,
      vehiculoId: undefined,
      fechaHora: new Date(),
      motivo: "",
      estado: "pendiente",
      canal: "telefono",
      tecnicoId: undefined,
      notas: "",
    },
  });

  const handleOpenDialog = (cita?: Cita) => {
    if (cita) {
      setEditingCita(cita);
      form.reset({
        clienteId: cita.clienteId,
        vehiculoId: cita.vehiculoId,
        fechaHora: cita.fechaHora ? new Date(cita.fechaHora) : new Date(),
        motivo: cita.motivo,
        estado: cita.estado,
        canal: cita.canal || "telefono",
        tecnicoId: cita.tecnicoId || undefined,
        duracion: cita.duracion || 60,
        notas: cita.notas || "",
      });
    } else {
      setEditingCita(null);
      form.reset({
        clienteId: undefined,
        vehiculoId: undefined,
        fechaHora: new Date(),
        motivo: "",
        estado: "pendiente",
        canal: "telefono",
        tecnicoId: undefined,
        duracion: 60,
        notas: "",
      });
    }
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("/api/citas", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/citas"] });
      toast({
        title: "Cita creada",
        description: "La cita se ha creado correctamente",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la cita",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest(`/api/citas/${editingCita?.id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/citas"] });
      toast({
        title: "Cita actualizada",
        description: "La cita se ha actualizado correctamente",
      });
      setDialogOpen(false);
      setEditingCita(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la cita",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/citas/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/citas"] });
      toast({
        title: "Cita eliminada",
        description: "La cita se ha eliminado correctamente",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la cita",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (editingCita) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const prevWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const clienteId = form.watch("clienteId");
  const vehiculosFiltrados = vehiculos?.filter(v => v.clienteId === clienteId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda & Citas</h1>
          <p className="text-muted-foreground">Gestión de citas del taller</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-nueva-cita">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {viewMode === 'month' ? (
                  format(currentDate, "MMMM yyyy", { locale: es }).charAt(0).toUpperCase() + format(currentDate, "MMMM yyyy", { locale: es }).slice(1)
                ) : (
                  `Semana del ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d 'de' MMMM", { locale: es })}`
                )}
              </CardTitle>
              <div className="flex border rounded-md p-1">
                <Button 
                  variant={viewMode === 'month' ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode('month')}
                  className="h-8"
                >
                  Mes
                </Button>
                <Button 
                  variant={viewMode === 'week' ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode('week')}
                  className="h-8"
                >
                  Semana
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={viewMode === 'month' ? prevMonth : prevWeek} data-testid="button-anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={viewMode === 'month' ? nextMonth : nextWeek} data-testid="button-siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'month' ? (
            <div className="grid grid-cols-7 gap-2">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
              
              {daysInMonth.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                const dayCitas = getCitasForDay(day);
                
                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-24 border rounded-md p-2 hover-elevate",
                      !isCurrentMonth && "opacity-50",
                      isTodayDate && "border-primary bg-primary/5"
                    )}
                    data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {isLoading ? (
                        <Skeleton className="h-6 w-full" />
                      ) : (
                        dayCitas.slice(0, 3).map((cita) => {
                          const cliente = clientes?.find(c => c.id === cita.clienteId);
                          return (
                            <div
                              key={cita.id}
                              className="text-xs p-1 bg-primary/10 rounded border border-primary/20 truncate cursor-pointer hover-elevate"
                              onClick={() => handleOpenDialog(cita)}
                              data-testid={`cita-${cita.id}`}
                            >
                              <div className="font-medium truncate">{cliente?.nombre || 'Cliente'}</div>
                              <div className="text-muted-foreground flex justify-between">
                                <span>{cita.fechaHora ? format(new Date(cita.fechaHora), 'HH:mm') : ''}</span>
                                {cita.duracion && <span>{cita.duracion}m</span>}
                              </div>
                            </div>
                          );
                        })
                      )}
                      {dayCitas.length > 3 && (
                        <div className="text-xs text-center text-muted-foreground">
                          +{dayCitas.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-8 border-b">
                  <div className="p-2 border-r bg-muted/20"></div>
                  {eachDayOfInterval({
                    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                    end: endOfWeek(currentDate, { weekStartsOn: 1 })
                  }).map((day) => (
                    <div key={day.toString()} className={cn(
                      "p-2 text-center border-r last:border-r-0",
                      isToday(day) && "bg-primary/5"
                    )}>
                      <div className="text-xs font-medium text-muted-foreground">
                        {format(day, "EEE", { locale: es })}
                      </div>
                      <div className={cn(
                        "text-sm font-bold",
                        isToday(day) && "text-primary"
                      )}>
                        {format(day, "d")}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-8 relative h-[600px] overflow-y-auto">
                  <div className="grid grid-rows-[repeat(13,60px)]">
                    {Array.from({ length: 13 }).map((_, i) => (
                      <div key={i} className="p-2 text-xs text-right border-b border-r bg-muted/20 text-muted-foreground">
                        {8 + i}:00
                      </div>
                    ))}
                  </div>
                  {eachDayOfInterval({
                    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                    end: endOfWeek(currentDate, { weekStartsOn: 1 })
                  }).map((day) => {
                    const dayCitas = getCitasForDay(day);
                    return (
                      <div key={day.toString()} className={cn(
                        "relative border-r last:border-r-0",
                        isToday(day) && "bg-primary/5"
                      )}>
                        {Array.from({ length: 13 }).map((_, i) => (
                          <div key={i} className="h-[60px] border-b border-dashed opacity-20"></div>
                        ))}
                        {dayCitas.map((cita) => {
                          if (!cita.fechaHora) return null;
                          const date = new Date(cita.fechaHora);
                          const hour = date.getHours();
                          const minutes = date.getMinutes();
                          if (hour < 8 || hour >= 21) return null;
                          
                          const top = (hour - 8) * 60 + minutes;
                          const height = (cita.duracion || 60);
                          const cliente = clientes?.find(c => c.id === cita.clienteId);
                          
                          return (
                            <div
                              key={cita.id}
                              className="absolute left-1 right-1 rounded border border-primary/20 bg-primary/10 p-1 text-[10px] overflow-hidden cursor-pointer hover-elevate z-10"
                              style={{ top: `${top}px`, height: `${height}px` }}
                              onClick={() => handleOpenDialog(cita)}
                            >
                              <div className="font-bold truncate">{cliente?.nombre || 'Cliente'}</div>
                              <div className="truncate">{cita.motivo}</div>
                              <div className="text-muted-foreground font-mono">
                                {format(date, "HH:mm")} ({cita.duracion}m)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Citas de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" data-testid="list-citas-hoy">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4" />
                  </CardContent>
                </Card>
              ))
            ) : citasHoy.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay citas programadas para hoy</p>
                </div>
              </div>
            ) : (
              citasHoy.map((cita) => {
                const cliente = clientes?.find(c => c.id === cita.clienteId);
                const vehiculo = vehiculos?.find(v => v.id === cita.vehiculoId);
                          const isConfirmedOrInProgress = cita.estado === 'confirmada' || cita.estado === 'en_curso';

                          return (
                            <Card key={cita.id} className="hover-elevate" data-testid={`card-cita-${cita.id}`}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold">{cliente?.nombre || 'Cliente'}</span>
                                      <Badge variant={
                                        cita.estado === 'confirmada' ? 'default' :
                                        cita.estado === 'cancelada' ? 'destructive' :
                                        'secondary'
                                      } data-testid={`badge-estado-${cita.id}`}>
                                        {cita.estado}
                                      </Badge>
                                    </div>
                                    {vehiculo && (
                                      <p className="text-sm text-muted-foreground">
                                        Vehículo: {vehiculo.matricula} - {vehiculo.marca} {vehiculo.modelo}
                                      </p>
                                    )}
                                    {cita.fechaHora && (
                                      <div className="flex items-center gap-1 mt-2 text-sm">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(cita.fechaHora), 'HH:mm', { locale: es })}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    {isConfirmedOrInProgress && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            const res = await apiRequest("/api/ordenes", {
                                              method: "POST",
                                              body: JSON.stringify({
                                                codigo: `OR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                                                clienteId: cita.clienteId,
                                                vehiculoId: cita.vehiculoId,
                                                citaId: cita.id,
                                                estado: "abierta",
                                                fechaApertura: new Date(),
                                                kmEntrada: 0
                                              })
                                            });
                                            const newOr = await res.json();
                                            window.location.href = `/ordenes/${newOr.id}`;
                                          } catch (error) {
                                            toast({
                                              title: "Error",
                                              description: "No se pudo crear la orden de reparación",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                        data-testid={`button-crear-or-cita-${cita.id}`}
                                      >
                                        Crear OR
                                      </Button>
                                    )}
                                    <Button 
                                      variant="outline" 
                                      size="icon" 
                                      onClick={() => handleOpenDialog(cita)}
                                      data-testid={`button-editar-cita-${cita.id}`}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="icon" 
                                      onClick={() => setDeleteId(cita.id)}
                                      data-testid={`button-eliminar-cita-${cita.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-cita">
          <DialogHeader>
            <DialogTitle>{editingCita ? "Editar Cita" : "Nueva Cita"}</DialogTitle>
            <DialogDescription>
              {editingCita ? "Modifica los datos de la cita" : "Completa el formulario para crear una nueva cita"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clienteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          form.setValue("vehiculoId", 0);
                        }}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-cliente">
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientes?.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id.toString()}>
                              {cliente.nombre} {cliente.apellidos || ''} - {cliente.nif}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehiculoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehículo</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                        disabled={!clienteId || clienteId === 0}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-vehiculo">
                            <SelectValue placeholder="Seleccionar vehículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehiculosFiltrados.map((vehiculo) => (
                            <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                              {vehiculo.matricula} - {vehiculo.marca} {vehiculo.modelo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fechaHora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha y Hora</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          data-testid="input-fecha-hora"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-estado">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="confirmada">Confirmada</SelectItem>
                          <SelectItem value="en_curso">En Curso</SelectItem>
                          <SelectItem value="completada">Completada</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duracion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-duracion">
                            <SelectValue placeholder="Seleccionar duración" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                          <SelectItem value="90">1:30h</SelectItem>
                          <SelectItem value="120">2 horas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el motivo de la cita"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-motivo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-notas"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancelar"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-guardar"
                >
                  {editingCita ? "Actualizar" : "Crear"} Cita
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent data-testid="dialog-confirmar-eliminar">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la cita permanentemente.
            </AlertDialogDescription>
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
    </div>
  );
}
