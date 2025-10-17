import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Undo2 } from "lucide-react";

interface UndoSnackbarProps {
  show: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoSnackbar = ({ show, message, onUndo, onDismiss }: UndoSnackbarProps) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (show) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onDismiss();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-card border border-border shadow-lg rounded-lg p-4 flex items-center gap-3 min-w-[320px]">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Se deshará en {countdown}s
          </p>
        </div>
        <Button onClick={onUndo} size="sm" variant="outline">
          <Undo2 className="h-4 w-4 mr-1" />
          Deshacer
        </Button>
        <Button onClick={onDismiss} size="sm" variant="ghost">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
