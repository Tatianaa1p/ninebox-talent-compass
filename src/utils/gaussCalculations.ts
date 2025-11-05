import { CalibracionGauss } from '@/types/gauss';

export interface EmpleadoPromedio {
  empleado_email: string;
  nombre_completo?: string;
  pais: string;
  equipo: string;
  posicion: string;
  seniority: string;
  familia_cargo: string;
  tablero_id?: string;
  puntuacion_desempeno: number; // Promedio de scores calibrados
  competencias: {
    competencia: string;
    score_original: number;
    score_calibrado: number;
  }[];
}

/**
 * Calcula la puntuación de desempeño (promedio) para cada persona
 */
export const calcularPromediosPorPersona = (calibraciones: CalibracionGauss[]): EmpleadoPromedio[] => {
  const empleadosMap = new Map<string, EmpleadoPromedio>();

  calibraciones.forEach(cal => {
    const key = `${cal.empleado_email}_${cal.tablero_id || 'notablero'}`;
    
    if (!empleadosMap.has(key)) {
      empleadosMap.set(key, {
        empleado_email: cal.empleado_email,
        nombre_completo: cal.nombre_completo,
        pais: cal.pais,
        equipo: cal.equipo,
        posicion: cal.posicion,
        seniority: cal.seniority,
        familia_cargo: cal.familia_cargo,
        tablero_id: cal.tablero_id,
        puntuacion_desempeno: 0,
        competencias: [],
      });
    }

    const empleado = empleadosMap.get(key)!;
    empleado.competencias.push({
      competencia: cal.competencia,
      score_original: cal.score_original,
      score_calibrado: cal.score_calibrado,
    });
  });

  // Calcular promedios
  empleadosMap.forEach((empleado) => {
    const sum = empleado.competencias.reduce((acc, comp) => acc + comp.score_calibrado, 0);
    empleado.puntuacion_desempeno = empleado.competencias.length > 0 
      ? sum / empleado.competencias.length 
      : 0;
  });

  return Array.from(empleadosMap.values());
};

/**
 * Fuerza la curva Gauss redistribuyendo los scores según media y desviación objetivo
 */
export const forzarCurvaGauss = (
  empleados: EmpleadoPromedio[],
  mediaObjetivo: number,
  desviacionObjetivo: number
): Map<string, number> => {
  // Ordenar por puntuación de desempeño
  const sorted = [...empleados].sort((a, b) => a.puntuacion_desempeno - b.puntuacion_desempeno);
  
  const n = sorted.length;
  const ajustes = new Map<string, number>();

  sorted.forEach((empleado, index) => {
    // Calcular percentil
    const percentil = (index + 0.5) / n;
    
    // Invertir la función de distribución normal acumulada (aproximación)
    const z = inverseNormalCDF(percentil);
    
    // Calcular nuevo score basado en la distribución objetivo
    const nuevoScore = mediaObjetivo + z * desviacionObjetivo;
    
    // Asegurar que esté en el rango [1.0, 4.0]
    const scoreFinal = Math.max(1.0, Math.min(4.0, nuevoScore));
    
    ajustes.set(empleado.empleado_email, scoreFinal);
  });

  return ajustes;
};

/**
 * Aproximación de la función inversa de la distribución normal acumulada
 * Algoritmo de Beasley-Springer-Moro
 */
function inverseNormalCDF(p: number): number {
  const a0 = 2.50662823884;
  const a1 = -18.61500062529;
  const a2 = 41.39119773534;
  const a3 = -25.44106049637;
  const b0 = -8.47351093090;
  const b1 = 23.08336743743;
  const b2 = -21.06224101826;
  const b3 = 3.13082909833;
  const c0 = 0.3374754822726147;
  const c1 = 0.9761690190917186;
  const c2 = 0.1607979714918209;
  const c3 = 0.0276438810333863;
  const c4 = 0.0038405729373609;
  const c5 = 0.0003951896511919;
  const c6 = 0.0000321767881768;
  const c7 = 0.0000002888167364;
  const c8 = 0.0000003960315187;

  if (p <= 0.5) {
    const y = p - 0.5;
    const r = y * y;
    return y * (((a3 * r + a2) * r + a1) * r + a0) /
           ((((b3 * r + b2) * r + b1) * r + b0) * r + 1);
  } else {
    const y = 1 - p;
    const r = Math.sqrt(-Math.log(y));
    return -(((((((c8 * r + c7) * r + c6) * r + c5) * r + c4) * r + c3) * r + c2) * r + c1) * r + c0;
  }
}

/**
 * Calcula estadísticas de la distribución
 */
export const calcularEstadisticas = (valores: number[]) => {
  if (valores.length === 0) {
    return { media: 0, desviacion: 0, minimo: 0, maximo: 0 };
  }

  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const varianza = valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / valores.length;
  const desviacion = Math.sqrt(varianza);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);

  return { media, desviacion, minimo, maximo };
};
