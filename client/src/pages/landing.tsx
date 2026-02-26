import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ClipboardList,
  Package,
  FileText,
  BarChart2,
  Users,
  Wrench,
  Car,
  Shield,
  ChevronRight,
  GraduationCap,
  Star,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Gestión de Citas",
    desc: "Agenda visitas y gestiona el calendario del taller con vistas mensual y semanal.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: ClipboardList,
    title: "Órdenes de Reparación",
    desc: "Registra cada trabajo: partes, recambios, tiempos y totales en tiempo real.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Package,
    title: "Control de Stock",
    desc: "Inventario actualizado con alertas automáticas de stock mínimo por artículo.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: FileText,
    title: "Presupuestos y Facturas",
    desc: "Genera presupuestos detallados y facturas con IGIC cumpliendo la normativa canaria.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: BarChart2,
    title: "Informes y Estadísticas",
    desc: "Paneles de datos con gráficos de facturación, órdenes, clientes e inventario.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: Users,
    title: "CRM Posventa",
    desc: "Fideliza clientes con campañas automatizadas y encuestas de satisfacción.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

const highlights = [
  "Ciclo completo Cita → OR → Factura en un clic",
  "Integración CarAPI para datos de vehículos",
  "Gestión de residuos conforme a normativa",
  "Exportación de datos en CSV",
  "Multiusuario con roles y permisos",
  "Modo oscuro y diseño adaptable a tablet",
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* ── NAVEGACIÓN ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-sm">DMS Taller</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sistema de Gestión</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="hidden sm:inline-flex gap-1">
            <GraduationCap className="h-3 w-3" />
            Uso Educativo
          </Badge>
          <Button asChild size="sm" data-testid="button-acceder-nav">
            <Link href="/login">
              Acceder
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Imagen de fondo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1920&q=80')",
          }}
        />
        {/* Dark wash gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

        <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
          <Badge className="mb-6 bg-primary/90 text-white border-0 text-sm px-4 py-1.5 gap-2">
            <GraduationCap className="h-4 w-4" />
            FP Mantenimiento de Vehículos
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Sistema de Gestión
            <br />
            <span className="text-primary">Integral para Talleres</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto mb-10">
            Aprende a gestionar un taller mecánico real: citas, órdenes de reparación, 
            presupuestos, facturas con IGIC y control de inventario, todo en una sola plataforma.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-base px-8"
              data-testid="button-acceder-hero"
            >
              <Link href="/login">
                Acceder a la Plataforma
                <ChevronRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base px-8 bg-white/10 border-white/30 text-white"
              data-testid="button-conocer-mas"
            >
              <a href="#funcionalidades">
                Ver Funcionalidades
              </a>
            </Button>
          </div>

          {/* Estadísticas rápidas */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { val: "6+", label: "Módulos" },
              { val: "20+", label: "Pantallas" },
              { val: "100%", label: "IGIC" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-white">{s.val}</div>
                <div className="text-sm text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/60">
          <div className="w-5 h-8 rounded-full border-2 border-white/40 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-sm px-4 py-1.5">
              Módulos del Sistema
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Todo lo que necesita un taller moderno
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Cada módulo simula los procesos reales de gestión de un concesionario
              o taller de mantenimiento de vehículos.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card
                key={f.title}
                className="hover-elevate border-none shadow-sm"
                data-testid={`card-feature-${f.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl mb-4 ${f.bg}`}>
                    <f.icon className={`h-6 w-6 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMAGEN + HIGHLIGHTS ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <Badge variant="outline" className="mb-4 text-sm px-4 py-1.5 gap-2">
              <Star className="h-3 w-3 fill-current" />
              Características destacadas
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Diseñado para el aprendizaje profesional
            </h2>
            <p className="text-muted-foreground mb-8 text-base leading-relaxed">
              Los alumnos de FP trabajan con un DMS (Sistema de Gestión de Concesionarios)
              real, aprendiendo los procesos administrativos y operativos de un taller
              de mantenimiento de vehículos conforme a la normativa de Canarias.
            </p>
            <ul className="space-y-3 mb-8">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" data-testid="button-acceder-section">
              <Link href="/login">
                Comenzar ahora
                <ChevronRight className="h-5 w-5 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=900&q=80"
                alt="Técnico diagnosticando vehículo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-card border rounded-xl p-4 shadow-lg max-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <Car className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Gestión real</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Flujos completos de trabajo tal como en un taller profesional
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEGUNDA IMAGEN ── */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=900&q=80"
                alt="Mecánico realizando mantenimiento"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-4 -right-4 bg-card border rounded-xl p-4 shadow-lg max-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-sm">Normativa IGIC</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Facturas adaptadas a la normativa fiscal de Canarias
              </p>
            </div>
          </div>

          <div>
            <Badge variant="outline" className="mb-4 text-sm px-4 py-1.5 gap-2">
              <GraduationCap className="h-3 w-3" />
              Contexto educativo
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Aprende con casos prácticos reales
            </h2>
            <p className="text-muted-foreground mb-6 text-base leading-relaxed">
              El sistema replica fielmente los procesos de un taller real: desde la recepción
              del vehículo y la apertura de la orden de reparación, hasta la entrega y
              facturación final al cliente con sus correspondientes impuestos IGIC.
            </p>
            <p className="text-muted-foreground text-base leading-relaxed">
              Los alumnos también aprenden a gestionar compras a proveedores, controlar
              el almacén con ubicaciones y lotes, y cumplir con la normativa de residuos
              de aceites y fluidos del Archipiélago Canario.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        <div className="relative z-10 text-center text-white max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-white/85 text-lg mb-10">
            Accede con las credenciales proporcionadas por tu docente y comienza 
            a practicar la gestión de un taller mecánico profesional.
          </p>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="text-base px-10 bg-white/15 border-white/40 text-white"
            data-testid="button-acceder-cta"
          >
            <Link href="/login">
              Acceder a la Plataforma
              <ChevronRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── PIE DE PÁGINA ── */}
      <footer className="border-t bg-card px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-center sm:text-left max-w-sm">
            <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
            <span>
              Software promovido por el{" "}
              <strong className="text-foreground">
                Departamento de Administración de Empresas
              </strong>{" "}
              del IES Manuel Martín González
            </span>
          </div>
          <div className="flex items-center gap-2 text-center sm:text-right max-w-sm">
            <Wrench className="h-4 w-4 shrink-0" />
            <span>
              Software desarrollado por{" "}
              <strong className="text-foreground">
                [nombre del desarrollador]
              </strong>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
