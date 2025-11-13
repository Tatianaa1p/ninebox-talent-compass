import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { CalibracionGauss } from '@/types/gauss';
import { useUpdateCalibracionGauss } from '@/hooks/queries/useCalibracionGaussQuery';
import { useAuth } from '@/contexts/AuthContext';

interface GaussCalibracionTableProps {
  calibraciones: CalibracionGauss[];
}

export const GaussCalibracionTable = ({ calibraciones }: GaussCalibracionTableProps) => {
  const { user } = useAuth();
  const updateCalibracion = useUpdateCalibracionGauss();
  const [editingScores, setEditingScores] = useState<Record<string, number>>({});

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
              <TableHead className="text-center">Puntuación Calibrada (Editable)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calibraciones.map((cal) => {
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
  );
};
