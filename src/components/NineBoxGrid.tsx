import { Employee, NineBoxQuadrant, PerformanceLevel, PotentialLevel } from "@/types/employee";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NineBoxGridProps {
  employees: Employee[];
}

const QUADRANT_LABELS: Record<string, { title: string; color: string }> = {
  "Alto-Alto": { title: "Key Players", color: "bg-high" },
  "Alto-Medio": { title: "High Potential", color: "bg-high" },
  "Alto-Bajo": { title: "Emerging Talent", color: "bg-medium" },
  "Medio-Alto": { title: "Solid Performers", color: "bg-medium" },
  "Medio-Medio": { title: "Core Contributors", color: "bg-medium" },
  "Medio-Bajo": { title: "Inconsistent Performers", color: "bg-medium" },
  "Bajo-Alto": { title: "High Potential/Low Performance", color: "bg-low" },
  "Bajo-Medio": { title: "Underperformers", color: "bg-low" },
  "Bajo-Bajo": { title: "Low Performers", color: "bg-low" },
};

export const NineBoxGrid = ({ employees }: NineBoxGridProps) => {
  const getQuadrants = (): NineBoxQuadrant[] => {
    const potentialLevels: PotentialLevel[] = ["Alto", "Medio", "Bajo"];
    const performanceLevels: PerformanceLevel[] = ["Bajo", "Medio", "Alto"];
    
    return potentialLevels.flatMap((potential) =>
      performanceLevels.map((performance) => {
        const key = `${performance}-${potential}`;
        const config = QUADRANT_LABELS[key];
        
        return {
          id: key,
          title: config.title,
          performance,
          potential,
          color: config.color,
          employees: employees.filter(
            (emp) => emp.performance === performance && emp.potential === potential
          ),
        };
      })
    );
  };

  const quadrants = getQuadrants();

  return (
    <div className="w-full">
      {/* Axis Labels */}
      <div className="flex justify-center mb-2">
        <div className="text-sm font-semibold text-foreground">
          Desempeño (Performance) →
        </div>
      </div>

      <div className="flex gap-2">
        {/* Y-Axis Label */}
        <div className="flex items-center justify-center w-8">
          <div className="transform -rotate-90 whitespace-nowrap text-sm font-semibold text-foreground">
            Potencial (Potential) ↑
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-3">
            {quadrants.map((quadrant) => (
              <Card
                key={quadrant.id}
                className={`${quadrant.color} p-4 min-h-[180px] border-2 transition-all hover:shadow-lg`}
              >
                <div className="flex flex-col h-full">
                  <div className="mb-3">
                    <h3 className={`font-bold text-sm mb-1 ${quadrant.color === "bg-high" ? "text-high-foreground" : quadrant.color === "bg-medium" ? "text-medium-foreground" : "text-low-foreground"}`}>
                      {quadrant.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {quadrant.employees.length} persona{quadrant.employees.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-32">
                    {quadrant.employees.map((employee) => (
                      <TooltipProvider key={employee.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs p-2 bg-card rounded cursor-pointer hover:bg-accent transition-colors">
                              <div className="font-medium truncate">{employee.name}</div>
                              <div className="text-muted-foreground truncate text-[10px]">
                                {employee.manager}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-semibold">{employee.name}</p>
                              <p className="text-xs">Manager: {employee.manager}</p>
                              <p className="text-xs">
                                Desempeño: {employee.performance} ({employee.performanceScore.toFixed(2)})
                              </p>
                              <p className="text-xs">
                                Potencial: {employee.potential} ({employee.potentialScore.toFixed(2)})
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Level Labels */}
      <div className="flex gap-2 mt-2 ml-10">
        <div className="flex-1 text-center text-xs font-medium text-muted-foreground">Bajo</div>
        <div className="flex-1 text-center text-xs font-medium text-muted-foreground">Medio</div>
        <div className="flex-1 text-center text-xs font-medium text-muted-foreground">Alto</div>
      </div>
    </div>
  );
};
