import { memo, useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmpleadoPromedio } from '@/utils/gaussCalculations';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GaussEmpleadosTableProps {
  empleados: EmpleadoPromedio[];
}

const ITEMS_PER_PAGE = 50;

const getCurvePosition = (score: number): { label: string; color: string } => {
  if (score >= 3.0) return { label: 'Alto desempeño', color: 'bg-green-500' };
  if (score >= 2.0) return { label: 'Desempeño esperado', color: 'bg-blue-500' };
  return { label: 'Bajo desempeño', color: 'bg-red-500' };
};

const GaussEmpleadosTableOptimized = ({ empleados }: GaussEmpleadosTableProps) => {
  const [currentPage, setCurrentPage] = useState(0);

  const sortedEmpleados = useMemo(() => 
    [...empleados].sort((a, b) => b.puntuacion_desempeno - a.puntuacion_desempeno),
    [empleados]
  );

  const totalPages = Math.ceil(sortedEmpleados.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentEmpleados = sortedEmpleados.slice(startIndex, endIndex);

  const handlePrevPage = () => setCurrentPage(prev => Math.max(0, prev - 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1}-{Math.min(endIndex, sortedEmpleados.length)} de {sortedEmpleados.length} empleados
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
                <TableHead>Ranking</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Posición</TableHead>
                <TableHead>Puntuación Desempeño</TableHead>
                <TableHead>Posición en Curva</TableHead>
                <TableHead>Competencias</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentEmpleados.map((empleado, index) => {
                const globalIndex = startIndex + index;
                const { label, color } = getCurvePosition(empleado.puntuacion_desempeno);
                
                return (
                  <TableRow key={`${empleado.empleado_email}_${empleado.tablero_id}`}>
                    <TableCell className="font-bold">{globalIndex + 1}</TableCell>
                    <TableCell className="font-medium">{empleado.nombre_completo || '-'}</TableCell>
                    <TableCell>{empleado.empleado_email}</TableCell>
                    <TableCell>{empleado.pais}</TableCell>
                    <TableCell>{empleado.equipo}</TableCell>
                    <TableCell>{empleado.posicion}</TableCell>
                    <TableCell>
                      <span className="text-lg font-bold">
                        {empleado.puntuacion_desempeno.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={color}>{label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {empleado.competencias.length} competencias
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
