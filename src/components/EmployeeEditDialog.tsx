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
  { value: "Alto-Alto", label: "1. Talento Estratégico", performance: 4.5, potential: 4.5 },
  { value: "Alto-Medio", label: "2. Crecimiento Acelerado", performance: 4.5, potential: 3.0 },
  { value: "Alto-Bajo", label: "3. Desempeño Consistente", performance: 4.5, potential: 2.0 },
  { value: "Medio-Alto", label: "4. Comprometido", performance: 3.0, potential: 4.5 },
  { value: "Medio-Medio", label: "5. Potencial No Visible", performance: 3.0, potential: 3.0 },
  { value: "Medio-Bajo", label: "6. Evolución", performance: 3.0, potential: 2.0 },
  { value: "Bajo-Alto", label: "7. En Riesgo de Estancamiento", performance: 2.0, potential: 4.5 },
  { value: "Bajo-Medio", label: "8. En Revisión", performance: 2.0, potential: 3.0 },
  { value: "Bajo-Bajo", label: "9. Desempeño Insuficiente", performance: 2.0, potential: 2.0 },
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
      // Determine current quadrant based on performance and potential (Bajo ≤2.4, Medio 2.5–3.9, Alto ≥4.0)
      const perfLevel = employee.performanceScore >= 4.0 ? "Alto" : employee.performanceScore >= 2.5 ? "Medio" : "Bajo";
      const potLevel = employee.potentialScore >= 4.0 ? "Alto" : employee.potentialScore >= 2.5 ? "Medio" : "Bajo";
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
      const { data: evaluacion, error: evalError } = await supabase
        .from('evaluaciones')
        .select('*')
        .eq('persona_nombre', employee!.name)
        .eq('tablero_id', tableroId)
        .maybeSingle();

      if (evalError) throw evalError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Save to calibraciones table (history)
      if (evaluacion) {
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
          console.warn("Error saving calibration history:", calibError);
        }
      }

      // Update evaluaciones table
      const { error: updateError } = await supabase
        .from('evaluaciones')
        .update({
          potencial_score: quadrantData.potential,
          desempeno_score: quadrantData.performance,
        })
        .eq('persona_nombre', employee!.name)
        .eq('tablero_id', tableroId);

      if (updateError) throw updateError;

      toast({
        title: "Calibración guardada",
        description: `${employee!.name} movido a ${quadrantData.label}`,
      });

      // Reload page to refresh grid
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message,
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
              Umbrales: Bajo ≤2.4, Medio 2.5-3.9, Alto ≥4.0
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
