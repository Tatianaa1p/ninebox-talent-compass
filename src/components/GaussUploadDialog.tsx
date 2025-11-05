import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { parseGaussExcel } from '@/utils/gaussExcelParser';
import { useBulkInsertCalibraciones } from '@/hooks/queries/useCalibracionGaussQuery';
import { useTablerosQuery } from '@/hooks/queries/useTablerosQuery';
import { useEquiposQuery } from '@/hooks/queries/useEquiposQuery';
import { toast } from 'sonner';

export const GaussUploadDialog = () => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: any[] } | null>(null);
  const [selectedEquipo, setSelectedEquipo] = useState<string>('');
  const [selectedTablero, setSelectedTablero] = useState<string>('');
  const bulkInsert = useBulkInsertCalibraciones();
  const { data: equipos = [] } = useEquiposQuery();
  const { data: tableros = [] } = useTablerosQuery(selectedEquipo);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedTablero) {
      toast.error('Por favor selecciona un tablero antes de subir el archivo');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const { validRows, errors } = await parseGaussExcel(file);

      if (validRows.length > 0) {
        const calibraciones = validRows.map(row => ({
          ...row,
          score_calibrado: row.score_original,
          tablero_id: selectedTablero,
          fecha_evaluacion: new Date().toISOString().split('T')[0],
          ultima_calibracion_por: null,
          fecha_calibracion: null,
        }));

        await bulkInsert.mutateAsync(calibraciones);
        toast.success(`${validRows.length} evaluaciones cargadas exitosamente al tablero`);
      }

      setResult({
        success: validRows.length,
        errors,
      });

      if (errors.length === 0 && validRows.length > 0) {
        setTimeout(() => {
          setOpen(false);
          setSelectedEquipo('');
          setSelectedTablero('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al procesar el archivo');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Subir Evaluación
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir Evaluación de Competencias</DialogTitle>
          <DialogDescription>
            Formatos aceptados: .xlsx, .xls, .csv
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Seleccionar Equipo</Label>
              <Select value={selectedEquipo} onValueChange={setSelectedEquipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipos.map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>{eq.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEquipo && (
              <div>
                <Label>Seleccionar Tablero</Label>
                <Select value={selectedTablero} onValueChange={setSelectedTablero}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tablero" />
                  </SelectTrigger>
                  <SelectContent>
                    {tableros.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={uploading || !selectedTablero}
              className="hidden"
              id="gauss-file-upload"
            />
            <label htmlFor="gauss-file-upload" className={!selectedTablero ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}>
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {!selectedTablero ? 'Selecciona un tablero primero' : 'Haz clic para seleccionar un archivo o arrastra aquí'}
              </p>
            </label>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formatos aceptados:</strong> Excel (.xlsx, .xls) y CSV<br />
              <strong>Columnas flexibles:</strong> País, Equipo, Posición, Seniority, Nombre completo, Competencias<br />
              <em className="text-xs">El sistema normaliza automáticamente mayúsculas, tildes y espacios.</em>
            </AlertDescription>
          </Alert>

          {uploading && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Procesando archivo...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {result.success > 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>{result.success} registros cargados exitosamente</strong>
                  </AlertDescription>
                </Alert>
              )}

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{result.errors.length} errores encontrados:</strong>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      {result.errors.map((err, idx) => (
                        <div key={idx} className="text-xs mt-1">
                          Fila {err.row}: {err.errors.join(', ')}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
