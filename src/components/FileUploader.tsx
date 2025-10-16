import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onFilesUploaded: (performanceFile: File, potentialFile: File) => void;
}

export const FileUploader = ({ onFilesUploaded }: FileUploaderProps) => {
  const [performanceFile, setPerformanceFile] = useState<File | null>(null);
  const [potentialFile, setPotentialFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!performanceFile || !potentialFile) {
      toast({
        title: "Archivos faltantes",
        description: "Por favor selecciona ambos archivos Excel",
        variant: "destructive",
      });
      return;
    }

    onFilesUploaded(performanceFile, potentialFile);
    toast({
      title: "Archivos procesados",
      description: "Los datos han sido cargados exitosamente",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cargar Archivos Excel</CardTitle>
        <CardDescription>
          Selecciona los archivos de evaluación de desempeño y potencial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Archivo de Desempeño (Performance)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setPerformanceFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Archivo de Potencial (Potential)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setPotentialFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full" disabled={!performanceFile || !potentialFile}>
          <Upload className="mr-2 h-4 w-4" />
          Procesar Archivos
        </Button>
      </CardContent>
    </Card>
  );
};
