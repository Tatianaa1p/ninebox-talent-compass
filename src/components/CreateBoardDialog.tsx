import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipoId: string;
  empresaId: string;
  defaultPeriodo?: number;
  onCreated: (tableroId: string) => void;
}

const ANIO_ACTUAL = new Date().getFullYear();
const PERIODOS_DISPONIBLES = Array.from({ length: 5 }, (_, i) => ANIO_ACTUAL - 1 + i);

export const CreateBoardDialog = ({
  open,
  onOpenChange,
  equipoId,
  empresaId,
  defaultPeriodo,
  onCreated,
}: CreateBoardDialogProps) => {
  const [nombre, setNombre] = useState('');
  const [periodo, setPeriodo] = useState<number>(defaultPeriodo ?? ANIO_ACTUAL);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('tableros')
      .insert({
        nombre,
        equipo_id: equipoId,
        empresa_id: empresaId,
        periodo,
      } as any)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el tablero',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Tablero creado',
        description: `Se creó el tablero "${nombre}" (período ${periodo})`,
      });
      setNombre('');
      onCreated(data.id);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Tablero</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Tablero</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Evaluación Q1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="periodo">Período</Label>
            <Select value={String(periodo)} onValueChange={(v) => setPeriodo(Number(v))}>
              <SelectTrigger id="periodo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS_DISPONIBLES.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Tablero'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
