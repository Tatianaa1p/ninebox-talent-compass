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
              <TableHead>Competencia</TableHead>
              <TableHead>Familia Cargo</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead>Score Original</TableHead>
              <TableHead>Score Calibrado</TableHead>
              <TableHead>Diferencia</TableHead>
              <TableHead>Calibrado Por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calibraciones.map((cal) => {
              const currentScore = editingScores[cal.id] ?? cal.score_calibrado;
              const diferencia = currentScore - cal.score_original;
              
              return (
                <TableRow key={cal.id}>
                  <TableCell className="font-medium">{cal.empleado_email}</TableCell>
                  <TableCell>{cal.competencia}</TableCell>
                  <TableCell>{cal.familia_cargo}</TableCell>
                  <TableCell>{cal.pais}</TableCell>
                  <TableCell>{cal.equipo}</TableCell>
                  <TableCell>{cal.score_original.toFixed(2)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="4.0"
                      value={currentScore}
                      onChange={(e) => handleScoreChange(cal.id, e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, cal.id)}
                      className="w-20"
                      placeholder="1.0-4.0"
                    />
                  </TableCell>
                  <TableCell>
                    <span className={diferencia > 0 ? 'text-green-600' : diferencia < 0 ? 'text-red-600' : ''}>
                      {diferencia > 0 ? '+' : ''}{diferencia.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {cal.ultima_calibracion_por || '-'}
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
