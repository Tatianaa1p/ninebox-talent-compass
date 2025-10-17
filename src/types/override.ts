import { PerformanceLevel, PotentialLevel } from "./employee";

export interface EmployeeOverride {
  employeeName: string;
  override_potencial_categoria?: PotentialLevel;
  override_desempeno_categoria?: PerformanceLevel;
  override_cuadrante: string;
  override_motivo?: string;
  override_fecha: string;
  override_usuario?: string;
}

export interface OverrideHistory {
  employeeName: string;
  timestamp: string;
  action: "move" | "edit" | "revert";
  from?: string;
  to?: string;
  motivo?: string;
}

export type ViewMode = "original" | "calibrada";

export const QUADRANT_NAMES = {
  "Alto-Alto": "Talento Estratégico",
  "Alto-Medio": "Desarrollar",
  "Alto-Bajo": "Enigma",
  "Medio-Alto": "Consistente",
  "Medio-Medio": "Clave",
  "Medio-Bajo": "Dilema",
  "Bajo-Alto": "Confiable",
  "Bajo-Medio": "Estancamiento",
  "Bajo-Bajo": "Riesgo",
} as const;

export const QUADRANT_DESCRIPTIONS = {
  "Alto-Alto": "Supera consistentemente las expectativas, muestra impacto y potencial de crecimiento. Se recomienda diseñar acciones para asegurar su continuo crecimiento y desarrollo.",
  "Alto-Medio": "Colaborador que muestra altas cualidades para seguir creciendo dentro de la empresa pero aún requiere desarrollo en su propia área para poder desempeñar roles de mayor responsabilidad.",
  "Alto-Bajo": "Conviene entrenarlo y desarrollar sus capacidades, necesita claridad, foco y apoyo del líder.",
  "Medio-Alto": "Persona con muy buen desempeño y resultados constantes, con posibilidad de seguir creciendo, aunque su proyección a roles más complejos es moderada.",
  "Medio-Medio": "Colaborador que muestra un desempeño y potencial balanceado. Es recomendable observarlo y decidir si es candidato a tomar un rol de mayor liderazgo, o si se requiere algún movimiento para continuar su desarrollo.",
  "Medio-Bajo": "Colaborador que muestra potencial de crecimiento, pero da un mal desempeño en sus labores. Se recomienda apoyarlo para mejorar su desempeño, con riguroso plan de desarrollo.",
  "Bajo-Alto": "Colaborador que se desempeña con excelencia y es clave para asegurar los objetivos del área pero no muestra cualidades para tomar un rol de mayores responsabilidades. Se sugiere mantenerlo motivado en la empresa y que transfiera sus conocimientos a otros.",
  "Bajo-Medio": "Cumple satisfactoriamente con su trabajo pero no muestra cualidades para ocupar una posición de mayor responsabilidad.",
  "Bajo-Bajo": "Requiere seguimiento permanente, acciones contundentes o reconsiderar su rol.",
} as const;

export const QUADRANT_KEYS = {
  "Talento Estratégico": "Alto-Alto",
  "Desarrollar": "Alto-Medio",
  "Enigma": "Alto-Bajo",
  "Consistente": "Medio-Alto",
  "Clave": "Medio-Medio",
  "Dilema": "Medio-Bajo",
  "Confiable": "Bajo-Alto",
  "Estancamiento": "Bajo-Medio",
  "Riesgo": "Bajo-Bajo",
} as const;
