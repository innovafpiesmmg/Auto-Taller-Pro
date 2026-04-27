import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Calendar,
  Car,
  ClipboardList,
  FileText,
  Wrench,
  CheckCircle2,
  Receipt,
  Wallet,
  HandshakeIcon,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Users,
  Package,
  Clock,
  Camera,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Shield,
  Info,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Phase {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
  optional?: boolean;
  moduleUrl?: string;
  moduleName?: string;
  whenToUse: string;
  steps: { title: string; desc: string; tip?: string }[];
  result: string;
  roles: string[];
}

const phases: Phase[] = [
  {
    id: 1,
    title: "Contacto y Cita Previa",
    subtitle: "El cliente reserva turno",
    icon: Calendar,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-200 dark:border-blue-800",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
    moduleUrl: "/citas",
    moduleName: "Agenda & Citas",
    whenToUse: "Cuando el cliente llama o contacta con antelación para reservar turno.",
    steps: [
      { title: "Abrir Agenda & Citas", desc: "Accede al módulo desde el menú lateral." },
      { title: "Buscar o crear el cliente", desc: "Localiza al cliente en el sistema. Si no existe, créalo en Clientes con nombre, teléfono, email y dirección." },
      { title: "Registrar el vehículo", desc: "Si el vehículo es nuevo, regístralo con matrícula, marca, modelo, VIN y km actuales. El sistema autocompleta marcas y modelos.", tip: "Usa la búsqueda por matrícula para verificar si el vehículo ya existe." },
      { title: "Crear la cita", desc: "Selecciona cliente, vehículo, fecha, hora, duración estimada (30/60/90/120 min) y motivo del trabajo." },
      { title: "Confirmar", desc: "La cita queda en estado Pendiente y aparece en el calendario mensual y semanal." },
    ],
    result: "Cita registrada. Visible en Dashboard bajo 'Citas de Hoy' y 'Citas de Mañana'.",
    roles: ["Recepción", "Jefe de Taller", "Admin"],
  },
  {
    id: 2,
    title: "Recepción Activa del Vehículo",
    subtitle: "El cliente llega al taller",
    icon: Camera,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    badgeClass: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
    moduleUrl: "/citas",
    moduleName: "Agenda & Citas → OR",
    whenToUse: "Cuando el cliente llega al taller, con o sin cita previa.",
    steps: [
      { title: "Localizar la cita", desc: "Busca la cita en el calendario o directamente por el nombre del cliente.", tip: "Si el botón de la cita ya dice 'Ver OR', esa cita ya tiene una orden creada. Haz clic para ir directamente a ella, sin crear duplicados." },
      { title: "Registrar kilometraje de entrada", desc: "Anota el km actual del vehículo en el campo correspondiente de la OR." },
      { title: "Tomar fotos de recepción", desc: "Captura hasta 5 fotografías del estado exterior del vehículo desde la tablet usando la cámara. Las fotos se vinculan a esta OR específica, no al vehículo, preservando el historial de cada visita." },
      { title: "Crear la OR", desc: "Pulsa 'Crear OR' desde la cita. La OR se genera automáticamente en estado Abierta. El botón de la cita cambia a 'Ver OR'." },
    ],
    result: "OR creada en estado Abierta con fotos de recepción vinculadas.",
    roles: ["Recepción", "Jefe de Taller", "Admin"],
  },
  {
    id: 3,
    title: "Presupuesto",
    subtitle: "Aprobación de costes por el cliente",
    icon: FileText,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/40",
    borderColor: "border-violet-200 dark:border-violet-800",
    badgeClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
    optional: true,
    moduleUrl: "/presupuestos",
    moduleName: "Presupuestos",
    whenToUse: "Cuando el coste no es fijo o el cliente necesita aprobar el importe antes de autorizar el trabajo.",
    steps: [
      { title: "Crear el presupuesto", desc: "En el módulo Presupuestos, crea uno nuevo vinculando cliente y vehículo." },
      { title: "Añadir líneas", desc: "Agrega mano de obra (€/hora × horas), artículos o recambios (con precio e IGIC), y otros conceptos. El total se calcula automáticamente." },
      { title: "Presentar al cliente", desc: "Imprime o muestra el presupuesto al cliente con el desglose completo incluido IGIC." },
      { title: "Registrar la decisión", desc: "Si el cliente aprueba: cambia el estado a 'Aprobado'. La OR vinculada se desbloquea. Si rechaza: el presupuesto queda archivado.", tip: "Con un presupuesto vinculado NO aprobado, la OR mostrará un aviso en ámbar y los botones de cambio de estado estarán bloqueados." },
      { title: "Crear OR desde presupuesto", desc: "Una vez aprobado, pulsa 'Crear OR' en el presupuesto. Se establece el enlace bidireccional: la OR muestra el presupuesto vinculado y viceversa." },
    ],
    result: "OR creada y desbloqueada. Enlace bidireccional OR ↔ Presupuesto activo.",
    roles: ["Recepción", "Jefe de Taller", "Admin"],
  },
  {
    id: 4,
    title: "Ejecución del Trabajo",
    subtitle: "El vehículo está en el taller",
    icon: Wrench,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
    moduleUrl: "/ordenes",
    moduleName: "Órdenes de Reparación",
    whenToUse: "Durante el tiempo que el vehículo está en el taller siendo reparado.",
    steps: [
      { title: "Asignar mecánicos", desc: "El jefe de taller abre el detalle de la OR y asigna los mecánicos responsables." },
      { title: "Cambiar estado a 'En proceso'", desc: "Pulsa el botón azul 'En proceso'. La barra de progreso avanza al paso 2." },
      { title: "Añadir Partes de Trabajo (MO)", desc: "Registra cada tarea: descripción, horas empleadas y precio/hora. El total de mano de obra se calcula en tiempo real." },
      { title: "Registrar consumo de artículos", desc: "Añade los recambios y materiales usados. El stock se descuenta automáticamente del almacén.", tip: "Si un artículo no tiene stock suficiente, crea un Pedido de Compra desde el módulo de Compras." },
      { title: "Gestionar esperas", desc: "Si hay que esperar piezas o autorización, cambia el estado a 'A la espera' (botón ámbar). Añade observaciones sobre el motivo." },
    ],
    result: "OR con trabajo registrado. Totales (MO + recambios + IGIC) visibles en tiempo real. El indicador de 'días abierta' avisa si la OR lleva mucho tiempo sin cerrar.",
    roles: ["Mecánico", "Jefe de Taller", "Admin"],
  },
  {
    id: 5,
    title: "Cierre de la Orden de Reparación",
    subtitle: "El trabajo está terminado",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/40",
    borderColor: "border-green-200 dark:border-green-800",
    badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300",
    moduleUrl: "/ordenes",
    moduleName: "Órdenes de Reparación",
    whenToUse: "Cuando el trabajo está terminado y el vehículo está listo para entregar.",
    steps: [
      { title: "Revisar la OR", desc: "Comprueba que todos los partes de trabajo y consumos están registrados correctamente." },
      { title: "Registrar km de salida", desc: "Anota el kilometraje final del vehículo." },
      { title: "Añadir observaciones finales", desc: "Escribe el resumen del trabajo realizado y las recomendaciones para el cliente." },
      { title: "Cambiar estado a 'Terminada'", desc: "Pulsa el botón verde 'Terminada'. La OR aparece inmediatamente en el Dashboard bajo 'Pendientes de Facturar' con un banner en ámbar.", tip: "El botón 'Crear Factura' solo es visible para los roles Admin y Finanzas." },
    ],
    result: "OR cerrada. Aparece en 'Pendientes de Facturar' en el Dashboard.",
    roles: ["Jefe de Taller", "Admin"],
  },
  {
    id: 6,
    title: "Facturación",
    subtitle: "Emisión de la factura con IGIC",
    icon: Receipt,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/40",
    borderColor: "border-orange-200 dark:border-orange-800",
    badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300",
    moduleUrl: "/facturas",
    moduleName: "Facturas",
    whenToUse: "Inmediatamente después de cerrar la OR, o en cualquier momento posterior.",
    steps: [
      { title: "Iniciar facturación", desc: "Desde la OR terminada, desde el Dashboard ('Pendientes de Facturar') o desde la lista de Órdenes, pulsa 'Facturar' o 'Crear Factura'." },
      { title: "Revisar datos precargados", desc: "El sistema precarga el cliente, las líneas de la OR y el IGIC calculado. Verifica que todo es correcto." },
      { title: "Completar la factura", desc: "El número de factura (FAC-YYYY-NNNN) se genera automáticamente. Ajusta la fecha y las líneas si es necesario." },
      { title: "Guardar y emitir", desc: "Guarda la factura. La OR pasa automáticamente a estado 'Facturada'." },
      { title: "Imprimir o compartir", desc: "Usa el botón de vista previa para imprimir la factura con el logo y datos de la empresa.", tip: "El IGIC (Impuesto General Indirecto Canario) se aplica en lugar del IVA peninsular. Los tipos se configuran en el módulo de Configuración." },
    ],
    result: "Factura emitida con número único, desglose IGIC y datos fiscales. OR en estado 'Facturada'.",
    roles: ["Finanzas", "Admin"],
  },
  {
    id: 7,
    title: "Cobro y Caja",
    subtitle: "Registro del pago del cliente",
    icon: Wallet,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
    moduleUrl: "/cobros",
    moduleName: "Cobros & Caja",
    whenToUse: "Cuando el cliente paga la factura, simultáneamente o de forma diferida.",
    steps: [
      { title: "Abrir Cobros", desc: "Accede al módulo de Cobros desde el menú lateral." },
      { title: "Registrar el pago", desc: "Selecciona la factura, indica el importe, el método de pago (efectivo, tarjeta, transferencia, cheque) y la fecha." },
      { title: "Pagos fraccionados", desc: "Si el cliente paga en varias partes, registra múltiples cobros contra la misma factura.", tip: "La factura pasa a estado 'Cobrada' automáticamente cuando el importe acumulado cubre el total." },
      { title: "Arqueo de caja", desc: "Al final del día, el arqueo de caja recoge todos los cobros en efectivo para la conciliación diaria." },
    ],
    result: "Cobro registrado. Factura en estado 'Cobrada'. Caja del día actualizada.",
    roles: ["Finanzas", "Recepción", "Admin"],
  },
  {
    id: 8,
    title: "Entrega del Vehículo",
    subtitle: "El cliente recoge el coche",
    icon: Car,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/40",
    borderColor: "border-teal-200 dark:border-teal-800",
    badgeClass: "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300",
    whenToUse: "Cuando el cliente viene a recoger el vehículo reparado.",
    steps: [
      { title: "Entregar documentación", desc: "Entrega la factura impresa o en formato digital al cliente." },
      { title: "Firma de conformidad", desc: "El cliente firma la conformidad con el trabajo realizado (proceso externo al sistema, en papel o tablet)." },
      { title: "Entrega física del vehículo", desc: "El vehículo sale del taller." },
    ],
    result: "Ciclo completo cerrado. El historial de la visita (OR, fotos de recepción, factura) queda registrado permanentemente.",
    roles: ["Recepción", "Jefe de Taller", "Admin"],
  },
  {
    id: 9,
    title: "Posventa y CRM",
    subtitle: "Fidelización del cliente",
    icon: Megaphone,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/40",
    borderColor: "border-pink-200 dark:border-pink-800",
    badgeClass: "bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300",
    moduleUrl: "/campanas",
    moduleName: "CRM Postventa",
    whenToUse: "Días o semanas después de la entrega, de forma automática o manual.",
    steps: [
      { title: "Encuesta de satisfacción", desc: "El sistema puede enviar automáticamente una encuesta al cliente para valorar el servicio recibido." },
      { title: "Campañas de recordatorio", desc: "Crea campañas para avisar al cliente cuando se acerque la fecha de revisión, ITV u otro servicio periódico." },
      { title: "Emisión de cupones", desc: "Emite cupones de descuento como gesto comercial para fidelizar al cliente y promover la próxima visita." },
    ],
    result: "Cliente fidelizado. Puntuación de satisfacción recogida para informes de calidad.",
    roles: ["Jefe de Taller", "Admin"],
  },
];

