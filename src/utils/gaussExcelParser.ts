import * as XLSX from 'xlsx';
import { COMPETENCIAS, getFamiliaCargo, UploadError, UploadResult } from '@/types/gauss';

export interface ParsedRow {
  empleado_email: string;
  nombre_completo?: string;
  competencia: string;
  score_original: number;
  pais: string;
  equipo: string;
  seniority: string;
  posicion: string;
  familia_cargo: string;
}

const generateDummyEmail = (nombreCompleto: string): string => {
  const normalized = nombreCompleto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  return `${normalized}@dummy.local`;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateCompetencia = (competencia: string): boolean => {
  return COMPETENCIAS.includes(competencia as any);
};

const validateScore = (score: number): boolean => {
  return score >= 1.0 && score <= 4.0;
};

export const parseGaussExcel = async (file: File): Promise<{ validRows: ParsedRow[]; errors: UploadError[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const validRows: ParsedRow[] = [];
        const errors: UploadError[] = [];

        // Detect format: wide (competencies in columns) or long (one row per competency)
        const firstRow: any = jsonData[0] || {};
        const hasCompetenciaColumn = 'competencia' in firstRow;
        
        if (hasCompetenciaColumn) {
          // FORMATO LARGO (original)
          jsonData.forEach((row: any, index: number) => {
            const rowErrors: string[] = [];
            const rowNumber = index + 2;

            // Get email or nombre_completo
            const nombreCompleto = row['Nombre completo'] || row.nombre_completo || '';
            let empleadoEmail = row.empleado_email || '';

            if (!empleadoEmail && !nombreCompleto) {
              rowErrors.push('Falta empleado_email o Nombre completo');
            } else if (!empleadoEmail) {
              empleadoEmail = generateDummyEmail(nombreCompleto);
            } else if (!validateEmail(empleadoEmail)) {
              rowErrors.push('Email inválido');
            }

            if (!row.competencia) {
              rowErrors.push('Falta competencia');
            } else if (!validateCompetencia(row.competencia)) {
              rowErrors.push(`Competencia no válida: "${row.competencia}"`);
            }

            const scoreOriginal = row.score_original || row['Puntuación de desempeño'];
            if (scoreOriginal === undefined || scoreOriginal === null) {
              rowErrors.push('Falta score_original o Puntuación de desempeño');
            } else if (!validateScore(Number(scoreOriginal))) {
              rowErrors.push(`Score debe estar entre 1.0 y 4.0 (actual: ${scoreOriginal})`);
            }

            if (!row.pais && !row.País) rowErrors.push('Falta país');
            if (!row.equipo && !row.Equipo) rowErrors.push('Falta equipo');
            if (!row.seniority && !row.Seniority) rowErrors.push('Falta seniority');
            if (!row.posicion && !row.Posición) rowErrors.push('Falta posición');

            if (rowErrors.length > 0) {
              errors.push({ row: rowNumber, errors: rowErrors });
            } else {
              validRows.push({
                empleado_email: empleadoEmail.trim(),
                nombre_completo: nombreCompleto || undefined,
                competencia: row.competencia.trim(),
                score_original: Number(scoreOriginal),
                pais: (row.pais || row.País).trim(),
                equipo: (row.equipo || row.Equipo).trim(),
                seniority: (row.seniority || row.Seniority).trim(),
                posicion: (row.posicion || row.Posición).trim(),
                familia_cargo: getFamiliaCargo(row.posicion || row.Posición),
              });
            }
          });
        } else {
          // FORMATO ANCHO (competencias en columnas)
          jsonData.forEach((row: any, index: number) => {
            const rowNumber = index + 2;
            const nombreCompleto = row['Nombre completo'] || row.nombre_completo || '';
            const empleadoEmail = row.empleado_email || generateDummyEmail(nombreCompleto);
            
            const pais = row.País || row.pais || '';
            const equipo = row.Equipo || row.equipo || '';
            const posicion = row.Posición || row.posicion || '';
            const seniority = row.Seniority || row.seniority || '';

            // Base validation
            const baseErrors: string[] = [];
            if (!nombreCompleto && !row.empleado_email) baseErrors.push('Falta Nombre completo o empleado_email');
            if (!pais) baseErrors.push('Falta País');
            if (!equipo) baseErrors.push('Falta Equipo');
            if (!posicion) baseErrors.push('Falta Posición');
            if (!seniority) baseErrors.push('Falta Seniority');

            if (baseErrors.length > 0) {
              errors.push({ row: rowNumber, errors: baseErrors });
              return;
            }

            // Extract competencies from columns
            COMPETENCIAS.forEach(competencia => {
              const score = row[competencia];
              
              if (score !== undefined && score !== null && score !== '') {
                const rowErrors: string[] = [];
                
                if (!validateScore(Number(score))) {
                  rowErrors.push(`Score de "${competencia}" debe estar entre 1.0 y 4.0 (actual: ${score})`);
                }

                if (rowErrors.length > 0) {
                  errors.push({ row: rowNumber, errors: rowErrors });
                } else {
                  validRows.push({
                    empleado_email: empleadoEmail.trim(),
                    nombre_completo: nombreCompleto || undefined,
                    competencia: competencia,
                    score_original: Number(score),
                    pais: pais.trim(),
                    equipo: equipo.trim(),
                    seniority: seniority.trim(),
                    posicion: posicion.trim(),
                    familia_cargo: getFamiliaCargo(posicion),
                  });
                }
              }
            });
          });
        }

        resolve({ validRows, errors });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
