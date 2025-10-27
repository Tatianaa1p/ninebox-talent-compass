import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Employee } from "@/types/employee";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmployeeEditDialogProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
  onSave: (quadrant: string, success: boolean) => void;
  currentOverrideMotivo?: string;
  tableroId?: string;
}

const QUADRANTS = [
  { value: "Alto-Alto", label: "Talento Estratégico", performance: 4.5, potential: 3.0 },
  { value: "Alto-Medio", label: "Desarrollar", performance: 3.5, potential: 3.0 },
  { value: "Alto-Bajo", label: "Enigma", performance: 2.0, potential: 3.0 },
  { value: "Medio-Alto", label: "Consistente", performance: 4.5, potential: 2.0 },
  { value: "Medio-Medio", label: "Clave", performance: 3.5, potential: 2.0 },
  { value: "Medio-Bajo", label: "Dilema", performance: 2.0, potential: 2.0 },
  { value: "Bajo-Alto", label: "Confiable", performance: 4.5, potential: 1.0 },
  { value: "Bajo-Medio", label: "Estancamiento", performance: 3.5, potential: 1.0 },
  { value: "Bajo-Bajo", label: "Riesgo", performance: 2.0, potential: 1.0 },
];

export const EmployeeEditDialog = ({
  employee,
  open,
  onClose,
  onSave,
  tableroId,
}: EmployeeEditDialogProps) => {
  const { toast } = useToast();
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      // Determine current quadrant based on performance and potential
      // Potencial: Bajo ≤1.5, Medio >1.5 hasta ≤2.5, Alto >2.5
      // Desempeño: Bajo <3, Medio ≥3 hasta <4, Alto ≥4
      const perfLevel = employee.performanceScore >= 4 ? "Alto" : employee.performanceScore >= 3 ? "Medio" : "Bajo";
      const potLevel = employee.potentialScore > 2.5 ? "Alto" : employee.potentialScore > 1.5 ? "Medio" : "Bajo";
      setSelectedQuadrant(`${potLevel}-${perfLevel}`);
    }
  }, [employee]);

  if (!employee) return null;

  const handleSave = async () => {
    if (!selectedQuadrant) {
      toast({
        title: "Error",
        description: "Selecciona un cuadrante",
        variant: "destructive",
      });
      return;
    }

    const quadrantData = QUADRANTS.find(q => q.value === selectedQuadrant);
    if (!quadrantData) return;

    setLoading(true);

    try {
      console.log('🔧 Starting calibration for employee:', employee!.name, 'tablero:', tableroId);
      
      // Get tablero data with empresa_id
      const { data: tablero, error: tableroError } = await supabase
        .from('tableros')
        .select('equipo_id, empresa_id')
        .eq('id', tableroId)
        .single();

      console.log('📊 Tablero data:', tablero, 'Error:', tableroError);

      if (tableroError || !tablero) {
        console.error('❌ Error fetching tablero:', tableroError);
        throw new Error("No se encontró el tablero: " + (tableroError?.message || 'Unknown error'));
      }

      // Get current evaluation data
      let { data: evaluacion, error: evalError } = await supabase
        .from('evaluaciones')
        .select('*')
        .eq('persona_nombre', employee!.name)
        .eq('tablero_id', tableroId)
        .maybeSingle();

      console.log('📋 Existing evaluation:', evaluacion, 'Error:', evalError);

      if (evalError) {
        console.error('❌ Error fetching evaluation:', evalError);
        throw evalError;
      }

      // If no evaluation exists, create one first
      if (!evaluacion) {
        console.log("✨ No evaluation found, creating new one for:", employee!.name);

        const evaluacionData = {
          persona_nombre: employee!.name,
          tablero_id: tableroId,
          equipo_id: tablero.equipo_id,
          empresa_id: tablero.empresa_id,
          potencial_score: employee!.potentialScore,
          desempeno_score: employee!.performanceScore,
        };
        
        console.log('📝 Creating evaluation with data:', evaluacionData);

        // Create new evaluation with current scores
        const { data: newEval, error: insertError } = await supabase
          .from('evaluaciones')
          .insert(evaluacionData)
          .select()
          .single();

        console.log('✅ Created evaluation:', newEval, 'Error:', insertError);

        if (insertError) {
          console.error("❌ Error creating evaluation:", insertError);
          throw new Error("Error al crear evaluación: " + insertError.message);
        }

        evaluacion = newEval;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.id);

      // Get empleado_id from empleados table
      const { data: empleadoData, error: empleadoError } = await supabase
        .from('empleados')
        .select('id')
        .eq('nombre', employee!.name)
        .eq('tablero_id', tableroId)
        .single();

      console.log('👤 Empleado data:', empleadoData, 'Error:', empleadoError);

      if (empleadoError || !empleadoData) {
        console.error('❌ Error fetching empleado:', empleadoError);
        throw new Error("No se encontró el empleado: " + (empleadoError?.message || 'Unknown error'));
      }

      const calibracionData = {
        empleado_id: empleadoData.id,
        tablero_id: tableroId!,
        performance_score: quadrantData.performance,
        potential_score: quadrantData.potential,
        calibrado_por: user?.id || null,
      };

      console.log('💾 Saving calibration with data:', calibracionData);

      // Check if calibration already exists
      const { data: existingCalib, error: selectError } = await supabase
        .from('calibraciones')
        .select('id')
        .eq('empleado_id', empleadoData.id)
        .eq('tablero_id', tableroId!)
        .maybeSingle();

      console.log('🔍 Existing calibration:', existingCalib, 'Error:', selectError);

      let calibData;
      let calibError;

      if (existingCalib) {
        // Update existing calibration
        console.log('🔄 Updating existing calibration...');
        const { data: updatedData, error: updateErr } = await supabase
          .from('calibraciones')
          .update({
            performance_score: quadrantData.performance,
            potential_score: quadrantData.potential,
            calibrado_por: user?.id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCalib.id)
          .select();
        
        calibData = updatedData;
        calibError = updateErr;
      } else {
        // Insert new calibration
        console.log('✨ Creating new calibration...');
        const { data: insertedData, error: insertErr } = await supabase
          .from('calibraciones')
          .insert(calibracionData)
          .select();
        
        calibData = insertedData;
        calibError = insertErr;
      }

      console.log('✅ Calibration saved:', calibData, 'Error:', calibError);

      if (calibError) {
        console.error("❌ Error saving calibration:", calibError);
        console.error("❌ Error details:", JSON.stringify(calibError, null, 2));
        throw new Error("Error al guardar calibración: " + calibError.message);
      }

      console.log('🔄 Updating evaluacion scores...');

      // Update evaluaciones table
      const { error: updateError } = await supabase
        .from('evaluaciones')
        .update({
          potencial_score: quadrantData.potential,
          desempeno_score: quadrantData.performance,
        })
        .eq('id', evaluacion.id);

      console.log('✅ Evaluacion updated, Error:', updateError);

      if (updateError) {
        console.error("❌ Error updating evaluaciones:", updateError);
        throw new Error("Error al actualizar evaluación: " + updateError.message);
      }

      console.log('🔄 Updating empleados table...');

      // Update empleados table to reflect new scores in the grid
      const { error: empleadosError } = await supabase
        .from('empleados' as any)
        .update({
          performance: quadrantData.performance,
          potencial: quadrantData.potential,
        })
        .eq('nombre', employee!.name)
        .eq('tablero_id', tableroId);

      console.log('✅ Empleados updated, Error:', empleadosError);

      if (empleadosError) {
        console.error("⚠️ Error updating empleados:", empleadosError);
        // Don't throw here, evaluacion was already updated
      }

      console.log('✨ Calibration completed successfully!');

      toast({
        title: "Calibración exitosa",
        description: `${employee!.name} calibrado a ${quadrantData.label}`,
      });

      // Success - notify parent
      onSave(selectedQuadrant, true);
      onClose();
    } catch (error: any) {
      console.error("Calibration error:", error);
      toast({
        title: "Error al calibrar",
        description: error.message || "Error al calibrar, intenta de nuevo",
        variant: "destructive",
      });
      
      // Notify parent of failure
      onSave(selectedQuadrant, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Calibrar Ubicación - {employee.name}</DialogTitle>
          <DialogDescription>
            Selecciona el cuadrante destino para calibrar al empleado
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="quadrant">Cuadrante de Calibración</Label>
            <Select value={selectedQuadrant} onValueChange={setSelectedQuadrant}>
              <SelectTrigger id="quadrant">
                <SelectValue placeholder="Selecciona un cuadrante" />
              </SelectTrigger>
              <SelectContent>
                {QUADRANTS.map((quadrant) => (
                  <SelectItem key={quadrant.value} value={quadrant.value}>
                    {quadrant.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Umbrales - Potencial: Bajo ≤1.5, Medio &gt;1.5-≤2.5, Alto &gt;2.5 | Desempeño: Bajo &lt;3, Medio ≥3-&lt;4, Alto ≥4
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded">
            <p>
              <strong>Ubicación actual:</strong> {employee.performance} Desempeño, {employee.potential} Potencial
            </p>
            <p>
              <strong>Scores actuales:</strong> Desempeño {employee.performanceScore.toFixed(2)}, Potencial {employee.potentialScore.toFixed(2)}
            </p>
            <p>
              <strong>Manager:</strong> {employee.manager}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando calibración..." : "Guardar Calibración"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
