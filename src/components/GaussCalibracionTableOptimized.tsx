import { useState, memo, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalibracionGauss } from '@/types/gauss';
import { useUpdateCalibracionGauss } from '@/hooks/queries/useCalibracionGaussQuery';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GaussCalibracionTableProps {
  calibraciones: CalibracionGauss[];
}

const ITEMS_PER_PAGE = 50;

const GaussCalibracionTableOptimized = ({ calibraciones }: GaussCalibracionTableProps) => {
  const { user } = useAuth();
  const updateCalibracion = useUpdateCalibracionGauss();
  const [editingScores, setEditingScores] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(calibraciones.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  
  const currentCalibraciones = useMemo(() => 
    calibraciones.slice(startIndex, endIndex),
    [calibraciones, startIndex, endIndex]
  );

  const handleScoreChange = (id: string, value: string) => {
    const score = Number(value);
    if (score >= 1.0 && score <= 4.0) {
      setEditingScores(prev => ({ ...prev, [id]: score }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      const score = editingScores[id];
      if (score !== undefined) {
        updateCalibracion.mutate({
          id,
          score_calibrado: score,
          calibrador_email: user?.email || '',
        });
      }
    }
  };

  const handlePrevPage = () => setCurrentPage(prev => Math.max(0, prev - 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1}-{Math.min(endIndex, calibraciones.length)} de {calibraciones.length} calibraciones
        </span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrevPage} 
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="flex items-center px-3 text-sm">
            Página {currentPage + 1} de {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages - 1}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Competencia</TableHead>
                <TableHead>Familia Cargo</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Posición</TableHead>
                <TableHead className="text-center">Puntuación Original</TableHead>
                <TableHead className="text-center">Puntuación Calibrada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentCalibraciones.map((cal) => {
                const currentScore = editingScores[cal.id] ?? cal.score_calibrado;
                return (
                  <TableRow key={cal.id}>
                    <TableCell className="font-medium text-sm">{cal.empleado_email}</TableCell>
                    <TableCell className="text-sm">{cal.nombre_completo || '-'}</TableCell>
                    <TableCell className="text-sm">{cal.competencia}</TableCell>
                    <TableCell className="text-sm">{cal.familia_cargo}</TableCell>
                    <TableCell className="text-sm">{cal.pais}</TableCell>
                    <TableCell className="text-sm">{cal.equipo}</TableCell>
                    <TableCell className="text-sm">{cal.posicion}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-muted-foreground">
                        {cal.score_original.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        step="0.01"
                        min="1.0"
                        max="4.0"
                        value={currentScore}
                        onChange={(e) => handleScoreChange(cal.id, e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, cal.id)}
                        className="w-24 text-center font-bold"
                        placeholder="1.0-4.0"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default memo(GaussCalibracionTableOptimized);
