import { 
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
  Shield
} from "lucide-react";
import { Link, useLocation } from "wouter";
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

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Agenda & Citas",
    url: "/citas",
    icon: Calendar,
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
  },
  {
    title: "Vehículos",
    url: "/vehiculos",
    icon: Car,
  },
  {
    title: "Órdenes de Reparación",
    url: "/ordenes",
    icon: ClipboardList,
  },
  {
    title: "Presupuestos",
    url: "/presupuestos",
    icon: FileText,
  },
  {
    title: "Artículos",
    url: "/articulos",
    icon: Package,
  },
  {
    title: "Facturación",
    url: "/facturas",
    icon: Receipt,
  },
  {
    title: "Cobros & Caja",
    url: "/cobros",
    icon: Wallet,
  },
];

const comprasAlmacenItems = [
  {
    title: "Proveedores",
    url: "/proveedores",
    icon: Building,
  },
  {
    title: "Pedidos de Compra",
    url: "/pedidos-compra",
    icon: ShoppingCart,
  },
  {
    title: "Recepciones",
    url: "/recepciones",
    icon: PackageCheck,
  },
  {
    title: "Ubicaciones",
    url: "/ubicaciones",
    icon: MapPin,
  },
];

const crmPostventaItems = [
  {
    title: "Campañas",
    url: "/campanas",
    icon: Megaphone,
  },
  {
    title: "Encuestas",
    url: "/encuestas",
    icon: ClipboardListIcon,
  },
  {
    title: "Cupones",
    url: "/cupones",
    icon: Ticket,
  },
];

const gestionResiduosItems = [
  {
    title: "Catálogo de Residuos",
    url: "/catalogo-residuos",
    icon: BookOpen,
  },
  {
    title: "Contenedores",
    url: "/contenedores-residuos",
    icon: Trash2,
  },
  {
    title: "Gestores Autorizados",
    url: "/gestores-residuos",
    icon: Truck,
  },
  {
    title: "Registros",
    url: "/registros-residuos",
    icon: ClipboardList,
  },
  {
    title: "Documentos DI",
    url: "/documentos-di",
    icon: FileText,
  },
  {
    title: "Recogidas",
    url: "/recogidas-residuos",
    icon: Recycle,
  },
];

const configuracionItems = [
  {
    title: "Usuarios",
    url: "/usuarios",
    icon: Shield,
  },
  {
    title: "Configuración",
    url: "/configuracion",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Settings className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">DMS Taller</h2>
            <p className="text-xs text-muted-foreground">Sistema de Gestión</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Compras & Almacén</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {comprasAlmacenItems.map((item) => (
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
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>CRM Postventa</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {crmPostventaItems.map((item) => (
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
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestión de Residuos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {gestionResiduosItems.map((item) => (
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
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configuracionItems.map((item) => (
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
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
