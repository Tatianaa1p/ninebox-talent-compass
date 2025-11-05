import { useMemo } from 'react';
import { Chart as ChartJS } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { EmpleadoPromedio } from '@/utils/gaussCalculations';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend
);

interface GaussChartProps {
  empleados: EmpleadoPromedio[];
  media: number;
  desviacion: number;
}

export const GaussChart = ({ empleados, media, desviacion }: GaussChartProps) => {
  const chartData = useMemo(() => {
    // Create bins for scores (using employee averages now)
    const bins = Array.from({ length: 31 }, (_, i) => 1.0 + i * 0.1); // 1.0 to 4.0 in 0.1 steps
    const counts = new Array(bins.length).fill(0);

    empleados.forEach(emp => {
      const binIndex = Math.floor((emp.puntuacion_desempeno - 1.0) / 0.1);
      if (binIndex >= 0 && binIndex < counts.length) {
        counts[binIndex]++;
      }
    });

    // Generate ideal Gaussian curve
    const gaussianCurve = bins.map(x => {
      const exponent = -Math.pow(x - media, 2) / (2 * Math.pow(desviacion, 2));
      return (empleados.length / (desviacion * Math.sqrt(2 * Math.PI))) * Math.exp(exponent) * 0.1;
    });

    return {
      labels: bins.map(b => b.toFixed(1)),
      datasets: [
        {
          type: 'bar' as const,
          label: 'Distribución Real (Empleados)',
          data: counts,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          type: 'line' as const,
          label: 'Curva Ideal',
          data: gaussianCurve,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        },
      ],
    };
  }, [empleados, media, desviacion]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribución de Puntuación de Desempeño vs Curva Gaussiana Ideal (15% Bajo | 75% Esperado | 10% Alto)',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Puntuación de Desempeño (Promedio)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Frecuencia (Número de Empleados)',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-[400px] w-full">
      <ChartJS type="bar" data={chartData as any} options={options} />
    </div>
  );
};
