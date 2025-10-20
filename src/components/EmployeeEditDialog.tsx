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
import { Input } from "@/components/ui/input";
import { Employee } from "@/types/employee";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmployeeEditDialogProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
  onSave: (quadrant: string, motivo?: string) => void;
  currentOverrideMotivo?: string;
}

export const EmployeeEditDialog = ({
  employee,
  open,
  onClose,
  onSave,
}: EmployeeEditDialogProps) => {
  const { toast } = useToast();
  const [performance, setPerformance] = useState<string>("");
  const [potencial, setPotencial] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setPerformance(employee.performanceScore.toString());
      setPotencial(employee.potentialScore.toString());
    }
  }, [employee]);

  if (!employee) return null;

  const handleSave = async () => {
    const perfNum = parseFloat(performance);
    const potNum = parseFloat(potencial);

    if (isNaN(perfNum) || perfNum < 1 || perfNum > 5) {
      toast({
        title: "Error",
        description: "El desempeño debe estar entre 1 y 5",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(potNum) || potNum < 1 || potNum > 5) {
      toast({
        title: "Error",
        description: "El potencial debe estar entre 1 y 5",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('empleados' as any)
        .update({
          performance: perfNum,
          potencial: potNum,
        })
        .eq('nombre', employee.name);

      if (error) throw error;

      toast({
        title: "Cambios guardados",
        description: `Se actualizó la evaluación de ${employee.name}`,
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
          <DialogTitle>Editar Ubicación - {employee.name}</DialogTitle>
          <DialogDescription>
            Ajusta manualmente las puntuaciones de desempeño y potencial (rango: 1-5)
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="performance">Desempeño (Performance)</Label>
            <Input
              id="performance"
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={performance}
              onChange={(e) => setPerformance(e.target.value)}
              placeholder="1.0 - 5.0"
            />
            <p className="text-xs text-muted-foreground">
              Bajo: &lt;3, Medio: 3-3.9, Alto: ≥4
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="potencial">Potencial</Label>
            <Input
              id="potencial"
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={potencial}
              onChange={(e) => setPotencial(e.target.value)}
              placeholder="1.0 - 5.0"
            />
            <p className="text-xs text-muted-foreground">
              Bajo: ≤1.5, Medio: 1.6-2.5, Alto: &gt;2.5
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded">
            <p>
              <strong>Desempeño actual:</strong> {employee.performanceScore.toFixed(2)} ({employee.performance})
            </p>
            <p>
              <strong>Potencial actual:</strong> {employee.potentialScore.toFixed(2)} ({employee.potential})
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
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
