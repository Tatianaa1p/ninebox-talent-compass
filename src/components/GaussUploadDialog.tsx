import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { parseGaussExcel } from '@/utils/gaussExcelParser';
import { useBulkInsertCalibraciones } from '@/hooks/queries/useCalibracionGaussQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface GaussUploadDialogProps {
  paisesPermitidos: string[];
  onTableroCreado?: (tableroId: string, pais: string) => void;
}

export const GaussUploadDialog = ({ paisesPermitidos, onTableroCreado }: GaussUploadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: any[] } | null>(null);
  const [selectedPais, setSelectedPais] = useState<string>('');
  const [tableroNombre, setTableroNombre] = useState<string>('');
  const [creatingTablero, setCreatingTablero] = useState(false);
  const bulkInsert = useBulkInsertCalibraciones();
  const queryClient = useQueryClient();

  const handleCreateAndUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedPais || !tableroNombre.trim()) {
      toast.error('Por favor selecciona un país y escribe el nombre del tablero');
      return;
    }

    setCreatingTablero(true);
    setUploading(true);
    setResult(null);

    try {
      // Create tablero first (empresa_id is optional when using pais)
      const { data: tablero, error: tableroError } = await supabase
        .from('tableros')
        .insert({
          nombre: tableroNombre.trim(),
          pais: selectedPais,
          empresa_id: null,
          equipo_id: null,
          modulo_origen: 'gauss', // Mark as Gauss module tablero for independence
        })
        .select()
        .single();

      if (tableroError) {
        console.error('Error creating tablero:', tableroError);
        toast.error(`No se pudo crear el tablero: ${tableroError.message}`);
        throw tableroError;
      }

      toast.success(`Tablero "${tableroNombre}" creado para ${selectedPais}`);
      
      // Invalidate tableros query to show new tablero in dropdown
      queryClient.invalidateQueries({ queryKey: ['tableros-pais'] });
      
      // Notify parent to select this tablero
      if (onTableroCreado) {
        onTableroCreado(tablero.id, selectedPais);
      }

      // Parse and upload data
      const { validRows, errors } = await parseGaussExcel(file);

      if (errors.length > 0) {
        console.warn('Parsing errors found:', errors);
      }

      if (validRows.length > 0) {
        const calibraciones = validRows.map(row => ({
          ...row,
          score_calibrado: row.score_original,
          tablero_id: tablero.id,
          fecha_evaluacion: new Date().toISOString().split('T')[0],
          ultima_calibracion_por: null,
          fecha_calibracion: null,
        }));

        await bulkInsert.mutateAsync(calibraciones);
        toast.success(`✅ ${validRows.length} evaluaciones cargadas al tablero "${tableroNombre}"`);
      } else if (errors.length > 0) {
        toast.error('No se pudo cargar ningún registro. Revisa los errores a continuación.');
      }

      setResult({
        success: validRows.length,
        errors,
      });

      if (errors.length === 0 && validRows.length > 0) {
        setTimeout(() => {
          setOpen(false);
          setSelectedPais('');
          setTableroNombre('');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      
      // Provide specific error messages
      if (error?.code === '42501') {
        toast.error('❌ No tienes permisos para crear tableros. Contacta al administrador.');
      } else if (error?.code === '23505') {
        toast.error('❌ Ya existe un tablero con ese nombre para este país.');
      } else if (error?.message) {
        toast.error(`❌ Error: ${error.message}`);
      } else {
        toast.error('❌ Error inesperado al procesar el archivo. Revisa el formato.');
      }
    } finally {
      setCreatingTablero(false);
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
              <Label>Seleccionar País</Label>
              <Select value={selectedPais} onValueChange={setSelectedPais}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un país" />
                </SelectTrigger>
                <SelectContent>
                  {paisesPermitidos.map(pais => (
                    <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPais && (
              <div>
                <Label>Nombre del Tablero</Label>
                <Input
                  value={tableroNombre}
                  onChange={(e) => setTableroNombre(e.target.value)}
                  placeholder="Ej: Evaluación Q1 2024"
                />
              </div>
            )}
          </div>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleCreateAndUpload}
              disabled={uploading || !selectedPais || !tableroNombre.trim()}
              className="hidden"
              id="gauss-file-upload"
            />
            <label 
              htmlFor="gauss-file-upload" 
              className={(!selectedPais || !tableroNombre.trim()) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {(!selectedPais || !tableroNombre.trim()) 
                  ? 'Completa país y nombre del tablero primero' 
                  : 'Haz clic para seleccionar un archivo o arrastra aquí'}
              </p>
            </label>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formatos aceptados:</strong> Excel (.xlsx, .xls) y CSV<br />
              <strong>Columnas flexibles:</strong> País, Equipo, Posición, Seniority, Nombre completo, Competencias<br />
              <strong>Competencias:</strong> Acepta nombres largos (ej: "Mánager - Orientación al cliente: descripción...")<br />
              <em className="text-xs">El sistema normaliza automáticamente mayúsculas, tildes, espacios y extrae el nombre de la competencia.</em>
            </AlertDescription>
          </Alert>

          {(uploading || creatingTablero) && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {creatingTablero ? 'Creando tablero y procesando archivo...' : 'Procesando archivo...'}
              </p>
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
