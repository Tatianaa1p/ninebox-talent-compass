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
  "Alto-Bajo": "Dilema",
  "Medio-Alto": "Consistente",
  "Medio-Medio": "Clave",
  "Medio-Bajo": "Estancamiento",
  "Bajo-Alto": "Confiable",
  "Bajo-Medio": "Enigma",
  "Bajo-Bajo": "Riesgo",
} as const;

export const QUADRANT_DESCRIPTIONS = {
  "Alto-Alto": "Empleados de alto rendimiento y gran potencial, listos para roles de liderazgo",
  "Alto-Medio": "Desempeño aceptable con alto potencial; requieren entrenamiento",
  "Alto-Bajo": "Bajo rendimiento actual, pero con alto potencial; necesitan apoyo",
  "Medio-Alto": "Rendimiento alto, pero con potencial moderado; ideales para roles estables",
  "Medio-Medio": "Desempeño y potencial moderados; necesitan evaluación",
  "Medio-Bajo": "Desempeño bajo con potencial moderado; riesgo de estancamiento",
  "Bajo-Alto": "Alto desempeño, pero con bajo potencial; roles estables",
  "Bajo-Medio": "Desempeño aceptable, bajo potencial; considerar reasignación",
  "Bajo-Bajo": "Bajo rendimiento y potencial; considerar salida",
} as const;

export const QUADRANT_KEYS = {
  "Talento Estratégico": "Alto-Alto",
  "Desarrollar": "Alto-Medio",
  "Dilema": "Alto-Bajo",
  "Consistente": "Medio-Alto",
  "Clave": "Medio-Medio",
  "Estancamiento": "Medio-Bajo",
  "Confiable": "Bajo-Alto",
  "Enigma": "Bajo-Medio",
  "Riesgo": "Bajo-Bajo",
} as const;
