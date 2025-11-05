import * as XLSX from 'xlsx';
import { COMPETENCIAS, getFamiliaCargo, UploadError, UploadResult } from '@/types/gauss';

export interface ParsedRow {
  empleado_email: string;
  competencia: string;
  score_original: number;
  pais: string;
  equipo: string;
  seniority: string;
  posicion: string;
  familia_cargo: string;
}

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

        jsonData.forEach((row: any, index: number) => {
          const rowErrors: string[] = [];
          const rowNumber = index + 2; // +2 because index starts at 0 and we skip header

          // Validate required fields
          if (!row.empleado_email) {
            rowErrors.push('Falta empleado_email');
          } else if (!validateEmail(row.empleado_email)) {
            rowErrors.push('Email inválido');
          }

          if (!row.competencia) {
            rowErrors.push('Falta competencia');
          } else if (!validateCompetencia(row.competencia)) {
            rowErrors.push(`Competencia no válida: "${row.competencia}"`);
          }

          if (row.score_original === undefined || row.score_original === null) {
            rowErrors.push('Falta score_original');
          } else if (!validateScore(Number(row.score_original))) {
            rowErrors.push(`Score debe estar entre 1.0 y 4.0 (actual: ${row.score_original})`);
          }

          if (!row.pais) rowErrors.push('Falta país');
          if (!row.equipo) rowErrors.push('Falta equipo');
          if (!row.seniority) rowErrors.push('Falta seniority');
          if (!row.posicion) rowErrors.push('Falta posición');

          if (rowErrors.length > 0) {
            errors.push({ row: rowNumber, errors: rowErrors });
          } else {
            validRows.push({
              empleado_email: row.empleado_email.trim(),
              competencia: row.competencia.trim(),
              score_original: Number(row.score_original),
              pais: row.pais.trim(),
              equipo: row.equipo.trim(),
              seniority: row.seniority.trim(),
              posicion: row.posicion.trim(),
              familia_cargo: getFamiliaCargo(row.posicion),
            });
          }
        });

        resolve({ validRows, errors });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
