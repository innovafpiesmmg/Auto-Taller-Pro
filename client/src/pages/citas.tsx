import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { SelectCita } from "@shared/schema";

export default function Citas() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: citas, isLoading } = useQuery<SelectCita[]>({
    queryKey: ["/api/citas"],
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

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda & Citas</h1>
          <p className="text-muted-foreground">Gestión de citas del taller</p>
        </div>
        <Button data-testid="button-nueva-cita">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentDate, "MMMM yyyy", { locale: es }).charAt(0).toUpperCase() + format(currentDate, "MMMM yyyy", { locale: es }).slice(1)}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} data-testid="button-mes-anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} data-testid="button-mes-siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                      dayCitas.slice(0, 3).map((cita) => (
                        <div
                          key={cita.id}
                          className="text-xs p-1 bg-primary/10 rounded border border-primary/20 truncate"
                          data-testid={`cita-${cita.id}`}
                        >
                          <div className="font-medium">{cita.clienteNombre}</div>
                          <div className="text-muted-foreground">
                            {cita.fechaHora ? format(new Date(cita.fechaHora), 'HH:mm') : ''}
                          </div>
                        </div>
                      ))
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
              citasHoy.map((cita) => (
                <Card key={cita.id} className="hover-elevate" data-testid={`card-cita-${cita.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{cita.clienteNombre}</span>
                          <Badge variant={
                            cita.estado === 'confirmada' ? 'default' :
                            cita.estado === 'cancelada' ? 'destructive' :
                            'secondary'
                          }>
                            {cita.estado}
                          </Badge>
                        </div>
                        {cita.vehiculoMatricula && (
                          <p className="text-sm text-muted-foreground">
                            Vehículo: {cita.vehiculoMatricula}
                          </p>
                        )}
                        {cita.fechaHora && (
                          <div className="flex items-center gap-1 mt-2 text-sm">
                            <Clock className="h-3 w-3" />
                            {format(new Date(cita.fechaHora), 'HH:mm', { locale: es })}
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" data-testid={`button-ver-cita-${cita.id}`}>
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
    </div>
  );
}
