import { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Trash2, Save, RefreshCw } from "lucide-react";

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

const DEFAULT_CHECKLIST_ITEMS = [
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

export function RecepcionChecklist({ onSave, initialChecklist, initialSignature }: RecepcionChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    initialChecklist || DEFAULT_CHECKLIST_ITEMS
  );
  const signatureRef = useRef<SignatureCanvas>(null);
  const [signatureData, setSignatureData] = useState<string>(initialSignature || "");
  const [isSignatureLoaded, setIsSignatureLoaded] = useState(false);

  const handleCheckChange = (id: string, checked: boolean) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, checked } : item))
    );
  };

  const handleObservacionChange = (id: string, observacion: string) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, observacion } : item))
    );
  };

  useEffect(() => {
    if (initialSignature && signatureRef.current && !isSignatureLoaded) {
      signatureRef.current.fromDataURL(initialSignature);
      setSignatureData(initialSignature);
      setIsSignatureLoaded(true);
    }
  }, [initialSignature, isSignatureLoaded]);

  const clearSignature = () => {
    signatureRef.current?.clear();
    setSignatureData("");
  };

  const saveSignature = () => {
    if (signatureRef.current) {
      const data = signatureRef.current.toDataURL();
      setSignatureData(data);
    }
  };

  const handleSave = () => {
    let signature = signatureData;
    
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      signature = signatureRef.current.toDataURL();
    } else if (!signatureData) {
      signature = "";
    }
    
    onSave(checklist, signature);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Checklist de Recepción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklist.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={(checked) =>
                    handleCheckChange(item.id, checked as boolean)
                  }
                  data-testid={`checkbox-${item.id}`}
                />
                <Label
                  htmlFor={item.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {item.label}
                </Label>
              </div>
              {item.checked && (
                <Textarea
                  placeholder="Observaciones..."
                  value={item.observacion || ""}
                  onChange={(e) => handleObservacionChange(item.id, e.target.value)}
                  className="ml-6"
                  data-testid={`textarea-obs-${item.id}`}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firma del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {signatureData && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Firma guardada:</p>
              <img 
                src={signatureData} 
                alt="Firma guardada" 
                className="border rounded-md max-h-32"
                data-testid="img-firma-guardada"
              />
            </div>
          )}
          <div className="border-2 border-dashed rounded-md">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: "w-full h-48 rounded-md",
                "data-testid": "canvas-firma"
              }}
              onEnd={saveSignature}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSignature}
              data-testid="button-limpiar-firma"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signatureRef.current?.clear()}
              data-testid="button-rehacer-firma"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Rehacer
            </Button>
          </div>
          <Separator />
          <Button
            onClick={handleSave}
            className="w-full"
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
