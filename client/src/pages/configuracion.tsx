import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Save, Building2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

interface CarAPIConfig {
  isConfigured: boolean;
  hasToken: boolean;
  hasSecret: boolean;
}

interface ConfigEmpresa {
  id: number;
  nombreEmpresa: string;
  cifNif: string | null;
  direccion: string | null;
  codigoPostal: string | null;
  ciudad: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  web: string | null;
  logoUrl: string | null;
  colorPrimario: string | null;
  updatedAt: string;
}

export default function Configuracion() {
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");

  // Estado para configuración de empresa
  const [empresaForm, setEmpresaForm] = useState({
    nombreEmpresa: "",
    cifNif: "",
    direccion: "",
    codigoPostal: "",
    ciudad: "",
    provincia: "",
    telefono: "",
    email: "",
    web: "",
    logoUrl: "",
    colorPrimario: "",
  });

  const { data: config, isLoading } = useQuery<CarAPIConfig>({
    queryKey: ["/api/config/carapi"],
  });

  const { data: configEmpresa, isLoading: isLoadingEmpresa } = useQuery<ConfigEmpresa | null>({
    queryKey: ["/api/config/empresa"],
  });

  // Cargar datos de empresa cuando estén disponibles
  useEffect(() => {
    if (configEmpresa) {
      setEmpresaForm({
        nombreEmpresa: configEmpresa.nombreEmpresa || "",
        cifNif: configEmpresa.cifNif || "",
        direccion: configEmpresa.direccion || "",
        codigoPostal: configEmpresa.codigoPostal || "",
        ciudad: configEmpresa.ciudad || "",
        provincia: configEmpresa.provincia || "",
        telefono: configEmpresa.telefono || "",
        email: configEmpresa.email || "",
        web: configEmpresa.web || "",
        logoUrl: configEmpresa.logoUrl || "",
        colorPrimario: configEmpresa.colorPrimario || "",
      });
    }
  }, [configEmpresa]);

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

  const saveEmpresaMutation = useMutation({
    mutationFn: async (data: typeof empresaForm) => {
      return await apiRequest("/api/config/empresa", {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "La configuración de empresa se ha guardado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/config/empresa"] });
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

  const handleEmpresaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!empresaForm.nombreEmpresa) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre de la empresa es requerido",
      });
      return;
    }

    saveEmpresaMutation.mutate(empresaForm);
  };

  if (isLoading || isLoadingEmpresa) {
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Configuración de Empresa</CardTitle>
              <CardDescription>
                Personaliza el logo, nombre y datos de tu empresa
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmpresaSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombreEmpresa">Nombre de la Empresa *</Label>
                <Input
                  id="nombreEmpresa"
                  data-testid="input-nombre-empresa"
                  type="text"
                  value={empresaForm.nombreEmpresa}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, nombreEmpresa: e.target.value })}
                  placeholder="Mi Taller Mecánico"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cifNif">CIF/NIF</Label>
                <Input
                  id="cifNif"
                  data-testid="input-cif-nif"
                  type="text"
                  value={empresaForm.cifNif}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, cifNif: e.target.value })}
                  placeholder="B12345678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL del Logo</Label>
              <Input
                id="logoUrl"
                data-testid="input-logo-url"
                type="url"
                value={empresaForm.logoUrl}
                onChange={(e) => setEmpresaForm({ ...empresaForm, logoUrl: e.target.value })}
                placeholder="https://ejemplo.com/logo.png"
              />
              {empresaForm.logoUrl && (
                <div className="mt-2 p-2 border rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Vista previa:</p>
                  <img 
                    src={empresaForm.logoUrl} 
                    alt="Logo preview" 
                    className="h-16 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Textarea
                id="direccion"
                data-testid="input-direccion"
                value={empresaForm.direccion}
                onChange={(e) => setEmpresaForm({ ...empresaForm, direccion: e.target.value })}
                placeholder="Calle Principal, 123"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigoPostal">Código Postal</Label>
                <Input
                  id="codigoPostal"
                  data-testid="input-codigo-postal"
                  type="text"
                  value={empresaForm.codigoPostal}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, codigoPostal: e.target.value })}
                  placeholder="35001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  data-testid="input-ciudad"
                  type="text"
                  value={empresaForm.ciudad}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, ciudad: e.target.value })}
                  placeholder="Las Palmas de Gran Canaria"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  data-testid="input-provincia"
                  type="text"
                  value={empresaForm.provincia}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, provincia: e.target.value })}
                  placeholder="Las Palmas"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  data-testid="input-telefono"
                  type="tel"
                  value={empresaForm.telefono}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, telefono: e.target.value })}
                  placeholder="+34 928 123 456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  data-testid="input-email-empresa"
                  type="email"
                  value={empresaForm.email}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, email: e.target.value })}
                  placeholder="info@mitaller.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="web">Sitio Web</Label>
                <Input
                  id="web"
                  data-testid="input-web"
                  type="url"
                  value={empresaForm.web}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, web: e.target.value })}
                  placeholder="https://www.mitaller.com"
                />
              </div>
            </div>

            <Button
              type="submit"
              data-testid="button-save-empresa"
              disabled={saveEmpresaMutation.isPending}
            >
              {saveEmpresaMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Configuración de Empresa
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
