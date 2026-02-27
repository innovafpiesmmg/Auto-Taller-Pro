import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, X, RotateCcw, Upload, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MAX_FOTOS = 5;

interface CamaraFotosProps {
  fotos: string[];
  onFotosChange: (fotos: string[]) => void;
  readOnly?: boolean;
}

interface FotoViewer {
  src: string;
  index: number;
}

export function CamaraFotos({ fotos, onFotosChange, readOnly = false }: CamaraFotosProps) {
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState<number | null>(null);
  const [fotoViewer, setFotoViewer] = useState<FotoViewer | null>(null);
  const [camaraError, setCamaraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (slot: number) => {
    setCamaraError(null);
    setSlotSeleccionado(slot);
    setCamaraActiva(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCamaraError("No se pudo acceder a la cámara. Usa el botón de subir archivo.");
    }
  }, [facingMode]);

  const capturarFoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || slotSeleccionado === null) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const nuevasFotos = [...fotos];
    nuevasFotos[slotSeleccionado] = dataUrl;
    onFotosChange(nuevasFotos);
    cerrarCamara();
  }, [fotos, onFotosChange, slotSeleccionado]);

  const cerrarCamara = useCallback(() => {
    stopStream();
    setCamaraActiva(false);
    setSlotSeleccionado(null);
    setCamaraError(null);
  }, [stopStream]);

  const eliminarFoto = (index: number) => {
    const nuevasFotos = [...fotos];
    nuevasFotos[index] = "";
    onFotosChange(nuevasFotos.filter((_, i) => i < MAX_FOTOS));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const nuevasFotos = [...fotos];
      nuevasFotos[slot] = dataUrl;
      onFotosChange(nuevasFotos);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const toggleCamara = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    stopStream();
    if (slotSeleccionado !== null) {
      setTimeout(() => startCamera(slotSeleccionado), 100);
    }
  };

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const slots = Array.from({ length: MAX_FOTOS }, (_, i) => fotos[i] || "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5" />
          Fotos de Recepción
          <span className="text-sm font-normal text-muted-foreground ml-1">
            ({fotos.filter(Boolean).length}/{MAX_FOTOS})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {slots.map((foto, index) => (
            <div key={index} className="relative aspect-square">
              {foto ? (
                <div className="relative w-full h-full group">
                  <img
                    src={foto}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover rounded-md border cursor-pointer"
                    onClick={() => setFotoViewer({ src: foto, index })}
                    data-testid={`foto-recepcion-${index}`}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-md transition-colors" />
                  <button
                    className="absolute top-1 left-1 invisible group-hover:visible bg-black/50 rounded-full p-0.5"
                    onClick={() => setFotoViewer({ src: foto, index })}
                    type="button"
                  >
                    <ZoomIn className="h-3 w-3 text-white" />
                  </button>
                  {!readOnly && (
                    <button
                      className="absolute top-1 right-1 invisible group-hover:visible bg-destructive rounded-full p-0.5"
                      onClick={() => eliminarFoto(index)}
                      type="button"
                      data-testid={`button-eliminar-foto-${index}`}
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  )}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "w-full h-full border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-1 text-muted-foreground",
                    !readOnly && "cursor-pointer hover-elevate"
                  )}
                  data-testid={`slot-foto-${index}`}
                >
                  {!readOnly ? (
                    <>
                      <button
                        type="button"
                        className="flex flex-col items-center gap-1 w-full h-full justify-center"
                        onClick={() => startCamera(index)}
                      >
                        <Camera className="h-5 w-5" />
                        <span className="text-xs">Foto {index + 1}</span>
                      </button>
                      <button
                        type="button"
                        className="absolute bottom-1 right-1 p-0.5 rounded hover:text-foreground"
                        onClick={() => {
                          setSlotSeleccionado(index);
                          fileInputRef.current?.click();
                        }}
                        title="Subir archivo"
                      >
                        <Upload className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs">Sin foto</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => slotSeleccionado !== null && handleFileUpload(e, slotSeleccionado)}
          />
        )}

        <Dialog open={camaraActiva} onOpenChange={(open) => !open && cerrarCamara()}>
          <DialogContent className="max-w-lg p-0 overflow-hidden" data-testid="dialog-camara">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>Capturar foto {slotSeleccionado !== null ? slotSeleccionado + 1 : ""}</DialogTitle>
            </DialogHeader>

            <div className="relative bg-black">
              {camaraError ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-white p-4 text-center">
                  <Camera className="h-10 w-10 opacity-50" />
                  <p className="text-sm">{camaraError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      cerrarCamara();
                      setTimeout(() => {
                        setSlotSeleccionado(slotSeleccionado);
                        fileInputRef.current?.click();
                      }, 100);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Subir archivo
                  </Button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[60vh] object-contain"
                  data-testid="video-camara"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {!camaraError && (
              <div className="flex items-center justify-between p-4 gap-3">
                <Button variant="outline" size="icon" onClick={cerrarCamara} data-testid="button-cerrar-camara">
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  onClick={capturarFoto}
                  className="flex-1"
                  data-testid="button-capturar-foto"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capturar
                </Button>
                <Button variant="outline" size="icon" onClick={toggleCamara} title="Cambiar cámara">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!fotoViewer} onOpenChange={(open) => !open && setFotoViewer(null)}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden" data-testid="dialog-foto-viewer">
            <DialogHeader className="p-3 pb-0">
              <DialogTitle>Foto {fotoViewer ? fotoViewer.index + 1 : ""} de {MAX_FOTOS}</DialogTitle>
            </DialogHeader>
            {fotoViewer && (
              <img
                src={fotoViewer.src}
                alt={`Foto ${fotoViewer.index + 1}`}
                className="w-full object-contain max-h-[80vh]"
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
