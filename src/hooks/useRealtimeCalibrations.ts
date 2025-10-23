import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface CalibracionPayload {
  id: string;
  evaluacion_id: string;
  empresa_id: string;
  score_calibrado_desempeno: number;
  score_calibrado_potencial: number;
  cuadrante_calibrado: string;
  cuadrante_original: string;
  created_at: string;
}

export const useRealtimeCalibrations = (
  tableroId: string | undefined,
  onUpdate: () => void
) => {
  useEffect(() => {
    if (!tableroId) {
      console.log('⚠️ No tableroId provided for realtime');
      return;
    }

    console.log('🔌 Setting up realtime subscription for tablero:', tableroId);

    const channel = supabase
      .channel(`calibraciones-realtime-${tableroId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calibraciones',
        },
        (payload: RealtimePostgresChangesPayload<CalibracionPayload>) => {
          console.log('🔔 Calibration change detected:', {
            event: payload.eventType,
            cuadrante_calibrado: payload.new?.cuadrante_calibrado,
            evaluacion_id: payload.new?.evaluacion_id,
          });
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
          console.log('🔔 Evaluation change detected:', payload.eventType);
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
          console.log('🔔 Employee change detected:', payload.eventType);
          onUpdate();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime SUBSCRIBED successfully');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime CHANNEL_ERROR');
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Realtime TIMED_OUT');
        } else if (status === 'CLOSED') {
          console.log('🚪 Realtime CLOSED');
        } else {
          console.log('📡 Realtime status:', status);
        }
      });

    return () => {
      console.log('🧹 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [tableroId, onUpdate]);
};