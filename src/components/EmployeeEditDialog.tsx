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
  onSave: (quadrant: string, motivo?: string) => void;
  currentOverrideMotivo?: string;
  tableroId?: string;
}

const QUADRANTS = [
  { value: "Alto-Alto", label: "Talento Estratégico", performance: 4.5, potential: 3.0 },
  { value: "Alto-Medio", label: "Desarrollar", performance: 3.5, potential: 3.0 },
  { value: "Alto-Bajo", label: "Consistente", performance: 2.0, potential: 3.0 },
  { value: "Medio-Alto", label: "Clave", performance: 4.5, potential: 2.0 },
  { value: "Medio-Medio", label: "Dilema", performance: 3.5, potential: 2.0 },
  { value: "Medio-Bajo", label: "Enigma", performance: 2.0, potential: 2.0 },
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
      setSelectedQuadrant(`${perfLevel}-${potLevel}`);
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
      // Get current evaluation data
      let { data: evaluacion, error: evalError } = await supabase
        .from('evaluaciones')
        .select('*')
        .eq('persona_nombre', employee!.name)
        .eq('tablero_id', tableroId)
        .maybeSingle();

      if (evalError) throw evalError;

      // If no evaluation exists, create one first
      if (!evaluacion) {
        console.log("No evaluation found, creating new one for:", employee!.name);
        
        // Get equipo_id from tablero
        const { data: tablero } = await supabase
          .from('tableros')
          .select('equipo_id')
          .eq('id', tableroId)
          .single();

        if (!tablero) {
          throw new Error("No se encontró el tablero");
        }

        // Create new evaluation with current scores
        const { data: newEval, error: insertError } = await supabase
          .from('evaluaciones')
          .insert({
            persona_nombre: employee!.name,
            tablero_id: tableroId,
            equipo_id: tablero.equipo_id,
            potencial_score: employee!.potentialScore,
            desempeno_score: employee!.performanceScore,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating evaluation:", insertError);
          throw new Error("Error al crear evaluación: " + insertError.message);
        }

        evaluacion = newEval;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Save to calibraciones table (history)
      const { error: calibError } = await supabase
        .from('calibraciones')
        .insert({
          evaluacion_id: evaluacion.id,
          cuadrante_original: `${employee!.performance}-${employee!.potential}`,
          cuadrante_calibrado: selectedQuadrant,
          score_original_potencial: employee!.potentialScore,
          score_calibrado_potencial: quadrantData.potential,
          score_original_desempeno: employee!.performanceScore,
          score_calibrado_desempeno: quadrantData.performance,
          manager_id: user?.id || null,
        });

      if (calibError) {
        console.error("Error saving calibration history:", calibError);
        throw new Error("Error al guardar historial de calibración");
      }

      // Update evaluaciones table
      const { error: updateError } = await supabase
        .from('evaluaciones')
        .update({
          potencial_score: quadrantData.potential,
          desempeno_score: quadrantData.performance,
        })
        .eq('id', evaluacion.id);

      if (updateError) {
        console.error("Error updating evaluaciones:", updateError);
        throw new Error("Error al actualizar evaluación");
      }

      toast({
        title: "Calibración guardada",
        description: `${employee!.name} movido a ${quadrantData.label}`,
      });

      onSave(selectedQuadrant);
      onClose();
    } catch (error: any) {
      console.error("Calibration error:", error);
      toast({
        title: "Error al calibrar",
        description: error.message || "Error al calibrar, intenta de nuevo",
        variant: "destructive",
      });
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
