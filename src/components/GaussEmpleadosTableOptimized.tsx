import { memo, useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmpleadoGauss } from '@/hooks/queries/useGaussData';
import { CUADRANTE_COLORS } from '@/hooks/queries/useCuadranteNineboxMap';

interface GaussEmpleadosTableProps {
  empleados: EmpleadoGauss[];
}

const ITEMS_PER_PAGE = 50;

const getCurvePosition = (score: number): { label: string; color: string } => {
  if (score >= 4) return { label: 'Alto desempeño', color: 'bg-green-500' };
  if (score >= 3) return { label: 'Desempeño esperado', color: 'bg-blue-500' };
  return { label: 'Bajo desempeño', color: 'bg-red-500' };
};

const GaussEmpleadosTableOptimized = ({ empleados }: GaussEmpleadosTableProps) => {
  const [currentPage, setCurrentPage] = useState(0);

  const sortedEmpleados = useMemo(
    () => [...empleados].sort((a, b) => b.performance - a.performance),
    [empleados]
  );

  const totalPages = Math.max(1, Math.ceil(sortedEmpleados.length / ITEMS_PER_PAGE));
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentEmpleados = sortedEmpleados.slice(startIndex, endIndex);

  const handlePrevPage = () => setCurrentPage((p) => Math.max(0, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Mostrando {sortedEmpleados.length === 0 ? 0 : startIndex + 1}-
          {Math.min(endIndex, sortedEmpleados.length)} de {sortedEmpleados.length} empleados
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 0}>
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
            disabled={currentPage >= totalPages - 1}
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
                <TableHead>Ranking</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Puntuación Desempeño</TableHead>
                <TableHead>Posición en Curva</TableHead>
                <TableHead>Cuadrante Nine Box</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentEmpleados.map((empleado, index) => {
                const globalIndex = startIndex + index;
                const { label, color } = getCurvePosition(empleado.performance);
                const cuadrante = empleado.cuadrante;
                return (
                  <TableRow key={empleado.id}>
                    <TableCell className="font-bold">{globalIndex + 1}</TableCell>
                    <TableCell className="font-medium">{empleado.nombre || '-'}</TableCell>
                    <TableCell>{empleado.empresaNombre}</TableCell>
                    <TableCell>{empleado.equipoNombre}</TableCell>
                    <TableCell>
                      <span className="text-lg font-bold">{empleado.performance.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={color}>{label}</Badge>
                    </TableCell>
                    <TableCell>
                      {cuadrante && cuadrante !== 'Sin datos' ? (
                        <span
                          className={`text-xs px-2 py-1 rounded-full border font-medium ${
                            CUADRANTE_COLORS[cuadrante] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {cuadrante}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sin datos</span>
                      )}
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

export default memo(GaussEmpleadosTableOptimized);
