import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Citas() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

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
                    {/* Aquí se mostrarán las citas del día */}
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
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay citas programadas para hoy</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
