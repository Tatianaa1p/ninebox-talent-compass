import { useMemo, memo } from 'react';
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
import { UmbralesGauss } from '@/utils/gaussPercentiles';

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
  scores: number[];
  umbrales: UmbralesGauss;
}

const BIN_WIDTH = 0.25;
const roundToBin = (v: number) => Math.round(v / BIN_WIDTH) * BIN_WIDTH;

const zonesPlugin = {
  id: 'gaussZones',
  beforeDatasetsDraw(chart: any, _args: any, pluginOptions: any) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea) return;
    const { umbralBajo, umbralAlto, minScore, maxScore } = pluginOptions || {};
    if (umbralBajo == null) return;
    const xScale = scales.x;

    const xToPixel = (val: number) => {
      const labels: string[] = chart.data.labels || [];
      // Find nearest label index
      let nearestIdx = 0;
      let nearestDiff = Infinity;
      labels.forEach((l, i) => {
        const diff = Math.abs(parseFloat(l) - val);
        if (diff < nearestDiff) {
          nearestDiff = diff;
          nearestIdx = i;
        }
      });
      return xScale.getPixelForValue(nearestIdx);
    };

    const xMin = xToPixel(minScore);
    const xLow = xToPixel(umbralBajo);
    const xHigh = xToPixel(umbralAlto);
    const xMax = xToPixel(maxScore);

    ctx.save();
    // Bajo zone
    ctx.fillStyle = 'rgba(239, 68, 68, 0.10)';
    ctx.fillRect(xMin, chartArea.top, xLow - xMin, chartArea.bottom - chartArea.top);
    // Esperado zone
    ctx.fillStyle = 'rgba(59, 130, 246, 0.06)';
    ctx.fillRect(xLow, chartArea.top, xHigh - xLow, chartArea.bottom - chartArea.top);
    // Alto zone
    ctx.fillStyle = 'rgba(34, 197, 94, 0.10)';
    ctx.fillRect(xHigh, chartArea.top, xMax - xHigh, chartArea.bottom - chartArea.top);

    // Vertical lines + labels
    const drawLine = (x: number, color: string, label: string) => {
      ctx.strokeStyle = color;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = '11px sans-serif';
      ctx.fillText(label, x + 4, chartArea.top + 12);
    };
    drawLine(xLow, '#ef4444', `P15: ${umbralBajo.toFixed(2)}`);
    drawLine(xHigh, '#22c55e', `P85: ${umbralAlto.toFixed(2)}`);
    ctx.restore();
  },
};

Chart.register(zonesPlugin as any);

const gaussianPDF = (x: number, mean: number, std: number) => {
  if (std <= 0) return 0;
  const coefficient = 1 / (std * Math.sqrt(2 * Math.PI));
  const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(std, 2));
  return coefficient * Math.exp(exponent);
};

const GaussChartComponent = ({ scores, umbrales }: GaussChartProps) => {
  if (scores.length === 0) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">
        No hay datos para mostrar en el gráfico
      </div>
    );
  }

  const { mean, stdDev, umbralBajo, umbralAlto, minScore, maxScore, n } = umbrales;

  const chartData = useMemo(() => {
    const dataMin = Math.min(...scores);
    const dataMax = Math.max(...scores);
    const start = Math.max(1, Math.floor((dataMin - BIN_WIDTH) / BIN_WIDTH) * BIN_WIDTH);
    const end = Math.min(5, Math.ceil((dataMax + BIN_WIDTH) / BIN_WIDTH) * BIN_WIDTH);

    const bins: number[] = [];
    for (let v = start; v <= end + 1e-9; v += BIN_WIDTH) bins.push(parseFloat(v.toFixed(2)));

    const counts = new Array(bins.length).fill(0);
    scores.forEach((s) => {
      const idx = Math.round((s - start) / BIN_WIDTH);
      if (idx >= 0 && idx < counts.length) counts[idx]++;
    });

    const curva = bins.map((x) => gaussianPDF(x, mean, stdDev) * n * BIN_WIDTH);

    return {
      labels: bins.map((b) => b.toFixed(2)),
      datasets: [
        {
          type: 'bar' as const,
          label: 'Distribución Real',
          data: counts,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          type: 'line' as const,
          label: `Curva Ideal (μ=${mean.toFixed(2)}, σ=${stdDev.toFixed(2)})`,
          data: curva,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  }, [scores, mean, stdDev, minScore, maxScore, n]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: 'Distribución real vs Curva Gaussiana (agrupado cada 0.25 puntos)',
      },
      gaussZones: { umbralBajo, umbralAlto, minScore, maxScore },
    },
    scales: {
      x: {
        title: { display: true, text: 'Puntuación de Desempeño' },
        ticks: {
          callback: function (this: any, _val: any, index: number) {
            const label = this.getLabelForValue(index);
            const num = parseFloat(label);
            // Show only every other tick (every 0.5)
            return Math.round(num * 100) % 50 === 0 ? num.toFixed(2) : '';
          },
        },
      },
      y: { title: { display: true, text: 'Frecuencia (Empleados)' }, beginAtZero: true },
    },
  };

  return (
    <div className="h-[400px] w-full">
      <ChartJS type="bar" data={chartData as any} options={options as any} />
    </div>
  );
};

export const GaussChart = memo(GaussChartComponent);