const rolesInfo = [
  { rol: "Recepción", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200", tareas: "Citas, recepción activa (km + fotos), gestión de clientes y vehículos, presupuestos, cobros" },
  { rol: "Jefe de Taller", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200", tareas: "Asignación de OR, supervisión del trabajo, cierre de OR, aprobación de presupuestos" },
  { rol: "Mecánico", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200", tareas: "Partes de trabajo (mano de obra), consumo de artículos y recambios" },
  { rol: "Almacén", color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200", tareas: "Control de stock, recepciones de compra, ubicaciones, gestión de residuos" },
  { rol: "Finanzas", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200", tareas: "Facturas (crear/editar/eliminar), cobros y caja, informes económicos" },
  { rol: "Admin", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200", tareas: "Acceso total, configuración del sistema, gestión de usuarios" },
];

const indicators = [
  { icon: FileText, color: "text-blue-600", label: "Badge azul 'Presupuesto' en OR", desc: "La OR tiene un presupuesto vinculado" },
  { icon: AlertTriangle, color: "text-amber-600", label: "Banner ámbar en OR", desc: "Presupuesto vinculado pendiente de aprobar — OR bloqueada hasta que se apruebe" },
  { icon: CheckCircle2, color: "text-green-600", label: "Banner verde 'Pendiente de facturar'", desc: "OR terminada, lista para facturar" },
  { icon: Clock, color: "text-muted-foreground", label: "Días abierta (gris)", desc: "OR con menos de 3 días — situación normal" },
  { icon: Clock, color: "text-amber-600", label: "Días abierta (ámbar)", desc: "OR con 3-6 días abierta — requiere atención" },
  { icon: Clock, color: "text-red-600", label: "Días abierta (rojo)", desc: "OR con 7 o más días abierta — urgente" },
  { icon: ArrowRight, color: "text-green-600", label: "Botón 'Ver OR' en cita", desc: "Ya existe una OR para esa cita — no es posible crear duplicados" },
];

function PhaseCard({ phase, isOpen, onToggle }: { phase: Phase; isOpen: boolean; onToggle: () => void }) {
  const Icon = phase.icon;
  return (
    <div className={cn("rounded-md border", phase.borderColor, isOpen && phase.bgColor)}>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button
            className="w-full text-left"
            data-testid={`button-fase-${phase.id}`}
          >
            <div className={cn("flex items-center gap-4 p-4 rounded-md transition-colors", !isOpen && "hover:bg-muted/50")}>
              <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2", phase.borderColor, isOpen ? phase.bgColor : "bg-background")}>
                <Icon className={cn("h-5 w-5", phase.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-xs font-semibold uppercase tracking-wide", phase.color)}>Fase {phase.id}</span>
                  {phase.optional && (
                    <Badge variant="outline" className="text-xs py-0">Opcional</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-base">{phase.title}</h3>
                <p className="text-sm text-muted-foreground">{phase.subtitle}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {phase.moduleUrl && (
                  <span className={cn("hidden sm:inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium", phase.badgeClass)}>
                    {phase.moduleName}
                  </span>
                )}
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 space-y-4">
            <Separator />

            <div className={cn("rounded-md p-3 text-sm flex items-start gap-2", phase.bgColor, phase.borderColor, "border")}>
              <Info className={cn("h-4 w-4 mt-0.5 shrink-0", phase.color)} />
              <div>
                <span className="font-medium">¿Cuándo se usa? </span>
                {phase.whenToUse}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-1.5">
                <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
                Pasos a seguir
              </h4>
              <ol className="space-y-3">
                {phase.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5", phase.badgeClass)}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                      {step.tip && (
                        <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">{step.tip}</p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 p-3">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-medium">Resultado: </span>
                <span className="text-sm text-muted-foreground">{phase.result}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">Roles:</span>
              {phase.roles.map(r => (
                <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
              ))}
              {phase.moduleUrl && (
                <Button asChild size="sm" variant="outline" className="ml-auto text-xs">
                  <Link href={phase.moduleUrl}>
                    Ir al módulo <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default function Manual() {
  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set());

  const togglePhase = (id: number) => {
    setOpenPhases(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenPhases(new Set(phases.map(p => p.id)));
  const collapseAll = () => setOpenPhases(new Set());

  return (
    <div className="max-w-4xl mx-auto space-y-8" data-testid="page-manual">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Manual de Uso</h1>
          </div>
          <p className="text-muted-foreground">
            Flujo administrativo del taller — del cliente a la entrega del vehículo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll} data-testid="button-expand-all">
            Expandir todo
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} data-testid="button-collapse-all">
            Colapsar todo
          </Button>
        </div>
      </div>

      {/* Resumen visual del flujo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visión general del flujo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-1">
            {phases.map((phase, i) => {
              const Icon = phase.icon;
              return (
                <div key={phase.id} className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      togglePhase(phase.id);
                      document.getElementById(`fase-${phase.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium border transition-colors hover-elevate",
                      phase.borderColor,
                      phase.bgColor
                    )}
                    data-testid={`button-flow-fase-${phase.id}`}
                  >
                    <Icon className={cn("h-3.5 w-3.5", phase.color)} />
                    <span className={phase.color}>{phase.id}. {phase.title}</span>
                    {phase.optional && <span className="opacity-60">(opt.)</span>}
                  </button>
                  {i < phases.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Fases */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Fases del proceso</h2>
        <p className="text-sm text-muted-foreground">
          Haz clic en cada fase para ver los pasos detallados y acceder al módulo correspondiente.
        </p>
        <div className="space-y-2">
          {phases.map(phase => (
            <div key={phase.id} id={`fase-${phase.id}`}>
              <PhaseCard
                phase={phase}
                isOpen={openPhases.has(phase.id)}
                onToggle={() => togglePhase(phase.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Indicadores visuales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Indicadores visuales del sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {indicators.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <div key={i} className="flex items-start gap-3 rounded-md border p-3">
                  <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", ind.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ind.label}</p>
                    <p className="text-sm text-muted-foreground">{ind.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Módulos por fase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            Módulos del sistema por fase
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-6">Fase</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Módulo principal</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Módulos de apoyo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { fase: 1, nombre: "Cita", principal: "Agenda & Citas", apoyo: "Clientes, Vehículos", url: "/citas" },
                  { fase: 2, nombre: "Recepción", principal: "Órdenes de Reparación", apoyo: "Clientes, Vehículos", url: "/ordenes" },
                  { fase: 3, nombre: "Presupuesto", principal: "Presupuestos", apoyo: "Clientes, Vehículos, Artículos", url: "/presupuestos" },
                  { fase: 4, nombre: "Trabajo", principal: "Órdenes de Reparación", apoyo: "Almacén, Artículos, Compras", url: "/ordenes" },
                  { fase: 5, nombre: "Cierre OR", principal: "Órdenes de Reparación", apoyo: "—", url: "/ordenes" },
                  { fase: 6, nombre: "Factura", principal: "Facturas", apoyo: "Órdenes de Reparación", url: "/facturas" },
                  { fase: 7, nombre: "Cobro", principal: "Cobros & Caja", apoyo: "Facturas", url: "/cobros" },
                  { fase: 8, nombre: "Entrega", principal: "—", apoyo: "—", url: null },
                  { fase: 9, nombre: "Posventa", principal: "CRM (Campañas, Encuestas, Cupones)", apoyo: "Clientes", url: "/campanas" },
                ].map(row => (
                  <tr key={row.fase} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground font-medium">{row.fase}</td>
                    <td className="px-4 py-2.5 font-medium">{row.nombre}</td>
                    <td className="px-4 py-2.5">
                      {row.url ? (
                        <Link href={row.url} className="text-primary hover:underline inline-flex items-center gap-1">
                          {row.principal}
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{row.principal}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{row.apoyo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Roles y responsabilidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {rolesInfo.map(r => (
              <div key={r.rol} className="flex items-start gap-3 rounded-md border p-3">
                <Users className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div>
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mb-1", r.color)}>
                    {r.rol}
                  </span>
                  <p className="text-sm text-muted-foreground">{r.tareas}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pb-4">
        DMS Taller Mecánico — Manual de uso actualizado en Abril 2026
      </div>
    </div>
  );
}
