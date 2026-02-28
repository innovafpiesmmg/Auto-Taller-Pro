import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  observacion?: string;
}

interface RecepcionPrintProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orden: {
    id: number;
    codigo: string;
    fechaApertura: string | Date;
    kmEntrada?: number | null;
    observaciones?: string | null;
    checklistRecepcion?: string | null;
    firmaDigital?: string | null;
    fotosRecepcion?: string | null;
    clienteNombre?: string;
    clienteNif?: string;
    clienteTelefono?: string;
    vehiculoMatricula?: string;
    vehiculoMarca?: string;
    vehiculoModelo?: string;
    vehiculoAnio?: number;
    recepcionadoPorNombre?: string;
  };
}

interface EmpresaConfig {
  nombreEmpresa: string;
  cif?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logoUrl?: string;
}

export function RecepcionPrint({ open, onOpenChange, orden }: RecepcionPrintProps) {
  const { data: empresa } = useQuery<EmpresaConfig>({
    queryKey: ["/api/config/empresa"],
  });

  const checklist: ChecklistItem[] = (() => {
    try { return JSON.parse(orden.checklistRecepcion || "[]"); }
    catch { return []; }
  })();

  const fotos: string[] = (() => {
    try { return JSON.parse(orden.fotosRecepcion || "[]"); }
    catch { return []; }
  })();

  const fecha = orden.fechaApertura
    ? format(new Date(orden.fechaApertura), "dd 'de' MMMM 'de' yyyy", { locale: es })
    : "-";

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print-show" aria-describedby={undefined}>
        <DialogHeader className="print-hide">
          <DialogTitle>Documento de Recepción</DialogTitle>
        </DialogHeader>

        <div className="print-hide flex justify-end mb-2">
          <Button onClick={handlePrint} data-testid="button-imprimir-recepcion">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>

        <div id="recepcion-print-content" className="p-4 space-y-5 text-sm">
          <div className="flex items-start justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              {empresa?.logoUrl && (
                <img src={empresa.logoUrl} alt="Logo" className="h-14 object-contain" />
              )}
              <div>
                <h2 className="text-lg font-bold">{empresa?.nombreEmpresa || "Taller"}</h2>
                {empresa?.cif && <p className="text-muted-foreground">CIF: {empresa.cif}</p>}
                {empresa?.direccion && <p className="text-muted-foreground">{empresa.direccion}</p>}
                {empresa?.telefono && <p className="text-muted-foreground">Tel: {empresa.telefono}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">RECEPCIÓN DE VEHÍCULO</p>
              <p className="text-muted-foreground font-mono">{orden.codigo}</p>
              <p className="text-muted-foreground">{fecha}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 border-b pb-1">Datos del Cliente</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="text-muted-foreground w-28 py-0.5">Nombre</td><td className="font-medium">{orden.clienteNombre || "-"}</td></tr>
                  <tr><td className="text-muted-foreground py-0.5">NIF/CIF</td><td className="font-medium">{orden.clienteNif || "-"}</td></tr>
                  <tr><td className="text-muted-foreground py-0.5">Teléfono</td><td className="font-medium">{orden.clienteTelefono || "-"}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="font-semibold mb-2 border-b pb-1">Datos del Vehículo</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="text-muted-foreground w-28 py-0.5">Matrícula</td><td className="font-medium font-mono">{orden.vehiculoMatricula || "-"}</td></tr>
                  <tr><td className="text-muted-foreground py-0.5">Marca/Modelo</td><td className="font-medium">{orden.vehiculoMarca} {orden.vehiculoModelo}</td></tr>
                  <tr><td className="text-muted-foreground py-0.5">Año</td><td className="font-medium">{orden.vehiculoAnio || "-"}</td></tr>
                  <tr><td className="text-muted-foreground py-0.5">Km entrada</td><td className="font-medium">{orden.kmEntrada?.toLocaleString('es-ES') || "-"}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 border-b pb-1">Recepcionado por</h3>
            <p className="font-medium">{orden.recepcionadoPorNombre || "—"}</p>
          </div>

          {orden.observaciones && (
            <div>
              <h3 className="font-semibold mb-2 border-b pb-1">Motivo / Observaciones</h3>
              <p className="bg-muted/30 rounded p-2">{orden.observaciones}</p>
            </div>
          )}

          {checklist.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 border-b pb-1">Checklist de Estado del Vehículo</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 py-0.5">
                    <div className={`mt-0.5 w-4 h-4 flex-shrink-0 border rounded flex items-center justify-center text-xs ${item.checked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}`}>
                      {item.checked && "✓"}
                    </div>
                    <div>
                      <span className={item.checked ? "font-medium" : "text-muted-foreground"}>{item.label}</span>
                      {item.observacion && (
                        <span className="text-muted-foreground italic ml-1">— {item.observacion}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fotos.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 border-b pb-1">Fotos de Recepción</h3>
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((foto, i) => (
                  <img
                    key={i}
                    src={foto}
                    alt={`Foto ${i + 1}`}
                    className="w-full rounded border object-cover aspect-video"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 pt-4">
            <div>
              <h3 className="font-semibold mb-3 border-b pb-1">Firma del Cliente</h3>
              {orden.firmaDigital ? (
                <img
                  src={orden.firmaDigital}
                  alt="Firma del cliente"
                  className="border rounded bg-white h-24 w-full object-contain"
                />
              ) : (
                <div className="border rounded h-24 bg-white flex items-end justify-center pb-1">
                  <p className="text-xs text-muted-foreground">Firma del cliente</p>
                </div>
              )}
              <p className="text-center text-xs text-muted-foreground mt-1">
                {orden.clienteNombre || "Cliente"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3 border-b pb-1">Firma del Recepcionista</h3>
              <div className="border rounded h-24 bg-white flex items-end justify-center pb-1">
                <p className="text-xs text-muted-foreground">Firma del recepcionista</p>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-1">
                {orden.recepcionadoPorNombre || "Recepcionista"}
              </p>
            </div>
          </div>

          <div className="border-t pt-3 text-xs text-muted-foreground text-center">
            <p>El cliente declara haber entregado el vehículo en las condiciones descritas en el presente documento y autoriza la realización de los trabajos indicados.</p>
            <p className="mt-1">{empresa?.nombreEmpresa} — {empresa?.direccion} — {empresa?.telefono}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
