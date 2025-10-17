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
  "Alto-Alto": "1. Talento Estratégico",
  "Alto-Medio": "2. Crecimiento Acelerado",
  "Alto-Bajo": "5. Potencial No Visible",
  "Medio-Alto": "3. Desempeño Consistente",
  "Medio-Medio": "6. Evolución",
  "Medio-Bajo": "8. En Revisión",
  "Bajo-Alto": "4. Comprometido",
  "Bajo-Medio": "7. En Riesgo de Estancamiento",
  "Bajo-Bajo": "9. Desempeño Insuficiente",
} as const;

export const QUADRANT_DESCRIPTIONS = {
  "Alto-Alto": "Supera consistentemente las expectativas, muestra impacto y potencial de crecimiento. Son futuros líderes o referentes técnicos.",
  "Alto-Medio": "Buen desempeño y alto potencial. Pueden asumir proyectos más desafiantes o responsabilidades transversales.",
  "Alto-Bajo": "Tienen potencial, pero desempeño por debajo de lo esperado. Necesitan foco, claridad y apoyo del líder.",
  "Medio-Alto": "Cumple las expectativas con resultados consistentes pero sin sobresalir. Base sólida del equipo.",
  "Medio-Medio": "Desempeño correcto, sin destacar. Margen para desarrollo y aprendizaje.",
  "Medio-Bajo": "Desempeño y potencial intermedios. Requieren plan de mejora o redefinición del rol.",
  "Bajo-Alto": "Supera expectativas en entrega, pero sin potencial para crecer. Valiosos en su rol actual.",
  "Bajo-Medio": "Cumple lo mínimo, sin iniciativa. Recomienda feedback directo o revisión.",
  "Bajo-Bajo": "Desempeño por debajo de lo esperado. Requiere acción inmediata o plan de salida.",
} as const;

export const QUADRANT_KEYS = {
  "1. Talento Estratégico": "Alto-Alto",
  "2. Crecimiento Acelerado": "Alto-Medio",
  "5. Potencial No Visible": "Alto-Bajo",
  "3. Desempeño Consistente": "Medio-Alto",
  "6. Evolución": "Medio-Medio",
  "8. En Revisión": "Medio-Bajo",
  "4. Comprometido": "Bajo-Alto",
  "7. En Riesgo de Estancamiento": "Bajo-Medio",
  "9. Desempeño Insuficiente": "Bajo-Bajo",
} as const;
