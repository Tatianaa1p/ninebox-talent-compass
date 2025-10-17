import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import { useOverrides } from "@/contexts/OverrideContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ViewModeToggle = () => {
  const { viewMode, setViewMode } = useOverrides();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              id="view-mode"
              checked={viewMode === "calibrada"}
              onCheckedChange={(checked) => setViewMode(checked ? "calibrada" : "original")}
            />
            <div>
              <Label htmlFor="view-mode" className="text-base font-semibold cursor-pointer">
                Vista: {viewMode === "calibrada" ? "Calibrada" : "Original"}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {viewMode === "calibrada"
                  ? "Mostrando ubicaciones con ajustes manuales"
                  : "Mostrando ubicaciones según puntuaciones originales"}
              </p>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs space-y-2">
                  <p className="font-semibold">Vista Original</p>
                  <p className="text-xs">
                    Muestra a todos según su clasificación automática basada en las
                    puntuaciones AG y R de los archivos Excel.
                  </p>
                  <p className="font-semibold mt-2">Vista Calibrada</p>
                  <p className="text-xs">
                    Aplica los ajustes manuales (drag & drop) realizados. Esta es la
                    vista que se usa para KPIs y exportación.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};
