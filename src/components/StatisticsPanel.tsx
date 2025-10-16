import { Employee } from "@/types/employee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Award, AlertTriangle } from "lucide-react";

interface StatisticsPanelProps {
  employees: Employee[];
}

export const StatisticsPanel = ({ employees }: StatisticsPanelProps) => {
  const keyPlayers = employees.filter(
    (e) => e.performance === "Alto" && e.potential === "Alto"
  ).length;
  
  const highPotential = employees.filter(
    (e) => e.performance === "Medio" && e.potential === "Alto"
  ).length;
  
  const lowPerformers = employees.filter(
    (e) => e.performance === "Bajo"
  ).length;

  const stats = [
    {
      title: "Total Evaluados",
      value: employees.length,
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
      title: "Bajo Desempeño",
      value: lowPerformers,
      icon: AlertTriangle,
      color: "text-danger",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
