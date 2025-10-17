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
  "Alto-Alto": "Key Players",
  "Alto-Medio": "High Potential",
  "Alto-Bajo": "Emerging Talent",
  "Medio-Alto": "Solid Performers",
  "Medio-Medio": "Core Contributors",
  "Medio-Bajo": "Inconsistent Performers",
  "Bajo-Alto": "High Potential/Low Performance",
  "Bajo-Medio": "Underperformers",
  "Bajo-Bajo": "Low Performers",
} as const;

export const QUADRANT_KEYS = {
  "Key Players": "Alto-Alto",
  "High Potential": "Alto-Medio",
  "Emerging Talent": "Alto-Bajo",
  "Solid Performers": "Medio-Alto",
  "Core Contributors": "Medio-Medio",
  "Inconsistent Performers": "Medio-Bajo",
  "High Potential/Low Performance": "Bajo-Alto",
  "Underperformers": "Bajo-Medio",
  "Low Performers": "Bajo-Bajo",
} as const;
