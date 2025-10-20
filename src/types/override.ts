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
  "Medio-Alto": "Desarrollar",
  "Alto-Medio": "Consistente",
  "Medio-Medio": "Clave",
  "Bajo-Alto": "Dilema",
  "Medio-Bajo": "Enigma",
  "Alto-Bajo": "Confiable",
  "Bajo-Medio": "Estancamiento",
  "Bajo-Bajo": "Riesgo",
} as const;

export const QUADRANT_DESCRIPTIONS = {
  "Alto-Alto": "Empleados de alto rendimiento y gran potencial, listos para roles de liderazgo",
  "Medio-Alto": "Desempeño sobresaliente, pero con potencial moderado; necesitan desarrollo dirigido",
  "Alto-Medio": "Rendimiento alto, pero con potencial limitado; ideales para roles estables",
  "Medio-Medio": "Desempeño aceptable con alto potencial; requieren entrenamiento",
  "Bajo-Alto": "Desempeño y potencial moderados; necesitan evaluación",
  "Medio-Bajo": "Desempeño aceptable, bajo potencial; considerar reasignación",
  "Alto-Bajo": "Bajo rendimiento actual, pero con potencial; necesitan apoyo",
  "Bajo-Medio": "Desempeño bajo con potencial moderado; riesgo de estancamiento",
  "Bajo-Bajo": "Bajo rendimiento y potencial; considerar salida",
} as const;

export const QUADRANT_KEYS = {
  "Talento Estratégico": "Alto-Alto",
  "Desarrollar": "Medio-Alto",
  "Consistente": "Alto-Medio",
  "Clave": "Medio-Medio",
  "Dilema": "Bajo-Alto",
  "Enigma": "Medio-Bajo",
  "Confiable": "Alto-Bajo",
  "Estancamiento": "Bajo-Medio",
  "Riesgo": "Bajo-Bajo",
} as const;
