import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalibracionGauss } from '@/types/gauss';

interface GaussCalibracionTableProps {
  calibraciones: CalibracionGauss[];
}

export const GaussCalibracionTable = ({ calibraciones }: GaussCalibracionTableProps) => {

  return (
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
            </TableRow>
          </TableHeader>
          <TableBody>
          {calibraciones.map((cal) => {
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
