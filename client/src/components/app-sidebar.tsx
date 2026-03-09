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
import { useAuth } from "@/lib/auth";
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

interface NavItem {
  title: string;
  url: string;
  icon: ElementType;
  roles?: string[];
}

const ALL_ROLES = ["admin", "jefe_taller", "recepcion", "mecanico", "almacen", "finanzas"];

const menuItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Agenda & Citas", url: "/citas", icon: Calendar, roles: ["admin", "jefe_taller", "recepcion"] },
  { title: "Clientes", url: "/clientes", icon: Users, roles: ["admin", "jefe_taller", "recepcion", "finanzas"] },
  { title: "Vehículos", url: "/vehiculos", icon: Car, roles: ["admin", "jefe_taller", "recepcion", "mecanico"] },
  { title: "Órdenes de Reparación", url: "/ordenes", icon: ClipboardList, roles: ["admin", "jefe_taller", "recepcion", "mecanico"] },
  { title: "Presupuestos", url: "/presupuestos", icon: FileText, roles: ["admin", "jefe_taller", "recepcion"] },
  { title: "Artículos", url: "/articulos", icon: Package, roles: ["admin", "jefe_taller", "almacen", "mecanico"] },
  { title: "Facturación", url: "/facturas", icon: Receipt, roles: ["admin", "jefe_taller", "finanzas"] },
  { title: "Cobros & Caja", url: "/cobros", icon: Wallet, roles: ["admin", "jefe_taller", "finanzas"] },
  { title: "Informes & Estadísticas", url: "/informes", icon: BarChart2, roles: ["admin", "jefe_taller", "finanzas"] },
];

const comprasAlmacenItems: NavItem[] = [
  { title: "Proveedores", url: "/proveedores", icon: Building, roles: ["admin", "jefe_taller", "almacen"] },
  { title: "Pedidos de Compra", url: "/pedidos-compra", icon: ShoppingCart, roles: ["admin", "jefe_taller", "almacen"] },
  { title: "Recepciones", url: "/recepciones", icon: PackageCheck, roles: ["admin", "jefe_taller", "almacen"] },
  { title: "Ubicaciones", url: "/ubicaciones", icon: MapPin, roles: ["admin", "jefe_taller", "almacen"] },
];

const crmPostventaItems: NavItem[] = [
  { title: "Campañas", url: "/campanas", icon: Megaphone, roles: ["admin", "jefe_taller"] },
  { title: "Encuestas", url: "/encuestas", icon: ClipboardListIcon, roles: ["admin", "jefe_taller"] },
  { title: "Cupones", url: "/cupones", icon: Ticket, roles: ["admin", "jefe_taller", "recepcion"] },
];

const gestionResiduosItems: NavItem[] = [
  { title: "Catálogo de Residuos", url: "/catalogo-residuos", icon: BookOpen, roles: ["admin", "jefe_taller", "almacen"] },
  { title: "Contenedores", url: "/contenedores-residuos", icon: Trash2, roles: ["admin", "jefe_taller", "almacen"] },
  { title: "Gestores Autorizados", url: "/gestores-residuos", icon: Truck, roles: ["admin", "jefe_taller"] },
  { title: "Registros", url: "/registros-residuos", icon: ClipboardList, roles: ["admin", "jefe_taller", "almacen"] },
  { title: "Documentos DI", url: "/documentos-di", icon: FileText, roles: ["admin", "jefe_taller"] },
  { title: "Recogidas", url: "/recogidas-residuos", icon: Recycle, roles: ["admin", "jefe_taller", "almacen"] },
];

const configuracionItems: NavItem[] = [
  { title: "Usuarios", url: "/usuarios", icon: Shield, roles: ["admin"] },
  { title: "Configuración", url: "/configuracion", icon: Settings, roles: ["admin", "jefe_taller"] },
];

function hasAccess(item: NavItem, userRoles: string[]): boolean {
  if (!item.roles) return true;
  if (userRoles.includes("admin")) return true;
  return item.roles.some(r => userRoles.includes(r));
}

interface CollapsibleSectionProps {
  label: string;
  items: NavItem[];
  location: string;
  defaultOpen?: boolean;
  testIdPrefix?: string;
  userRoles: string[];
}

function CollapsibleSection({ label, items, location, defaultOpen = true, testIdPrefix, userRoles }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const visibleItems = items.filter(item => hasAccess(item, userRoles));

  if (visibleItems.length === 0) return null;

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
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    size="default"
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className="py-2.5 md:py-3"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{item.title}</span>
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
  const { user } = useAuth();
  const userRoles = user?.roles || [];

  const { data: configEmpresa } = useQuery<ConfigEmpresa | null>({
    queryKey: ["/api/config/empresa"],
    staleTime: 1000 * 60 * 5,
  });

  const nombreEmpresa = configEmpresa?.nombreEmpresa || "DMS Taller";
  const logoUrl = configEmpresa?.logoUrl?.trim() || null;

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-6">
        <a href="/" className="flex items-center gap-3 rounded-md p-1 -m-1 transition-opacity hover:opacity-80" data-testid="link-landing-logo">
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
        </a>
      </SidebarHeader>

      <SidebarContent>
        <CollapsibleSection
          label="Navegación"
          items={menuItems}
          location={location}
          defaultOpen={true}
          testIdPrefix="navegacion"
          userRoles={userRoles}
        />
        <CollapsibleSection
          label="Compras & Almacén"
          items={comprasAlmacenItems}
          location={location}
          defaultOpen={true}
          testIdPrefix="compras"
          userRoles={userRoles}
        />
        <CollapsibleSection
          label="CRM Postventa"
          items={crmPostventaItems}
          location={location}
          defaultOpen={false}
          testIdPrefix="crm"
          userRoles={userRoles}
        />
        <CollapsibleSection
          label="Gestión de Residuos"
          items={gestionResiduosItems}
          location={location}
          defaultOpen={false}
          testIdPrefix="residuos"
          userRoles={userRoles}
        />
        <CollapsibleSection
          label="Configuración"
          items={configuracionItems}
          location={location}
          defaultOpen={false}
          testIdPrefix="configuracion"
          userRoles={userRoles}
        />
      </SidebarContent>
    </Sidebar>
  );
}
