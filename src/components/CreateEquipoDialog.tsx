import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateEquipoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  onCreated: (equipoId: string) => void;
}

export function CreateEquipoDialog({ open, onOpenChange, empresaId, onCreated }: CreateEquipoDialogProps) {
  const [nombre, setNombre] = useState("");
  const [managerId, setManagerId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("equipos")
        .insert({ 
          nombre: nombre.trim(),
          empresa_id: empresaId,
          manager_id: managerId || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Equipo creado exitosamente");
      setNombre("");
      setManagerId("");
      onCreated(data.id);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al crear equipo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Equipo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Equipo</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Equipo de Ventas"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manager">Manager ID (opcional)</Label>
              <Input
                id="manager"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                placeholder="UUID del manager"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Ingresa el UUID del manager si deseas asignarlo ahora
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Equipo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
