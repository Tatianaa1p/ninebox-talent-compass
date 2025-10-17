import { Employee } from "@/types/employee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Award, AlertTriangle, Target } from "lucide-react";
import { useOverrides } from "@/contexts/OverrideContext";
import { useMemo } from "react";
import { PerformanceLevel, PotentialLevel } from "@/types/employee";
import { QUADRANT_KEYS } from "@/types/override";

interface StatisticsPanelProps {
  employees: Employee[];
}

export const StatisticsPanel = ({ employees }: StatisticsPanelProps) => {
  const { viewMode, getOverride } = useOverrides();

  // Apply overrides if in calibrated mode
  const displayEmployees = useMemo(() => {
    if (viewMode === "original") {
      return employees;
    }

    return employees.map((emp) => {
      const override = getOverride(emp.name);
      if (!override) return emp;

      const quadrantKey = QUADRANT_KEYS[override.override_cuadrante as keyof typeof QUADRANT_KEYS];
      const [performance, potential] = quadrantKey.split("-") as [PerformanceLevel, PotentialLevel];

      return {
        ...emp,
        performance: override.override_desempeno_categoria || performance,
        potential: override.override_potencial_categoria || potential,
      };
    });
  }, [employees, viewMode, getOverride]);

  const keyPlayers = displayEmployees.filter(
    (e) => e.performance === "Alto" && e.potential === "Alto"
  ).length;
  
  const highPotential = displayEmployees.filter(
    (e) => e.performance === "Medio" && e.potential === "Alto"
  ).length;

  const highPotentialTotal = displayEmployees.filter(
    (e) => e.potential === "Alto"
  ).length;
  
  const lowPerformers = displayEmployees.filter(
    (e) => e.performance === "Bajo"
  ).length;

  const stats = [
    {
      title: "Total Evaluados",
      value: displayEmployees.length,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Key Players",
      value: keyPlayers,
      icon: Award,
      color: "text-success",
    },
    {
      title: "High Potential",
      value: highPotential,
      icon: TrendingUp,
      color: "text-success",
    },
    {
      title: "Talento Alto Total",
      value: highPotentialTotal,
      icon: Target,
      color: "text-success",
    },
    {
      title: "Bajo Desempeño",
      value: lowPerformers,
      icon: AlertTriangle,
      color: "text-danger",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
