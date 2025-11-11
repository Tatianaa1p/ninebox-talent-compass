import { CalibracionGauss, COMPETENCIAS } from '@/types/gauss';
import { EmpleadoPromedio } from '@/utils/gaussCalculations';
import * as XLSX from 'xlsx';

export const exportEmpleadosToExcel = (empleados: EmpleadoPromedio[]) => {
  // Formato ancho: Una fila por empleado con competencias en columnas
  const data = empleados.map(emp => {
    const row: any = {
      'Nombre Completo': emp.nombre_completo || '',
      'Email': emp.empleado_email,
      'País': emp.pais,
      'Equipo': emp.equipo,
      'Posición': emp.posicion,
      'Seniority': emp.seniority,
      'Familia Cargo': emp.familia_cargo,
    };

    // Add competencias as columns with both original and calibrated
    const calibradoresPorCompetencia: string[] = [];
    emp.competencias.forEach(comp => {
      // Column names with prefix for clarity
      row[`${comp.competencia} (Original)`] = Number(comp.score_original.toFixed(2));
      row[`${comp.competencia} (Calibrado)`] = Number(comp.score_calibrado.toFixed(2));
      if (comp.calibrado_por) {
        calibradoresPorCompetencia.push(comp.calibrado_por);
      }
    });

    // Calculate original performance score (average of original scores)
    const sumOriginal = emp.competencias.reduce((acc, comp) => acc + comp.score_original, 0);
    const puntuacionOriginal = emp.competencias.length > 0 ? sumOriginal / emp.competencias.length : 0;
    
    // Performance scores - original and calibrated
    row['Puntuación de Desempeño (Original)'] = Number(puntuacionOriginal.toFixed(2));
    row['Puntuación de Desempeño (Calibrada)'] = Number(emp.puntuacion_desempeno.toFixed(2));

    // Calculate position in curve for original score
    let posicionOriginal = '';
    if (puntuacionOriginal >= 3.0) posicionOriginal = 'Alto desempeño';
    else if (puntuacionOriginal >= 2.0) posicionOriginal = 'Desempeño esperado';
    else posicionOriginal = 'Bajo desempeño';
    
    row['Posición de Desempeño (Original)'] = posicionOriginal;

    // Calculate position in curve for calibrated score
    let posicionCalibrada = '';
    if (emp.puntuacion_desempeno >= 3.0) posicionCalibrada = 'Alto desempeño';
    else if (emp.puntuacion_desempeno >= 2.0) posicionCalibrada = 'Desempeño esperado';
    else posicionCalibrada = 'Bajo desempeño';

    row['Posición de Desempeño (Calibrada)'] = posicionCalibrada;
    
    // Add who calibrated (unique list)
    const calibradoresUnicos = [...new Set(calibradoresPorCompetencia)];
    row['Usuario que Calibró'] = calibradoresUnicos.join(', ') || '-';

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, 15)
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Calibraciones');
  XLSX.writeFile(workbook, `calibracion_gauss_${new Date().toISOString().split('T')[0]}.xlsx`);
};

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

export const exportCalibracionesToExcel = (calibraciones: CalibracionGauss[], formato: 'largo' | 'ancho' = 'ancho') => {
  if (formato === 'largo') {
    // FORMATO LARGO: Una fila por competencia
    const empleadoPromedios = new Map<string, number[]>();
    
    calibraciones.forEach(cal => {
      const current = empleadoPromedios.get(cal.empleado_email) || [];
      empleadoPromedios.set(cal.empleado_email, [...current, cal.score_calibrado]);
    });

    const promedios = new Map<string, number>();
    empleadoPromedios.forEach((scores, email) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      promedios.set(email, avg);
    });

    const data = calibraciones.map(cal => ({
      'Nombre Completo': cal.nombre_completo || '',
      'Email': cal.empleado_email,
      'País': cal.pais,
      'Equipo': cal.equipo,
      'Posición': cal.posicion,
      'Seniority': cal.seniority,
      'Familia Cargo': cal.familia_cargo,
      'Competencia': cal.competencia,
      'Score Original': Number(cal.score_original.toFixed(2)),
      'Score Calibrado': Number(cal.score_calibrado.toFixed(2)),
      'Diferencia': Number((cal.score_calibrado - cal.score_original).toFixed(2)),
      'Promedio Calibrado Persona': Number((promedios.get(cal.empleado_email) || 0).toFixed(2))
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calibraciones');
    XLSX.writeFile(workbook, `calibracion_gauss_largo_${new Date().toISOString().split('T')[0]}.xlsx`);
  } else {
    // FORMATO ANCHO: Competencias en columnas
    const empleadosMap = new Map<string, any>();

    calibraciones.forEach(cal => {
      const key = cal.nombre_completo || cal.empleado_email;
      
      if (!empleadosMap.has(key)) {
        empleadosMap.set(key, {
          'Nombre Completo': cal.nombre_completo || '',
          'Email': cal.empleado_email,
          'País': cal.pais,
          'Equipo': cal.equipo,
          'Posición': cal.posicion,
          'Seniority': cal.seniority,
          'Familia Cargo': cal.familia_cargo,
        });
      }

      const empleado = empleadosMap.get(key);
      empleado[`${cal.competencia} (Original)`] = Number(cal.score_original.toFixed(2));
      empleado[`${cal.competencia} (Calibrado)`] = Number(cal.score_calibrado.toFixed(2));
    });

    // Calculate averages per employee
    empleadosMap.forEach((empleado, key) => {
      const scores: number[] = [];
      COMPETENCIAS.forEach(comp => {
        const calibrado = empleado[`${comp} (Calibrado)`];
        if (calibrado !== undefined) scores.push(calibrado);
      });
      empleado['Promedio Calibrado'] = scores.length > 0 
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : 0;
    });

    const data = Array.from(empleadosMap.values());
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calibraciones');
    XLSX.writeFile(workbook, `calibracion_gauss_ancho_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
};
