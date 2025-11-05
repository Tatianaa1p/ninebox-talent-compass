import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmpleadoPromedio } from '@/utils/gaussCalculations';
import { Badge } from '@/components/ui/badge';

interface GaussEmpleadosTableProps {
  empleados: EmpleadoPromedio[];
}

export const GaussEmpleadosTable = ({ empleados }: GaussEmpleadosTableProps) => {
  // Ordenar por puntuación de desempeño descendente
  const sortedEmpleados = [...empleados].sort((a, b) => b.puntuacion_desempeno - a.puntuacion_desempeno);

  const getCurvePosition = (score: number): { label: string; color: string } => {
    if (score >= 3.0) return { label: 'Alto desempeño', color: 'bg-green-500' };
    if (score >= 2.0) return { label: 'Desempeño esperado', color: 'bg-blue-500' };
    return { label: 'Bajo desempeño', color: 'bg-red-500' };
  };

  return (
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
            {sortedEmpleados.map((empleado, index) => {
              const { label, color } = getCurvePosition(empleado.puntuacion_desempeno);
              
              return (
                <TableRow key={`${empleado.empleado_email}_${empleado.tablero_id}`}>
                  <TableCell className="font-bold">{index + 1}</TableCell>
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
  );
};
