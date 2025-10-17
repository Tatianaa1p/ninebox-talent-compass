import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RotateCcw } from "lucide-react";
import { useOverrides } from "@/contexts/OverrideContext";
import { useToast } from "@/hooks/use-toast";

export const ClearOverridesButton = () => {
  const [showDialog, setShowDialog] = useState(false);
  const { clearAllOverrides, overrides } = useOverrides();
  const { toast } = useToast();

  const handleClear = () => {
    clearAllOverrides();
    setShowDialog(false);
    toast({
      title: "Todos los ajustes eliminados",
      description: "Se han restaurado las clasificaciones originales",
    });
  };

  if (overrides.size === 0) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setShowDialog(true)} variant="destructive" size="sm">
        <RotateCcw className="h-4 w-4 mr-2" />
        Restaurar todo ({overrides.size})
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar todas las clasificaciones?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará {overrides.size} ajuste(s) manual(es) y restaurará
              todas las clasificaciones a sus valores originales basados en las
              puntuaciones AG y R. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-destructive">
              Restaurar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
