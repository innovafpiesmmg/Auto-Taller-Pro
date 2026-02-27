import { useState, useRef, useEffect, useCallback } from "react";
import SignaturePad from "signature_pad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Trash2, Save, PenLine } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  observacion?: string;
}

interface RecepcionChecklistProps {
  onSave: (checklist: ChecklistItem[], signature: string) => void;
  initialChecklist?: ChecklistItem[];
  initialSignature?: string;
}

const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: "documentacion", label: "Documentación del vehículo", checked: false },
  { id: "ruedas", label: "Estado de neumáticos", checked: false },
  { id: "luces", label: "Luces y señalización", checked: false },
  { id: "niveles", label: "Niveles (aceite, líquidos)", checked: false },
  { id: "frenos", label: "Sistema de frenos", checked: false },
  { id: "bateria", label: "Estado de la batería", checked: false },
  { id: "carroceria", label: "Estado de carrocería", checked: false },
  { id: "interior", label: "Estado interior", checked: false },
  { id: "combustible", label: "Nivel de combustible", checked: false },
  { id: "objetos", label: "Objetos personales en vehículo", checked: false },
];

export function RecepcionChecklist({
  onSave,
  initialChecklist,
  initialSignature,
}: RecepcionChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    initialChecklist ?? DEFAULT_CHECKLIST_ITEMS
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !padRef.current) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const data = padRef.current.isEmpty() ? null : padRef.current.toDataURL();
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(ratio, ratio);
    padRef.current.clear();
    if (data) {
      padRef.current.fromDataURL(data, {
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    padRef.current = new SignaturePad(canvas, {
      backgroundColor: "rgba(0,0,0,0)",
      penColor: "rgb(30,30,30)",
      minWidth: 1.5,
      maxWidth: 3,
    });

    resizeCanvas();

    if (initialSignature) {
      padRef.current.fromDataURL(initialSignature, {
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
      });
    }

    const observer = new ResizeObserver(resizeCanvas);
    if (wrapperRef.current) observer.observe(wrapperRef.current);

    return () => {
      observer.disconnect();
      padRef.current?.off();
    };
  }, []);

  const handleCheckChange = (id: string, checked: boolean) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked } : item))
    );
  };

  const handleObservacionChange = (id: string, observacion: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, observacion } : item))
    );
  };

  const clearSignature = () => {
    padRef.current?.clear();
  };

  const handleSave = () => {
    const signature =
      padRef.current && !padRef.current.isEmpty()
        ? padRef.current.toDataURL()
        : "";
    onSave(checklist, signature);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Checklist de Recepción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {checklist.map((item) => (
            <div key={item.id} className="rounded-md">
              <div className="flex items-center gap-3 py-3 px-2">
                <Checkbox
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={(checked) =>
                    handleCheckChange(item.id, checked as boolean)
                  }
                  className="h-6 w-6 shrink-0"
                  data-testid={`checkbox-${item.id}`}
                />
                <Label
                  htmlFor={item.id}
                  className="text-base leading-snug cursor-pointer flex-1"
                >
                  {item.label}
                </Label>
              </div>
              {item.checked && (
                <Textarea
                  placeholder="Observaciones..."
                  value={item.observacion ?? ""}
                  onChange={(e) =>
                    handleObservacionChange(item.id, e.target.value)
                  }
                  className="ml-9 mb-2 text-sm min-h-[60px]"
                  data-testid={`textarea-obs-${item.id}`}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            Firma del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Firme en el recuadro de abajo con el dedo o el lápiz táctil.
          </p>
          <div
            ref={wrapperRef}
            className="border-2 border-dashed rounded-md bg-white dark:bg-zinc-900 touch-none w-full"
            style={{ height: "200px" }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full rounded-md"
              style={{ touchAction: "none" }}
              data-testid="canvas-firma"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={clearSignature}
              type="button"
              className="flex-1"
              data-testid="button-limpiar-firma"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar firma
            </Button>
          </div>
          <Separator />
          <Button
            onClick={handleSave}
            className="w-full"
            size="lg"
            type="button"
            data-testid="button-guardar-recepcion"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Recepción
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
