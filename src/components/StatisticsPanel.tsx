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

  const countByQuadrant = useMemo(() => {
    const counts: Record<string, number> = {};
    
    displayEmployees.forEach((emp) => {
      const key = `${emp.potential}-${emp.performance}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    
    return counts;
  }, [displayEmployees]);

  const stats = [
    {
      title: "Total Evaluados",
      value: displayEmployees.length,
      icon: Users,
      color: "text-primary",
    },
    // GREEN - Alto desempeño / potencial
    {
      title: "Talento Estratégico",
      value: countByQuadrant["Alto-Alto"] || 0,
      icon: Award,
      color: "text-success",
    },
    {
      title: "Desarrollar",
      value: countByQuadrant["Alto-Medio"] || 0,
      icon: TrendingUp,
      color: "text-success",
    },
    {
      title: "Consistente",
      value: countByQuadrant["Medio-Alto"] || 0,
      icon: Target,
      color: "text-success",
    },
    // YELLOW - Seguimiento / Intermedio
    {
      title: "Confiable",
      value: countByQuadrant["Bajo-Alto"] || 0,
      icon: Award,
      color: "text-warning",
    },
    {
      title: "Enigma",
      value: countByQuadrant["Alto-Bajo"] || 0,
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      title: "Clave",
      value: countByQuadrant["Medio-Medio"] || 0,
      icon: Users,
      color: "text-warning",
    },
    // RED - Riesgo / Alerta
    {
      title: "Estancamiento",
      value: countByQuadrant["Bajo-Medio"] || 0,
      icon: AlertTriangle,
      color: "text-danger",
    },
    {
      title: "Dilema",
      value: countByQuadrant["Medio-Bajo"] || 0,
      icon: AlertTriangle,
      color: "text-danger",
    },
    {
      title: "Riesgo",
      value: countByQuadrant["Bajo-Bajo"] || 0,
      icon: AlertTriangle,
      color: "text-danger",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
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
