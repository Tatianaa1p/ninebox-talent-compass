import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface FileUploaderProps {
  onFilesUploaded: (performanceData: Array<{nombre: string, performance: number}>, potentialData: Array<{nombre: string, potencial: number}>) => void;
  onClose: () => void;
}

export const FileUploader = ({ onFilesUploaded, onClose }: FileUploaderProps) => {
  const [performanceFile, setPerformanceFile] = useState<File | null>(null);
  const [potentialFile, setPotentialFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const parseFile = async (file: File, type: 'performance' | 'potencial'): Promise<Array<any>> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(error)
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Error leyendo archivo'));
        reader.readAsBinaryString(file);
      } else {
        reject(new Error('Formato de archivo no soportado'));
      }
    });
  };

  const validateAndTransform = (data: Array<any>, type: 'performance' | 'potencial') => {
    const scoreKey = type === 'performance' ? 'performance' : 'potencial';
    const validated = [];
    
    for (const row of data) {
      if (!row.nombre || row.nombre.trim() === '') continue;
      
      const score = parseFloat(row[scoreKey]);
      if (isNaN(score) || score < 1 || score > 5) {
        throw new Error(`Valor inválido para ${row.nombre}: ${scoreKey} debe estar entre 1 y 5`);
      }
      
      validated.push({
        nombre: row.nombre.trim(),
        [scoreKey]: score
      });
    }
    
    return validated;
  };

  const handleSubmit = async () => {
    if (!performanceFile || !potentialFile) {
      toast({
        title: "Archivos faltantes",
        description: "Por favor selecciona ambos archivos",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const performanceRaw = await parseFile(performanceFile, 'performance');
      const potentialRaw = await parseFile(potentialFile, 'potencial');
      
      const performanceData = validateAndTransform(performanceRaw, 'performance');
      const potentialData = validateAndTransform(potentialRaw, 'potencial');
      
      await onFilesUploaded(performanceData, potentialData);
      
      toast({
        title: "Archivos procesados",
        description: `${performanceData.length} empleados cargados exitosamente`,
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Error al procesar archivos",
        description: error.message || "Verifica el formato de los archivos",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Archivo de Desempeño (Performance)
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            CSV o Excel con columnas: nombre, performance (1-5)
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setPerformanceFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {performanceFile && (
            <p className="text-xs text-muted-foreground mt-1">
              ✓ {performanceFile.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Archivo de Potencial (Potential)
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            CSV o Excel con columnas: nombre, potencial (1-5)
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setPotentialFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {potentialFile && (
            <p className="text-xs text-muted-foreground mt-1">
              ✓ {potentialFile.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onClose} disabled={isProcessing}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!performanceFile || !potentialFile || isProcessing}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isProcessing ? "Procesando..." : "Procesar Archivos"}
        </Button>
      </div>
    </div>
  );
};
