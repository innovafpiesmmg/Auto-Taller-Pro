import { useState, type ElementType } from "react";
import { 
  BarChart2,
  Calendar,
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  FileText,
  Package,
  Receipt,
  Wallet,
  Settings,
  Building,
  ShoppingCart,
  PackageCheck,
  MapPin,
  Megaphone,
  ClipboardList as ClipboardListIcon,
  Ticket,
  Recycle,
  Trash2,
  BookOpen,
  Truck,
  Shield,
  ChevronDown,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Agenda & Citas", url: "/citas", icon: Calendar },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Vehículos", url: "/vehiculos", icon: Car },
  { title: "Órdenes de Reparación", url: "/ordenes", icon: ClipboardList },
  { title: "Presupuestos", url: "/presupuestos", icon: FileText },
  { title: "Artículos", url: "/articulos", icon: Package },
  { title: "Facturación", url: "/facturas", icon: Receipt },
  { title: "Cobros & Caja", url: "/cobros", icon: Wallet },
  { title: "Informes & Estadísticas", url: "/informes", icon: BarChart2 },
];

const comprasAlmacenItems = [
  { title: "Proveedores", url: "/proveedores", icon: Building },
  { title: "Pedidos de Compra", url: "/pedidos-compra", icon: ShoppingCart },
  { title: "Recepciones", url: "/recepciones", icon: PackageCheck },
  { title: "Ubicaciones", url: "/ubicaciones", icon: MapPin },
];

const crmPostventaItems = [
  { title: "Campañas", url: "/campanas", icon: Megaphone },
  { title: "Encuestas", url: "/encuestas", icon: ClipboardListIcon },
  { title: "Cupones", url: "/cupones", icon: Ticket },
];

const gestionResiduosItems = [
  { title: "Catálogo de Residuos", url: "/catalogo-residuos", icon: BookOpen },
  { title: "Contenedores", url: "/contenedores-residuos", icon: Trash2 },
  { title: "Gestores Autorizados", url: "/gestores-residuos", icon: Truck },
  { title: "Registros", url: "/registros-residuos", icon: ClipboardList },
  { title: "Documentos DI", url: "/documentos-di", icon: FileText },
  { title: "Recogidas", url: "/recogidas-residuos", icon: Recycle },
];

const configuracionItems = [
  { title: "Usuarios", url: "/usuarios", icon: Shield },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

interface CollapsibleSectionProps {
  label: string;
  items: { title: string; url: string; icon: ElementType }[];
  location: string;
  defaultOpen?: boolean;
  testIdPrefix?: string;
}

function CollapsibleSection({ label, items, location, defaultOpen = true, testIdPrefix }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <SidebarGroup>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel
            className="flex w-full cursor-pointer items-center justify-between hover:text-foreground transition-colors"
            data-testid={testIdPrefix ? `button-toggle-${testIdPrefix}` : undefined}
          >
            <span>{label}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                !open && "-rotate-90"
              )}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const [location] = useLocation();

  const { data: configEmpresa } = useQuery<ConfigEmpresa | null>({
    queryKey: ["/api/config/empresa"],
    staleTime: 1000 * 60 * 5,
  });

  const nombreEmpresa = configEmpresa?.nombreEmpresa || "DMS Taller";
  const logoUrl = configEmpresa?.logoUrl?.trim() || null;

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <div className="flex h-10 w-10 items-center justify-center">
              <img
                src={logoUrl}
                alt={nombreEmpresa}
                className="h-10 w-10 object-contain"
                data-testid="img-logo-empresa"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="flex h-10 w-10 items-center justify-center rounded-md bg-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-primary-foreground"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg></div>`;
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <Settings className="h-6 w-6 text-primary-foreground" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold" data-testid="text-nombre-empresa">{nombreEmpresa}</h2>
            <p className="text-xs text-muted-foreground">Sistema de Gestión</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <CollapsibleSection
          label="Navegación"
          items={menuItems}
          location={location}
          defaultOpen={true}
          testIdPrefix="navegacion"
        />
        <CollapsibleSection
          label="Compras & Almacén"
          items={comprasAlmacenItems}
          location={location}
          defaultOpen={true}
          testIdPrefix="compras"
        />
        <CollapsibleSection
          label="CRM Postventa"
          items={crmPostventaItems}
          location={location}
          defaultOpen={false}
          testIdPrefix="crm"
        />
        <CollapsibleSection
          label="Gestión de Residuos"
          items={gestionResiduosItems}
          location={location}
          defaultOpen={false}
          testIdPrefix="residuos"
        />
        <CollapsibleSection
          label="Configuración"
          items={configuracionItems}
          location={location}
          defaultOpen={false}
          testIdPrefix="configuracion"
        />
      </SidebarContent>
    </Sidebar>
  );
}
