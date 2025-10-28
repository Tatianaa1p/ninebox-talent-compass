import * as XLSX from "xlsx";
import { Employee, PerformanceLevel, PotentialLevel } from "@/types/employee";

// Helper function to normalize performance/potential values based on thresholds
// Desempeño: < 3 = Bajo, < 4 = Medio, >= 4 = Alto
const normalizePerformanceLevel = (value: number): "Bajo" | "Medio" | "Alto" => {
  if (value >= 4) return "Alto";
  if (value >= 3) return "Medio";
  return "Bajo";
};

// Potencial: <= 1.5 = Bajo, <= 2.5 = Medio, > 2.5 = Alto
const normalizePotentialLevel = (value: number): "Bajo" | "Medio" | "Alto" => {
  if (value > 2.5) return "Alto";
  if (value > 1.5) return "Medio";
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

// Helper function to parse and validate score (1-5 scale)
const parseAndValidateScore = (value: string | number | undefined, fieldName: string): number | null => {
  const parsed = parseNumericValue(value);
  if (parsed === null) return null;
  
  // Log for debugging
  console.log(`${fieldName} raw: "${value}", parsed: ${parsed}`);
  
  return parsed;
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
    const potentialMap = new Map();
    potData.forEach((row, index) => {
      const name = row["Nombre completo"];
      if (!name) return;
      
      // Log ALL columns for first 3 employees
      if (index < 3) {
        console.log(`\n🟢 ========== POTENTIAL ROW ${index}: ${name} ==========`);
        console.log("📋 Todas las columnas y valores:");
        Object.keys(row).forEach(key => {
          const value = row[key];
          console.log(`  "${key}": "${value}" (tipo: ${typeof value})`);
        });
      }
      
      // Find column that contains "promedio" and is numeric
      let potentialScore = null;
      const allKeys = Object.keys(row);
      
      for (const key of allKeys) {
        if (key.includes("promedio") || key.includes("Promedio")) {
          const val = row[key];
          const numVal = parseFloat(String(val));
          if (!isNaN(numVal) && numVal >= 1 && numVal <= 5) {
            potentialScore = val;
            console.log(`✅ [${name}] Encontré columna potential: "${key}" = ${val}`);
            break;
          }
        }
      }
      
      // Skip if no score found
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
    // CRITICAL: Use ONLY "Puntuación promedio" (numeric), NOT "Puntuación de desempeño" (text)
    perfData.forEach((row, index) => {
      const name = row["Nombre completo"];
      if (!name) return;
      
      const manager = row["Mánager"] || row["Manager"];
      
      // Log ALL columns and values for first 3 employees to debug
      if (index < 3) {
        console.log(`\n🔍 ========== ROW ${index}: ${name} ==========`);
        console.log("📋 Todas las columnas y valores:");
        Object.keys(row).forEach(key => {
          const value = row[key];
          console.log(`  "${key}": "${value}" (tipo: ${typeof value})`);
        });
      }
      
      // Search for "Puntuación promedio" that is NUMERIC (not text like "Alta")
      let performanceValue = null;
      const allKeys = Object.keys(row);
      
      // Find column that contains "promedio" and is numeric
      for (const key of allKeys) {
        if (key.includes("promedio") || key.includes("Promedio")) {
          const val = row[key];
          const numVal = parseFloat(String(val));
          if (!isNaN(numVal) && numVal >= 1 && numVal <= 5) {
            performanceValue = val;
            console.log(`✅ [${name}] Encontré columna performance: "${key}" = ${val}`);
            break;
          }
        }
      }
      
      if (!performanceValue) {
        console.warn(`❌ [${name}] NO encontré columna performance válida`);
      }
      
      const performanceScore = parseAndValidateScore(performanceValue, `Performance [${name}]`);
      
      // Get potential score from the map
      const potentialValue = potentialMap.get(name);
      console.log(`🎯 Potential [${name}]: encontrado en mapa = "${potentialValue}"`);
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
    
    // Convert raw data to employees with thresholds:
    // Desempeño: Bajo <3, Medio ≥3 hasta <4, Alto ≥4
    // Potencial: Bajo ≤1.5, Medio >1.5 hasta ≤2.5, Alto >2.5
    const employees: Employee[] = rawData.map((data) => {
      const performance = normalizePerformanceLevel(data.performanceScore);
      const potential = normalizePotentialLevel(data.potentialScore);
      
      // Determine Nine Box category
      const getNineBoxCategory = (perf: string, pot: string): string => {
        if (perf === "Bajo" && pot === "Bajo") return "Riesgo";
        if (perf === "Bajo" && pot === "Medio") return "Dilema";
        if (perf === "Bajo" && pot === "Alto") return "Enigma";
        if (perf === "Medio" && pot === "Bajo") return "Estancamiento";
        if (perf === "Medio" && pot === "Medio") return "Clave";
        if (perf === "Medio" && pot === "Alto") return "Desarrollar";
        if (perf === "Alto" && pot === "Bajo") return "Confiable";
        if (perf === "Alto" && pot === "Medio") return "Consistente";
        if (perf === "Alto" && pot === "Alto") return "Talento Estratégico";
        return "Unknown";
      };
      
      const category = getNineBoxCategory(performance, potential);
      
      // Debug log
      console.log(`📊 ${data.name}:
        Desempeño: ${data.performanceScore.toFixed(2)} → ${performance}
        Potencial: ${data.potentialScore.toFixed(2)} → ${potential}
        Box: ${category}`);
      
      return {
        id: `${data.name}-${Date.now()}-${Math.random()}`,
        name: data.name,
        manager: data.manager,
        performanceScore: data.performanceScore,
        potentialScore: data.potentialScore,
        performance,
        potential,
      };
    });
    
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
