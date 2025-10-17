import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface QuadrantInfoPanelProps {
  title: string;
  description: string;
  potential: string;
  performance: string;
}

export const QuadrantInfoPanel = ({
  title,
  description,
  potential,
  performance,
}: QuadrantInfoPanelProps) => {
  const getThresholdText = (level: string, type: 'potential' | 'performance') => {
    if (type === 'potential') {
      switch (level) {
        case "Alto":
          return "> 2.5";
        case "Medio":
          return "> 1.5 hasta ≤ 2.5";
        case "Bajo":
          return "≤ 1.5";
        default:
          return "";
      }
    } else {
      switch (level) {
        case "Alto":
          return "≥ 4";
        case "Medio":
          return "≥ 3 hasta < 4";
        case "Bajo":
          return "< 3";
        default:
          return "";
      }
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-1" />
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-2">
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-semibold">Potencial:</span> {potential} ({getThresholdText(potential, 'potential')})
                </div>
                <div>
                  <span className="font-semibold">Desempeño:</span> {performance} ({getThresholdText(performance, 'performance')})
                </div>
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};
