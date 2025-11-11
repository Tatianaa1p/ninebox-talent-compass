import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface EliminarTableroDialogProps {
  tableroId: string;
  tableroNombre: string;
  onTableroEliminado: () => void;
}

export const EliminarTableroDialog = ({ 
  tableroId, 
  tableroNombre,
  onTableroEliminado 
}: EliminarTableroDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleEliminar = async () => {
    setLoading(true);
    try {
      console.log('[EliminarTablero] Intentando eliminar tablero:', tableroId);
      
      // First delete associated calibraciones (child records)
      const { error: calibError } = await supabase
        .from('calibracion_gauss')
        .delete()
        .eq('tablero_id', tableroId);

      if (calibError) {
        console.error('[EliminarTablero] Error eliminando calibraciones:', calibError);
        throw calibError;
      }

      console.log('[EliminarTablero] Calibraciones eliminadas, ahora eliminando tablero');

      // Then delete the tablero
      const { error } = await supabase
        .from('tableros')
        .delete()
        .eq('id', tableroId);

      if (error) {
        console.error('[EliminarTablero] Error eliminando tablero:', error);
        throw error;
      }

      console.log('[EliminarTablero] Tablero eliminado exitosamente');
      toast.success('Tablero eliminado correctamente junto a las calibraciones asociadas');
      
      // Invalidar queries para actualizar el UI
      await queryClient.invalidateQueries({ queryKey: ['tableros-pais'] });
      await queryClient.invalidateQueries({ queryKey: ['calibracion-gauss'] });
      
      setOpen(false);
      onTableroEliminado();
    } catch (error: any) {
      console.error('[EliminarTablero] Error completo:', error);
      toast.error(`Error al eliminar el tablero: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar tablero
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que querés eliminar el tablero "<strong>{tableroNombre}</strong>" y sus datos asociados?
            <br />
            <br />
            Esta acción no se puede deshacer y se eliminarán todos los empleados y calibraciones asociadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEliminar}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
