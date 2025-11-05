import { CalibracionGauss } from '@/types/gauss';

export const exportCalibracionesToCSV = (calibraciones: CalibracionGauss[]) => {
  // Calculate average per employee
  const empleadoPromedios = new Map<string, number[]>();
  
  calibraciones.forEach(cal => {
    const current = empleadoPromedios.get(cal.empleado_email) || [];
    empleadoPromedios.set(
      cal.empleado_email,
      [...current, cal.score_calibrado]
    );
  });

  // Calculate averages
  const promedios = new Map<string, number>();
  empleadoPromedios.forEach((scores, email) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    promedios.set(email, avg);
  });

  // Create CSV content
  const headers = [
    'empleado_email',
    'competencia',
    'score_original',
    'score_calibrado',
    'diferencia',
    'promedio_calibrado_persona'
  ];

  const rows = calibraciones.map(cal => {
    const diferencia = cal.score_calibrado - cal.score_original;
    const promedio = promedios.get(cal.empleado_email) || 0;
    
    return [
      cal.empleado_email,
      cal.competencia,
      cal.score_original.toFixed(2),
      cal.score_calibrado.toFixed(2),
      diferencia.toFixed(2),
      promedio.toFixed(2)
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `calibracion_gauss_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
