import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Employee } from "@/types/employee";
import { QUADRANT_NAMES } from "@/types/override";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  currentOverrideMotivo,
}: EmployeeEditDialogProps) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>("");
  const [motivo, setMotivo] = useState(currentOverrideMotivo || "");

  if (!employee) return null;

  const currentQuadrantKey = `${employee.performance}-${employee.potential}`;
  const currentQuadrantName = QUADRANT_NAMES[currentQuadrantKey as keyof typeof QUADRANT_NAMES];

  const handleSave = () => {
    if (selectedQuadrant) {
      onSave(selectedQuadrant, motivo.trim() || undefined);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar ubicación - {employee.name}</DialogTitle>
          <DialogDescription>
            Ubicación actual: {currentQuadrantName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="quadrant">Mover a cuadrante</Label>
            <Select value={selectedQuadrant} onValueChange={setSelectedQuadrant}>
              <SelectTrigger id="quadrant">
                <SelectValue placeholder="Seleccionar cuadrante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Talento Estratégico">Talento Estratégico</SelectItem>
                <SelectItem value="Desarrollar">Desarrollar</SelectItem>
                <SelectItem value="Consistente">Consistente</SelectItem>
                <SelectItem value="Confiable">Confiable</SelectItem>
                <SelectItem value="Enigma">Enigma</SelectItem>
                <SelectItem value="Clave">Clave</SelectItem>
                <SelectItem value="Estancamiento">Estancamiento</SelectItem>
                <SelectItem value="Dilema">Dilema</SelectItem>
                <SelectItem value="Riesgo">Riesgo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Textarea
              id="motivo"
              placeholder="Razón del cambio manual..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
            />
          </div>

          <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded">
            <p>
              <strong>Desempeño actual:</strong> {employee.performance} (
              {employee.performanceScore.toFixed(2)})
            </p>
            <p>
              <strong>Potencial actual:</strong> {employee.potential} (
              {employee.potentialScore.toFixed(2)})
            </p>
            <p>
              <strong>Manager:</strong> {employee.manager}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!selectedQuadrant}>
            Guardar cambio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
