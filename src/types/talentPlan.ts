export type TipoTalentPlan = 'desarrollo' | 'riesgo';
export type PipEstado = 'pendiente' | 'en_curso' | 'completado' | 'cancelado';
export type AccionEstado = 'pendiente' | 'en_curso' | 'completado';

export const PIP_ESTADO_LABELS: Record<PipEstado, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export const ACCION_ESTADO_LABELS: Record<AccionEstado, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  completado: 'Completado',
};

export interface TalentPlan {
  id: string;
  empleado_id: string;
  tablero_id: string;
  tipo: TipoTalentPlan;
  notas: string | null;
  plan_carrera: string | null;
  mentor: string | null;
  proyectos_clave: string | null;
  pip_objetivo: string | null;
  pip_fecha_inicio: string | null;
  pip_fecha_fin: string | null;
  pip_estado: PipEstado | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TalentAccion {
  id: string;
  plan_id: string;
  descripcion: string;
  fecha_limite: string | null;
  responsable: string | null;
  estado: AccionEstado;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TalentNota {
  id: string;
  plan_id: string;
  contenido: string;
  autor_email: string | null;
  created_by: string | null;
  created_at: string;
}

export type CuadrantePotencial =
  | 'Talento Estratégico'
  | 'Desarrollar'
  | 'Consistente'
  | 'Enigma'
  | 'Clave'
  | 'Confiable'
  | 'Dilema'
  | 'Estancamiento'
  | 'Riesgo';

export interface EmpleadoConPlan {
  id: string;
  nombre: string;
  performance: number;
  potencial: number;
  tablero_id: string;
  cuadrante: CuadrantePotencial;
  tipo: TipoTalentPlan;
  plan: TalentPlan | null;
  acciones: TalentAccion[];
  notas: TalentNota[];
}
