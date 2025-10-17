export type PerformanceLevel = "Bajo" | "Medio" | "Alto";
export type PotentialLevel = "Bajo" | "Medio" | "Alto";

export interface Employee {
  id: string;
  name: string;
  manager: string;
  performance: PerformanceLevel;
  potential: PotentialLevel;
  performanceScore: number;
  potentialScore: number;
}

export interface NineBoxQuadrant {
  id: string;
  title: string;
  performance: PerformanceLevel;
  potential: PotentialLevel;
  color: string;
  employees: Employee[];
}
