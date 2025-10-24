import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface CalibracionPayload {
  id: string;
  empleado_id: string;
  tablero_id: string;
  performance_score: number;
  potential_score: number;
  calibrado_por: string | null;
  created_at: string;
  updated_at: string | null;
}

export const useRealtimeCalibrations = (
  tableroId: string | undefined,
  onUpdate: () => void
) => {
  useEffect(() => {
    if (!tableroId) return;

    console.log('Setting up realtime subscription for calibrations');

    const channel = supabase
      .channel(`calibraciones-${tableroId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calibraciones',
        },
        (payload: RealtimePostgresChangesPayload<CalibracionPayload>) => {
          console.log('Calibration change detected:', payload);
          // Trigger data reload on any calibration change
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'evaluaciones',
        },
        (payload) => {
          console.log('Evaluation change detected:', payload);
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'empleados',
          filter: `tablero_id=eq.${tableroId}`,
        },
        (payload) => {
          console.log('Employee change detected:', payload);
          onUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [tableroId, onUpdate]);
};