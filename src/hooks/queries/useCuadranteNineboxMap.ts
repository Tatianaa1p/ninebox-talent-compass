import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const QUADRANT_NAMES: Record<string, string> = {
  'Alto-Alto': 'Talento Estratégico',
  'Alto-Medio': 'Desarrollar',
  'Alto-Bajo': 'Enigma',
  'Medio-Alto': 'Consistente',
  'Medio-Medio': 'Clave',
  'Medio-Bajo': 'Dilema',
  'Bajo-Alto': 'Confiable',
  'Bajo-Medio': 'Estancamiento',
  'Bajo-Bajo': 'Riesgo',
};

const potLevel = (p: number) => (p > 2.5 ? 'Alto' : p > 1.5 ? 'Medio' : 'Bajo');
const perfLevel = (p: number) => (p >= 4 ? 'Alto' : p >= 3 ? 'Medio' : 'Bajo');

const norm = (s: string) => (s || '').toLowerCase().trim();

/**
 * Returns a Map keyed by `${tableroGaussId}::${nombreLower}` -> cuadrante name.
 */
export const useCuadranteNineboxMap = (tableroGaussIds: string[]) => {
  const ids = Array.from(new Set(tableroGaussIds.filter(Boolean))).sort();

  return useQuery({
    queryKey: ['cuadrante-ninebox-map', ids],
    enabled: ids.length > 0,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const map = new Map<string, string>();

      const { data: espejos, error: espErr } = await supabase
        .from('tablero_espejo')
        .select('tablero_gauss_id, tablero_ninebox_id')
        .in('tablero_gauss_id', ids);
      if (espErr) throw espErr;
      if (!espejos || espejos.length === 0) return map;

      const ninebox2gauss = new Map<string, string>();
      espejos.forEach((e: any) => ninebox2gauss.set(e.tablero_ninebox_id, e.tablero_gauss_id));
      const nineboxIds = Array.from(ninebox2gauss.keys());

      const { data: empleados, error: empErr } = await supabase
        .from('empleados')
        .select('nombre, performance, potencial, tablero_id')
        .in('tablero_id', nineboxIds);
      if (empErr) throw empErr;

      empleados?.forEach((e: any) => {
        const gaussId = ninebox2gauss.get(e.tablero_id);
        if (!gaussId) return;
        const pot = Number(e.potencial ?? 0);
        const perf = Number(e.performance ?? 0);
        const cuadrante = QUADRANT_NAMES[`${potLevel(pot)}-${perfLevel(perf)}`];
        if (cuadrante) {
          map.set(`${gaussId}::${norm(e.nombre)}`, cuadrante);
        }
      });

      return map;
    },
  });
};

export const CUADRANTE_COLORS: Record<string, string> = {
  'Talento Estratégico': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Desarrollar': 'bg-green-100 text-green-800 border-green-200',
  'Enigma': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Consistente': 'bg-green-100 text-green-800 border-green-200',
  'Clave': 'bg-amber-100 text-amber-800 border-amber-200',
  'Dilema': 'bg-orange-100 text-orange-800 border-orange-200',
  'Confiable': 'bg-blue-100 text-blue-800 border-blue-200',
  'Estancamiento': 'bg-orange-100 text-orange-800 border-orange-200',
  'Riesgo': 'bg-red-100 text-red-800 border-red-200',
};

export const cuadranteKey = (gaussTableroId: string | undefined, nombre: string | undefined) =>
  `${gaussTableroId || ''}::${norm(nombre || '')}`;
