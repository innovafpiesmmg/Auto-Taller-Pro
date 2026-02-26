import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { GlobalSearch } from "@/components/global-search";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Usuarios from "@/pages/usuarios";
import Clientes from "@/pages/clientes";
import Vehiculos from "@/pages/vehiculos";
import Citas from "@/pages/citas";
import Ordenes from "@/pages/ordenes";
import Presupuestos from "@/pages/presupuestos";
import Articulos from "@/pages/articulos";
import Facturas from "@/pages/facturas";
import Cobros from "@/pages/cobros";
import OrdenDetalle from "@/pages/orden-detalle";
import Proveedores from "@/pages/proveedores";
import PedidosCompra from "@/pages/pedidos-compra";
import Recepciones from "@/pages/recepciones";
import Ubicaciones from "@/pages/ubicaciones";
import Campanas from "@/pages/campanas";
import Encuestas from "@/pages/encuestas";
import Cupones from "@/pages/cupones";
import CatalogoResiduos from "@/pages/catalogo-residuos";
import ContenedoresResiduos from "@/pages/contenedores-residuos";
import GestoresResiduos from "@/pages/gestores-residuos";
import RegistrosResiduos from "@/pages/registros-residuos";
import DocumentosDI from "@/pages/documentos-di";
import RecogidasResiduos from "@/pages/recogidas-residuos";
import Informes from "@/pages/informes";
import Configuracion from "@/pages/configuracion";
import Landing from "@/pages/landing";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

function ProtectedRouter() {
  const { isAuthenticated, logout, user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const publicRoutes = ["/", "/login"];
    if (!isAuthenticated && !publicRoutes.includes(location)) {
      setLocation("/login");
    } else if (isAuthenticated && (location === "/login" || location === "/")) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, location, setLocation]);

  if (!isAuthenticated) {
    if (location === "/") return <Landing />;
    return <Login />;
  }

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3.5rem",
  } as React.CSSProperties;

  const defaultOpen = typeof window !== "undefined" && window.innerWidth >= 1280;

  return (
    <SidebarProvider style={sidebarStyle} defaultOpen={defaultOpen}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <header className="flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-3 border-b bg-background shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="shrink-0" />
            <div className="flex-1 flex justify-center min-w-0">
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-1 lg:gap-3 shrink-0">
              <div className="text-sm text-muted-foreground hidden xl:block whitespace-nowrap">
                {user?.nombre} · <span className="capitalize">{user?.rol?.replace('_', ' ')}</span>
              </div>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                data-testid="button-logout"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <Switch>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/usuarios" component={Usuarios} />
              <Route path="/clientes" component={Clientes} />
              <Route path="/vehiculos" component={Vehiculos} />
              <Route path="/citas" component={Citas} />
              <Route path="/ordenes" component={Ordenes} />
              <Route path="/ordenes/:id" component={OrdenDetalle} />
              <Route path="/presupuestos" component={Presupuestos} />
              <Route path="/articulos" component={Articulos} />
              <Route path="/facturas" component={Facturas} />
              <Route path="/cobros" component={Cobros} />
              <Route path="/proveedores" component={Proveedores} />
              <Route path="/pedidos-compra" component={PedidosCompra} />
              <Route path="/recepciones" component={Recepciones} />
              <Route path="/ubicaciones" component={Ubicaciones} />
              <Route path="/campanas" component={Campanas} />
              <Route path="/encuestas" component={Encuestas} />
              <Route path="/cupones" component={Cupones} />
              <Route path="/catalogo-residuos" component={CatalogoResiduos} />
              <Route path="/contenedores-residuos" component={ContenedoresResiduos} />
              <Route path="/gestores-residuos" component={GestoresResiduos} />
              <Route path="/registros-residuos" component={RegistrosResiduos} />
              <Route path="/documentos-di" component={DocumentosDI} />
              <Route path="/recogidas-residuos" component={RecogidasResiduos} />
              <Route path="/informes" component={Informes} />
              <Route path="/configuracion" component={Configuracion} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <ProtectedRouter />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
