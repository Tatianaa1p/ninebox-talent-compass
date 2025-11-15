import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalibracionGauss } from '@/types/gauss';
import { toast } from 'sonner';

interface CalibracionFilters {
  pais?: string;
  tablero_id?: string;
  equipo?: string;
  paisesAcceso?: string[];
}

export const useCalibracionGaussQuery = (filters?: CalibracionFilters) => {
  return useQuery({
    queryKey: ['calibracion_gauss', filters],
    queryFn: async () => {
      let query = supabase
        .from('calibracion_gauss')
        .select('*');

      // Apply backend filters for better performance
      if (filters?.tablero_id && filters.tablero_id !== 'all') {
        query = query.eq('tablero_id', filters.tablero_id);
      }

      if (filters?.equipo && filters.equipo !== 'all') {
        query = query.eq('equipo', filters.equipo);
      }

      if (filters?.pais && filters.pais !== 'all') {
        query = query.ilike('pais', filters.pais);
      }

      // Filter by allowed countries if provided
      if (filters?.paisesAcceso && filters.paisesAcceso.length > 0) {
        query = query.in('pais', filters.paisesAcceso);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data as CalibracionGauss[];
    },
    staleTime: 30 * 1000,
    enabled: !filters?.paisesAcceso || filters.paisesAcceso.length > 0,
  });
};

export const useUpdateCalibracionGauss = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      score_calibrado, 
      calibrador_email 
    }: { 
      id: string; 
      score_calibrado: number; 
      calibrador_email: string;
    }) => {
      const { data, error } = await supabase
        .from('calibracion_gauss')
        .update({
          score_calibrado,
          ultima_calibracion_por: calibrador_email,
          fecha_calibracion: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibracion_gauss'] });
      toast.success('Calibración actualizada');
    },
    onError: (error) => {
      console.error('Error updating calibration:', error);
      toast.error('Error al actualizar calibración');
    },
  });
};

export const useBulkInsertCalibraciones = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (calibraciones: Omit<CalibracionGauss, 'id' | 'created_at' | 'updated_at'>[]) => {
      const { data, error } = await supabase
        .from('calibracion_gauss')
        .insert(calibraciones)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibracion_gauss'] });
    },
  });
};

export const useDeleteAllCalibraciones = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('calibracion_gauss')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibracion_gauss'] });
      toast.success('Todas las calibraciones eliminadas');
    },
    onError: (error) => {
      console.error('Error deleting calibrations:', error);
      toast.error('Error al eliminar calibraciones');
    },
  });
};
