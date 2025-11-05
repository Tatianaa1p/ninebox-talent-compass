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

const normalizeHeader = (header: string): string => {
  return header
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '_');
};

const HEADER_MAPPINGS: Record<string, string[]> = {
  'empleado_email': ['empleado_email', 'email', 'correo', 'mail'],
  'nombre_completo': ['nombre_completo', 'nombre', 'name', 'empleado'],
  'competencia': ['competencia', 'competency', 'skill'],
  'score_original': ['score_original', 'puntuacion_de_desempeno', 'puntuacion', 'score', 'calificacion'],
  'pais': ['pais', 'country', 'nation'],
  'equipo': ['equipo', 'team', 'grupo'],
  'seniority': ['seniority', 'nivel', 'level'],
  'posicion': ['posicion', 'position', 'cargo', 'puesto', 'role'],
};

const findColumnName = (row: any, targetColumn: string): string | null => {
  const possibleNames = HEADER_MAPPINGS[targetColumn] || [targetColumn];
  for (const key of Object.keys(row)) {
    const normalized = normalizeHeader(key);
    if (possibleNames.some(name => normalized === normalizeHeader(name))) {
      return key;
    }
  }
  return null;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const extractCompetenciaName = (fullName: string): string | null => {
  // Extract competencia name before the colon for long column names
  // e.g., "Mánager - Orientación al cliente: capacidad..." -> "Orientación al cliente"
  const match = fullName.match(/^(?:Mánager|Manager)\s*-\s*([^:]+)/i);
  if (match) {
    return match[1].trim();
  }
  // Return as-is for short names
  return fullName.trim();
};

const validateCompetencia = (competencia: string): boolean => {
  const normalized = extractCompetenciaName(competencia);
  if (!normalized) return false;
  
  // Check if it matches any known competencia (partial match)
  return COMPETENCIAS.some(comp => {
    const compLower = comp.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normalizedLower = normalized.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return compLower.includes(normalizedLower) || normalizedLower.includes(compLower);
  });
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
        if (!data) {
          reject(new Error('Archivo vacío o no se pudo leer'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('El archivo no contiene ninguna hoja válida'));
          return;
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) {
          reject(new Error('La hoja está vacía o no contiene datos válidos'));
          return;
        }

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

            // Flexible column detection
            const nombreCompletoCol = findColumnName(row, 'nombre_completo');
            const empleadoEmailCol = findColumnName(row, 'empleado_email');
            const competenciaCol = findColumnName(row, 'competencia');
            const scoreCol = findColumnName(row, 'score_original');
            const paisCol = findColumnName(row, 'pais');
            const equipoCol = findColumnName(row, 'equipo');
            const seniorityCol = findColumnName(row, 'seniority');
            const posicionCol = findColumnName(row, 'posicion');

            const nombreCompleto = nombreCompletoCol ? row[nombreCompletoCol] : '';
            let empleadoEmail = empleadoEmailCol ? row[empleadoEmailCol] : '';

            if (!empleadoEmail && !nombreCompleto) {
              rowErrors.push('Se requiere "empleado_email" o "Nombre completo"');
            } else if (!empleadoEmail) {
              empleadoEmail = generateDummyEmail(nombreCompleto);
            } else if (!validateEmail(empleadoEmail)) {
              rowErrors.push(`Email inválido: "${empleadoEmail}"`);
            }

            const competenciaRaw = competenciaCol ? row[competenciaCol] : '';
            const competencia = extractCompetenciaName(competenciaRaw) || competenciaRaw;
            if (!competencia) {
              rowErrors.push('Se requiere columna "competencia"');
            } else if (!validateCompetencia(competenciaRaw)) {
              rowErrors.push(`Competencia no válida: "${competencia}". Debe ser una de las 14 competencias estándar.`);
            }

            const scoreOriginal = scoreCol ? row[scoreCol] : undefined;
            if (scoreOriginal === undefined || scoreOriginal === null || scoreOriginal === '') {
              rowErrors.push('Se requiere "score_original" o "Puntuación de desempeño"');
            } else if (!validateScore(Number(scoreOriginal))) {
              rowErrors.push(`El score debe estar entre 1.0 y 4.0 (valor actual: ${scoreOriginal})`);
            }

            const pais = paisCol ? row[paisCol] : '';
            const equipo = equipoCol ? row[equipoCol] : '';
            const seniority = seniorityCol ? row[seniorityCol] : '';
            const posicion = posicionCol ? row[posicionCol] : '';

            if (!pais) rowErrors.push('Se requiere columna "País"');
            if (!equipo) rowErrors.push('Se requiere columna "Equipo"');
            if (!seniority) rowErrors.push('Se requiere columna "Seniority"');
            if (!posicion) rowErrors.push('Se requiere columna "Posición"');

            if (rowErrors.length > 0) {
              errors.push({ row: rowNumber, errors: rowErrors });
            } else {
              validRows.push({
                empleado_email: empleadoEmail.trim(),
                nombre_completo: nombreCompleto || undefined,
                competencia: competencia.trim(),
                score_original: Number(scoreOriginal),
                pais: pais.trim(),
                equipo: equipo.trim(),
                seniority: seniority.trim(),
                posicion: posicion.trim(),
                familia_cargo: getFamiliaCargo(posicion),
              });
            }
          });
        } else {
          // FORMATO ANCHO (competencias en columnas)
          jsonData.forEach((row: any, index: number) => {
            const rowNumber = index + 2;
            
            // Flexible column detection
            const nombreCompletoCol = findColumnName(row, 'nombre_completo');
            const empleadoEmailCol = findColumnName(row, 'empleado_email');
            const paisCol = findColumnName(row, 'pais');
            const equipoCol = findColumnName(row, 'equipo');
            const posicionCol = findColumnName(row, 'posicion');
            const seniorityCol = findColumnName(row, 'seniority');

            const nombreCompleto = nombreCompletoCol ? row[nombreCompletoCol] : '';
            const empleadoEmail = empleadoEmailCol ? row[empleadoEmailCol] : generateDummyEmail(nombreCompleto);
            const pais = paisCol ? row[paisCol] : '';
            const equipo = equipoCol ? row[equipoCol] : '';
            const posicion = posicionCol ? row[posicionCol] : '';
            const seniority = seniorityCol ? row[seniorityCol] : '';

            // Base validation
            const baseErrors: string[] = [];
            if (!nombreCompleto && !empleadoEmailCol) baseErrors.push('Se requiere "Nombre completo" o "empleado_email"');
            if (!pais) baseErrors.push('Se requiere columna "País"');
            if (!equipo) baseErrors.push('Se requiere columna "Equipo"');
            if (!posicion) baseErrors.push('Se requiere columna "Posición"');
            if (!seniority) baseErrors.push('Se requiere columna "Seniority"');

            if (baseErrors.length > 0) {
              errors.push({ row: rowNumber, errors: baseErrors });
              return;
            }

            // Extract competencies from columns (check all columns for competencia patterns)
            Object.keys(row).forEach(colName => {
              const normalizedCol = normalizeHeader(colName);
              
              // Skip known metadata columns
              if (['pais', 'equipo', 'manager', 'nombre_completo', 'familia_de_cargo', 'posicion', 'seniority', 'empleado_email'].includes(normalizedCol)) {
                return;
              }
              
              const score = row[colName];
              
              if (score !== undefined && score !== null && score !== '') {
                const competenciaName = extractCompetenciaName(colName);
                
                if (competenciaName && validateCompetencia(colName)) {
                  const rowErrors: string[] = [];
                  
                  if (!validateScore(Number(score))) {
                    rowErrors.push(`El score de "${competenciaName}" debe estar entre 1.0 y 4.0 (valor actual: ${score})`);
                  }

                  if (rowErrors.length > 0) {
                    errors.push({ row: rowNumber, errors: rowErrors });
                  } else {
                    validRows.push({
                      empleado_email: empleadoEmail.trim(),
                      nombre_completo: nombreCompleto || undefined,
                      competencia: competenciaName,
                      score_original: Number(score),
                      pais: pais.trim(),
                      equipo: equipo.trim(),
                      seniority: seniority.trim(),
                      posicion: posicion.trim(),
                      familia_cargo: getFamiliaCargo(posicion),
                    });
                  }
                }
              }
            });
          });
        }

        resolve({ validRows, errors });
      } catch (error: any) {
        console.error('Error parsing Excel:', error);
        reject(new Error(`Error al analizar el archivo: ${error?.message || 'Error desconocido'}`));
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo. Verifica que sea un archivo Excel válido (.xlsx, .xls) o CSV'));
    
    try {
      reader.readAsBinaryString(file);
    } catch (error) {
      reject(new Error('No se pudo abrir el archivo. Verifica el formato'));
    }
  });
};
