export type GaussRole = 'hrbp' | 'hrbp_cl' | 'manager' | 'manager_cl';

export interface GaussUserRole {
  id: string;
  user_id: string;
  email: string;
  role: GaussRole;
  created_at: string;
}

export interface CalibracionGauss {
  id: string;
  empleado_email: string;
  nombre_completo?: string;
  competencia: string;
  familia_cargo: string;
  score_original: number;
  score_calibrado: number;
  pais: string;
  equipo: string;
  seniority: string;
  posicion: string;
  tablero_id?: string;
  fecha_evaluacion: string;
  ultima_calibracion_por: string | null;
  fecha_calibracion: string | null;
  created_at: string;
  updated_at: string;
}

export const COMPETENCIAS = [
  "Orientación al Cliente",
  "Trabajo en Equipo",
  "Comunicación Efectiva",
  "Pensamiento Analítico y Toma de Decisiones",
  "Protagonismo del Cambio",
  "Gestión del Cambio e Innovación",
  "Visión de Negocio y Orientación a Resultados",
  "Negociación Efectiva",
  "Integridad Profesional y Respeto por las personas",
  "Liderazgo y Desarrollo de Equipo",
  "Gestión de Proyectos y Operaciones",
  "Proactividad",
  "Innovación",
  "Dominio en el Rol"
] as const;

export const FAMILIAS_CARGO = {
  "Consultoría y Ejecución": ["trainee", "jr", "analista", "consultor"],
  "Especialistas y Desarrolladores de Negocio": ["especialista", "desarrollador"],
  "Líderes de Proyectos/Equipos": ["líder", "coordinador"],
  "Liderazgo Organizacional": ["gerente", "director", "c-level"]
} as const;

export function getFamiliaCargo(posicion: string): string {
  const posicionLower = posicion.toLowerCase();
  
  for (const [familia, posiciones] of Object.entries(FAMILIAS_CARGO)) {
    if (posiciones.some(p => posicionLower.includes(p))) {
      return familia;
    }
  }
  
  return "Consultoría y Ejecución"; // Default
}

export interface UploadError {
  row: number;
  errors: string[];
}

export interface UploadResult {
  success: number;
  errors: UploadError[];
}
