import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
        {estados.map((estado) => (
          <Card key={estado}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={estadoColors[estado]}>
                    {estadoLabels[estado]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">0 órdenes</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="space-y-3 min-h-32" 
                data-testid={`list-ordenes-${estado}`}
              >
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <p>No hay órdenes en este estado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
}
