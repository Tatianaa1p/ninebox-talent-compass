import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

// Security: Input validation schema
const evaluationSchema = z.object({
  persona_nombre: z.string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, 'Solo se permiten letras, espacios, guiones y apóstrofes'),
  potencial_score: z.number().min(1, 'Mínimo 1').max(5, 'Máximo 5'),
  desempeno_score: z.number().min(1, 'Mínimo 1').max(5, 'Máximo 5')
});

interface EvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipoId: string;
  tableroId: string;
}

export const EvaluationDialog = ({
  open,
  onOpenChange,
  equipoId,
  tableroId,
}: EvaluationDialogProps) => {
  const [nombre, setNombre] = useState('');
  const [potencial, setPotencial] = useState('');
  const [desempeno, setDesempeno] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const potencialScore = parseFloat(potencial);
    const desempenoScore = parseFloat(desempeno);

    // Security: Validate input before database insertion
    try {
      evaluationSchema.parse({
        persona_nombre: nombre,
        potencial_score: potencialScore,
        desempeno_score: desempenoScore
      });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        toast({
          title: 'Error de validación',
          description: validationError.errors[0].message,
          variant: 'destructive',
        });
      }
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('evaluaciones').insert({
      persona_nombre: nombre.trim(),
      potencial_score: potencialScore,
      desempeno_score: desempenoScore,
      equipo_id: equipoId,
      tablero_id: tableroId,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la evaluación',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Evaluación creada',
        description: `Se agregó ${nombre} al tablero`,
      });
      setNombre('');
      setPotencial('');
      setDesempeno('');
      onOpenChange(false);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Evaluación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              maxLength={100}
              placeholder="Ej: Juan Pérez"
            />
            <p className="text-xs text-muted-foreground">
              Entre 2 y 100 caracteres
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="potencial">Puntuación Potencial (1-5)</Label>
            <Input
              id="potencial"
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={potencial}
              onChange={(e) => setPotencial(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Bajo ≤1.5 | Medio &gt;1.5 hasta ≤2.5 | Alto &gt;2.5
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desempeno">Puntuación Desempeño (1-5)</Label>
            <Input
              id="desempeno"
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={desempeno}
              onChange={(e) => setDesempeno(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Bajo &lt;3 | Medio 3-3.9 | Alto ≥4
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
