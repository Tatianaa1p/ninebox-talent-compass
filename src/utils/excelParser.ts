import * as XLSX from "xlsx";
import { Employee, PerformanceLevel, PotentialLevel } from "@/types/employee";

// Helper function to normalize performance/potential values based on thresholds (1-3 scale)
const normalizePerformanceLevel = (value: number): "Bajo" | "Medio" | "Alto" => {
  if (value >= 3) return "Alto";
  if (value >= 2) return "Medio";
  return "Bajo";
};

const normalizePotentialLevel = (value: number): "Bajo" | "Medio" | "Alto" => {
  if (value >= 3) return "Alto";
  if (value >= 2) return "Medio";
  return "Bajo";
};

// Helper function to parse numeric value from string or number
const parseNumericValue = (value: string | number | undefined): number | null => {
  if (value === undefined || value === null || value === "") return null;
  
  // Handle numeric values - convert comma to dot for decimal parsing, trim spaces
  const numStr = String(value).trim().replace(",", ".");
  const num = parseFloat(numStr);
  
  return isNaN(num) ? null : num;
};

// Helper function to parse and validate score in 1-3 range
const parseAndValidateScore = (value: string | number | undefined, fieldName: string): number | null => {
  const parsed = parseNumericValue(value);
  if (parsed === null) return null;
  
  // Clamp to 1-3 range and log
  const clamped = Math.max(1, Math.min(3, parsed));
  console.log(`${fieldName} raw: "${value}", parsed: ${parsed}, clamped: ${clamped}`);
  
  return clamped;
};

export interface EmployeeRawData {
  name: string;
  manager: string;
  performanceScore: number;
  potentialScore: number;
}

export const parseExcelFiles = async (
  performanceFile: File,
  potentialFile: File
): Promise<{ employees: Employee[]; unclassified: any[]; rawData: EmployeeRawData[] }> => {
  try {
    // Read both files
    const perfBuffer = await performanceFile.arrayBuffer();
    const potBuffer = await potentialFile.arrayBuffer();
    
    const perfWorkbook = XLSX.read(perfBuffer);
    const potWorkbook = XLSX.read(potBuffer);
    
    // Get first sheet from each
    const perfSheet = perfWorkbook.Sheets[perfWorkbook.SheetNames[0]];
    const potSheet = potWorkbook.Sheets[potWorkbook.SheetNames[0]];
    
    // Convert to JSON
    const perfData: any[] = XLSX.utils.sheet_to_json(perfSheet);
    const potData: any[] = XLSX.utils.sheet_to_json(potSheet);
    
    // Create a map for potential data
    // Try ALL possible column names for Potential
    const potentialMap = new Map();
    potData.forEach((row) => {
      const name = row["Nombre completo"];
      if (!name) return;
      
      // Try ALL possible variants of Potential column (with trim for spaces)
      let potentialScore = 
        row["Puntuación promedio"] || 
        row["Puntuacion promedio"] ||
        row["Potencial"] || 
        row["potencial"] || 
        row["POTENCIAL"] ||
        row["Pot."] || 
        row["Nivel de Potencial"] || 
        row["potential"] || 
        row["Potential"] ||
        row["POTENTIAL"] ||
        row["Potencial "] ||  // Con espacio al final
        row[" Potencial"] ||  // Con espacio al inicio
        row["R"];
      
      // Skip if no score found or empty
      if (potentialScore === undefined || potentialScore === null || potentialScore === "") return;
      
      // Trim spaces and convert comma to dot for decimal numbers
      if (typeof potentialScore === "string") {
        potentialScore = potentialScore.trim().replace(",", ".");
      }
      
      potentialMap.set(name, potentialScore);
    });
    
    const rawData: EmployeeRawData[] = [];
    const unclassified: any[] = [];
    
    // Process performance data and merge with potential
    // Using column AG ("Puntuación promedio") from perfomance.xlsx
    perfData.forEach((row) => {
      const name = row["Nombre completo"];
      if (!name) return;
      
      const manager = row["Mánager"] || row["Manager"];
      
      // Try ALL possible variants of Performance column
      let performanceValue = 
        row["Puntuación promedio"] || 
        row["Puntuacion promedio"] ||
        row["Desempeño"] || 
        row["desempeño"] || 
        row["DESEMPEÑO"] ||
        row["Performance"] || 
        row["performance"] || 
        row["PERFORMANCE"] ||
        row["AG"];
      const performanceScore = parseAndValidateScore(performanceValue, `Performance [${name}]`);
      
      // Get potential score from the map
      const potentialValue = potentialMap.get(name);
      const potentialScore = parseAndValidateScore(potentialValue, `Potential [${name}]`);
      
      // Skip if either value is missing or empty
      if (performanceScore === null || potentialScore === null) {
        unclassified.push({
          name,
          manager,
          performanceRaw: performanceValue,
          potentialRaw: potentialValue,
          reason: performanceScore === null ? "Sin puntuación de desempeño" : "Sin puntuación de potencial",
        });
        return;
      }
      
      rawData.push({
        name,
        manager: manager || "Sin asignar",
        performanceScore,
        potentialScore,
      });
    });
    
    // Convert raw data to employees with updated thresholds
    // Potencial: Bajo ≤1.5, Medio >1.5 hasta ≤2.5, Alto >2.5
    // Desempeño: Bajo <3, Medio ≥3 hasta <4, Alto ≥4
    const employees: Employee[] = rawData.map((data) => ({
      id: `${data.name}-${Date.now()}-${Math.random()}`,
      name: data.name,
      manager: data.manager,
      performanceScore: data.performanceScore,
      potentialScore: data.potentialScore,
      performance: normalizePerformanceLevel(data.performanceScore),
      potential: normalizePotentialLevel(data.potentialScore),
    }));
    
    return { employees, unclassified, rawData };
  } catch (error) {
    console.error("Error parsing Excel files:", error);
    throw new Error("Error al procesar los archivos Excel");
  }
};

export const loadDefaultData = async (): Promise<{
  employees: Employee[];
  unclassified: any[];
  rawData: EmployeeRawData[];
}> => {
  try {
    const [perfResponse, potResponse] = await Promise.all([
      fetch("/data/perfomance.xlsx"),
      fetch("/data/potencial.xlsx"),
    ]);
    
    if (!perfResponse.ok || !potResponse.ok) {
      throw new Error("No se pudieron cargar los archivos por defecto");
    }
    
    const perfBlob = await perfResponse.blob();
    const potBlob = await potResponse.blob();
    
    const perfFile = new File([perfBlob], "perfomance.xlsx");
    const potFile = new File([potBlob], "potencial.xlsx");
    
    return parseExcelFiles(perfFile, potFile);
  } catch (error) {
    console.error("Error loading default data:", error);
    return { employees: [], unclassified: [], rawData: [] };
  }
};
