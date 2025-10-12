import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
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
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

function ProtectedRouter() {
  const { isAuthenticated, logout, user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated && location !== "/login") {
      setLocation("/login");
    } else if (isAuthenticated && location === "/login") {
      setLocation("/");
    }
  }, [isAuthenticated, location, setLocation]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {user?.nombre} ({user?.rol})
              </div>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                data-testid="button-logout"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Switch>
              <Route path="/" component={Dashboard} />
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
