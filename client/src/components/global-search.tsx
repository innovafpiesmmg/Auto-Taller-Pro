import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Car, ClipboardList, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Cliente {
  id: number;
  nombre: string;
  nif: string;
}

interface Vehiculo {
  id: number;
  matricula: string;
  marca: string;
  modelo: string;
  clienteId: number;
}

interface Orden {
  id: number;
  codigo: string;
  estado: string;
}

export function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const shouldSearch = debouncedTerm.length >= 3;

  const { data: clientes, isLoading: loadingClientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes", { search: debouncedTerm }],
    enabled: shouldSearch,
  });

  const { data: vehiculos, isLoading: loadingVehiculos } = useQuery<Vehiculo[]>({
    queryKey: ["/api/vehiculos", { search: debouncedTerm }],
    enabled: shouldSearch,
  });

  const { data: ordenes, isLoading: loadingOrdenes } = useQuery<Orden[]>({
    queryKey: ["/api/ordenes"],
    enabled: shouldSearch,
    select: (data) => 
      data.filter(or => 
        or.codigo?.toLowerCase().includes(debouncedTerm.toLowerCase())
      ),
  });

  const isLoading = loadingClientes || loadingVehiculos || loadingOrdenes;
  const hasResults = (clientes?.length || 0) > 0 || (vehiculos?.length || 0) > 0 || (ordenes?.length || 0) > 0;

  const handleNavigate = (path: string) => {
    setLocation(path);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full max-w-sm">
      <Popover open={open && shouldSearch} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar clientes, vehículos, órdenes..."
              className="pl-9 w-full bg-muted/50 focus-visible:bg-background"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setOpen(true);
              }}
              data-testid="input-global-search"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 w-[400px]" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <p className="text-sm text-muted-foreground">Buscando...</p>
              </div>
            ) : !hasResults ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Sin resultados para "{debouncedTerm}"
              </div>
            ) : (
              <div className="p-2">
                {clientes && clientes.length > 0 && (
                  <div className="mb-4">
                    <h3 className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Clientes
                    </h3>
                    <div className="space-y-1">
                      {clientes.map((cliente) => (
                        <button
                          key={`cliente-${cliente.id}`}
                          className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => handleNavigate("/clientes")}
                          data-testid={`result-cliente-${cliente.id}`}
                        >
                          <div className="font-medium">{cliente.nombre}</div>
                          <div className="text-xs text-muted-foreground">{cliente.nif}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {vehiculos && vehiculos.length > 0 && (
                  <div className="mb-4">
                    {clientes && clientes.length > 0 && <Separator className="my-2" />}
                    <h3 className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      Vehículos
                    </h3>
                    <div className="space-y-1">
                      {vehiculos.map((vehiculo) => (
                        <button
                          key={`vehiculo-${vehiculo.id}`}
                          className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => handleNavigate("/vehiculos")}
                          data-testid={`result-vehiculo-${vehiculo.id}`}
                        >
                          <div className="font-medium">{vehiculo.matricula}</div>
                          <div className="text-xs text-muted-foreground">
                            {vehiculo.marca} {vehiculo.modelo}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {ordenes && ordenes.length > 0 && (
                  <div className="mb-2">
                    {(clientes?.length || 0) > 0 || (vehiculos?.length || 0) > 0 ? <Separator className="my-2" /> : null}
                    <h3 className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <ClipboardList className="h-3 w-3" />
                      Órdenes
                    </h3>
                    <div className="space-y-1">
                      {ordenes.map((orden) => (
                        <button
                          key={`orden-${orden.id}`}
                          className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => handleNavigate(`/ordenes/${orden.id}`)}
                          data-testid={`result-orden-${orden.id}`}
                        >
                          <div className="font-medium">{orden.codigo}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            Estado: {orden.estado.replace("_", " ")}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
