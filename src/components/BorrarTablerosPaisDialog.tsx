import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PAISES = ['Argentina', 'Uruguay', 'Paraguay', 'Chile'] as const;

export const BorrarTablerosPaisDialog = () => {
  const [open, setOpen] = useState(false);
  const [selectedPais, setSelectedPais] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleBorrar = async () => {
    if (!selectedPais) {
      toast.error('Selecciona un país');
      return;
    }

    setLoading(true);

    try {
      // Primero obtener los IDs de los tableros del país
      const { data: tableros, error: tablerosError } = await supabase
        .from('tableros')
        .select('id')
        .eq('pais', selectedPais);

      if (tablerosError) throw tablerosError;

      if (!tableros || tableros.length === 0) {
        toast.info(`No hay tableros para ${selectedPais}`);
        setOpen(false);
        return;
      }

      const tableroIds = tableros.map(t => t.id);

      // Eliminar calibraciones asociadas
      const { error: calibracionesError } = await supabase
        .from('calibracion_gauss')
        .delete()
        .in('tablero_id', tableroIds);

      if (calibracionesError) throw calibracionesError;

      // Eliminar tableros
      const { error: tablerosDeleteError } = await supabase
        .from('tableros')
        .delete()
        .in('id', tableroIds);

      if (tablerosDeleteError) throw tablerosDeleteError;

      toast.success(`✅ ${tableros.length} tableros eliminados de ${selectedPais}`);
      setOpen(false);
      setSelectedPais('');
    } catch (error: any) {
      console.error('Error eliminando tableros:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <Trash2 className="mr-2 h-4 w-4" />
          Borrar Tableros por País
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Borrar Tableros por País
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará todos los tableros y evaluaciones del país seleccionado.
            <br /><br />
            <strong className="text-red-600">Esta acción no se puede deshacer.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Label htmlFor="pais">Seleccionar País</Label>
          <Select value={selectedPais} onValueChange={setSelectedPais}>
            <SelectTrigger id="pais">
              <SelectValue placeholder="Selecciona un país" />
            </SelectTrigger>
            <SelectContent>
              {PAISES.map(pais => (
                <SelectItem key={pais} value={pais}>{pais}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleBorrar} 
            disabled={loading || !selectedPais}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Eliminando...' : 'Eliminar Todo'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
