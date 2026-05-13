export interface UmbralesGauss {
  mean: number;
  stdDev: number;
  umbralBajo: number;
  umbralAlto: number;
  minScore: number;
  maxScore: number;
  n: number;
}

export const calcularUmbrales = (scores: number[]): UmbralesGauss => {
  const n = scores.length;
  if (n === 0) {
    return { mean: 0, stdDev: 0, umbralBajo: 0, umbralAlto: 0, minScore: 0, maxScore: 0, n: 0 };
  }
  const mean = scores.reduce((a, b) => a + b, 0) / n;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  const sorted = [...scores].sort((a, b) => a - b);
  const p15Index = Math.min(n - 1, Math.floor(n * 0.15));
  const p85Index = Math.min(n - 1, Math.floor(n * 0.85));
  const umbralBajo = sorted[p15Index];
  const umbralAlto = sorted[p85Index];

  return {
    mean,
    stdDev,
    umbralBajo,
    umbralAlto,
    minScore: sorted[0],
    maxScore: sorted[n - 1],
    n,
  };
};

export const getPosicionPorPercentil = (
  score: number,
  umbralBajo: number,
  umbralAlto: number
): { label: string; badgeClass: string } => {
  if (score <= umbralBajo) return { label: 'Bajo desempeño', badgeClass: 'bg-red-100 text-red-800 border-red-200' };
  if (score >= umbralAlto) return { label: 'Alto desempeño', badgeClass: 'bg-green-100 text-green-800 border-green-200' };
  return { label: 'Desempeño esperado', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' };
};
