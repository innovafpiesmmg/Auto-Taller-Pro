import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import type { Factura, Cliente, LineaFactura, ConfigEmpresa } from "@shared/schema";
import { format } from "date-fns";

interface FacturaPrintProps {
  factura: Factura & { lineas?: LineaFactura[] };
  cliente?: Cliente;
  empresa?: ConfigEmpresa;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FacturaPrint({ factura, cliente, empresa, open, onOpenChange }: FacturaPrintProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 print-show">
        <DialogHeader className="sr-only">
          <DialogTitle>Impresión de Factura {factura.serie}{factura.numero}</DialogTitle>
          <DialogDescription>Vista previa de impresión de factura para el cliente {cliente?.nombre}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between p-4 border-b print:hidden">
          <h2 className="text-lg font-semibold">Vista de Impresión</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} data-testid="button-print-factura">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-8 bg-white text-black min-h-[29.7cm] print:p-0 print:m-0 print:shadow-none" id="factura-print-content">
          {/* Cabecera */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex gap-4 items-center">
              {empresa?.logoUrl && (
                <img src={empresa.logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
              )}
              <div>
                <h1 className="text-2xl font-bold uppercase">{empresa?.nombreEmpresa || "Nuestra Empresa"}</h1>
                <p className="text-sm">CIF: {empresa?.cifNif || "N/A"}</p>
                <p className="text-sm">{empresa?.direccion || ""}</p>
                <p className="text-sm">{empresa?.codigoPostal || ""} {empresa?.ciudad || ""}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-primary">FACTURA</h2>
              <p className="font-semibold">Nº: {factura.serie}{factura.numero}</p>
              <p>Fecha: {factura.fecha ? format(new Date(factura.fecha), "dd/MM/yyyy") : ""}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 border-t border-b py-4">
            <div>
              <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Cliente</h3>
              <p className="font-bold">{cliente?.nombre} {cliente?.apellidos || ""}</p>
              {cliente?.razonSocial && <p>{cliente.razonSocial}</p>}
              <p>NIF/CIF: {cliente?.nif}</p>
              <p>{cliente?.direccion}</p>
              <p>{cliente?.codigoPostal} {cliente?.ciudad}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Tipo de Factura</h3>
              <p className="capitalize">{factura.tipo}</p>
            </div>
          </div>

          {/* Tabla de Líneas */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-2">Descripción</th>
                <th className="text-right py-2">Cantidad</th>
                <th className="text-right py-2">Precio</th>
                <th className="text-right py-2">IGIC</th>
                <th className="text-right py-2">Importe</th>
              </tr>
            </thead>
            <tbody>
              {factura.lineas && factura.lineas.length > 0 ? (
                factura.lineas.map((linea, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{linea.descripcion}</td>
                    <td className="text-right py-2">{Number(linea.cantidad).toFixed(2)}</td>
                    <td className="text-right py-2">{Number(linea.precioUnitario).toFixed(2)} €</td>
                    <td className="text-right py-2">{Number(linea.igic).toFixed(2)}%</td>
                    <td className="text-right py-2">{Number(linea.importe).toFixed(2)} €</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b">
                  <td className="py-2" colSpan={5}>
                    {factura.observaciones || "Servicios realizados / Venta de productos"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between border-b pb-1">
                <span>Base Imponible:</span>
                <span>{Number(factura.baseImponible).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>IGIC:</span>
                <span>{Number(factura.totalIgic).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-1">
                <span>TOTAL:</span>
                <span>{Number(factura.total).toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Pie de página */}
          <div className="mt-auto pt-16 border-t text-sm text-gray-500 text-center">
            {empresa?.web && (
              <p className="mb-2">{empresa.web}</p>
            )}
            <p>Gracias por su confianza.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
