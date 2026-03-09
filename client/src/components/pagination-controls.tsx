import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaginationControlsProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PaginationControls({ total, page, pageSize, onPageChange, onPageSizeChange }: PaginationControlsProps) {
  const totalPages = Math.ceil(total / pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
      <span className="text-sm text-muted-foreground">Mostrando {from}–{to} de {total} resultados</span>
      <div className="flex items-center gap-2">
        <Select value={String(pageSize)} onValueChange={(v) => { onPageSizeChange(Number(v)); onPageChange(1); }}>
          <SelectTrigger className="w-24" data-testid="select-page-size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={page <= 1} 
          onClick={() => onPageChange(page - 1)} 
          data-testid="button-pagina-anterior"
        >
          Anterior
        </Button>
        <span className="text-sm">Página {page} de {totalPages || 1}</span>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={page >= totalPages} 
          onClick={() => onPageChange(page + 1)} 
          data-testid="button-pagina-siguiente"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
