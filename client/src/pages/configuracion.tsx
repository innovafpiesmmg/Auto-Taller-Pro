import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CarAPIConfig {
  isConfigured: boolean;
  hasToken: boolean;
  hasSecret: boolean;
}

export default function Configuracion() {
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");

  const { data: config, isLoading } = useQuery<CarAPIConfig>({
    queryKey: ["/api/config/carapi"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { token: string; secret: string }) => {
      return await apiRequest("/api/config/carapi", {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "Las credenciales de CarAPI se han guardado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/config/carapi"] });
      setToken("");
      setSecret("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar la configuración",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !secret) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, completa todos los campos",
      });
      return;
    }

    saveMutation.mutate({ token, secret });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-config" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="title-configuracion">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Administra las integraciones y configuraciones del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Integración CarAPI</CardTitle>
              <CardDescription>
                Configuración de credenciales para acceder a datos de vehículos
              </CardDescription>
            </div>
            <div data-testid="status-carapi">
              {config?.isConfigured ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Configurado</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <XCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">No configurado</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <p className="mb-2">
                <strong>CarAPI</strong> proporciona acceso a datos de 90,000+ vehículos con especificaciones técnicas, 
                marcas, modelos, y decodificación VIN.
              </p>
              <p className="mb-2">
                <strong>Modo Gratuito:</strong> Sin configuración, acceso limitado a Ford y Toyota 2020
              </p>
              <p>
                <strong>Modo Premium:</strong> Con credenciales, acceso completo a todos los vehículos
              </p>
            </AlertDescription>
          </Alert>

          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold mb-3">Cómo obtener credenciales:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Regístrate en <a href="https://carapi.app/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">carapi.app/register</a></li>
              <li>Ve a tu dashboard</li>
              <li>Genera un <strong>API Token</strong> y un <strong>API Secret</strong></li>
              <li>Ingresa las credenciales abajo</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="carapi-token">API Token</Label>
              <Input
                id="carapi-token"
                data-testid="input-carapi-token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Ingresa tu API Token"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carapi-secret">API Secret</Label>
              <Input
                id="carapi-secret"
                data-testid="input-carapi-secret"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Ingresa tu API Secret"
              />
            </div>

            <Button
              type="submit"
              data-testid="button-save-carapi"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
