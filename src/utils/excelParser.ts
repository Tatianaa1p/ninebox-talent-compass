import * as XLSX from "xlsx";
import { Employee, PerformanceLevel, PotentialLevel } from "@/types/employee";

// Helper function to normalize performance/potential values
// Bajo: menor a 3, Medio: entre 3 y 4, Alto: mayor o igual a 4
const normalizeLevel = (value: string | number | undefined): "Bajo" | "Medio" | "Alto" | null => {
  if (!value) return null;
  
  const str = String(value).toLowerCase().trim();
  
  // Handle Spanish variations
  if (str.includes("alto") || str.includes("alta") || str.includes("excede")) return "Alto";
  if (str.includes("medio") || str.includes("media") || str.includes("cumple")) return "Medio";
  if (str.includes("bajo") || str.includes("baja") || str.includes("no cumple")) return "Bajo";
  
  // Handle numeric values with new thresholds
  const num = parseFloat(String(value));
  if (!isNaN(num)) {
    if (num >= 4) return "Alto";
    if (num >= 3) return "Medio";
    return "Bajo";
  }
  
  return null;
};

export const parseExcelFiles = async (
  performanceFile: File,
  potentialFile: File
): Promise<{ employees: Employee[]; unclassified: any[] }> => {
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
    // Using column R or "Puntuación promedio" from potencial.xlsx
    const potentialMap = new Map();
    potData.forEach((row) => {
      const name = row["Nombre completo"];
      // Try to get the value from different possible column names
      const potentialScore = row["Puntuación promedio"] || row["R"] || row["Puntuacion promedio"];
      if (name && potentialScore !== undefined) {
        potentialMap.set(name, potentialScore);
      }
    });
    
    const employees: Employee[] = [];
    const unclassified: any[] = [];
    
    // Process performance data and merge with potential
    // Using column AG or "Puntuación promedio" from perfomance.xlsx
    perfData.forEach((row) => {
      const name = row["Nombre completo"];
      const manager = row["Mánager"] || row["Manager"];
      // Try to get the value from different possible column names (AG is column 33 in Excel)
      const performanceValue = row["Puntuación promedio"] || row["AG"] || row["Puntuacion promedio"];
      const potentialScore = potentialMap.get(name);
      
      if (!name) return;
      
      const performance = normalizeLevel(performanceValue);
      const potential = normalizeLevel(potentialScore);
      
      if (performance && potential) {
        employees.push({
          id: `${name}-${Date.now()}-${Math.random()}`,
          name,
          manager: manager || "Sin asignar",
          performance,
          potential,
        });
      } else {
        unclassified.push({
          name,
          manager,
          performanceRaw: performanceValue,
          potentialRaw: potentialScore,
          reason: !performance ? "Performance no válido" : "Potencial no válido",
        });
      }
    });
    
    return { employees, unclassified };
  } catch (error) {
    console.error("Error parsing Excel files:", error);
    throw new Error("Error al procesar los archivos Excel");
  }
};

export const loadDefaultData = async (): Promise<{
  employees: Employee[];
  unclassified: any[];
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
    return { employees: [], unclassified: [] };
  }
};
