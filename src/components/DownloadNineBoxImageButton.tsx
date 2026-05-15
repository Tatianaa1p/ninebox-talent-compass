import { useState } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EmployeePdf {
  name: string;
  quadrant: string;
  performance: number;
  potencial: number;
  equipoNombre?: string;
}

interface Props {
  tableroNombre: string;
  empresaNombre: string;
  periodo?: number;
  employees?: EmployeePdf[];
  analisisIA?: any;
}

export const DownloadNineBoxImageButton = ({
  tableroNombre,
  empresaNombre,
  periodo,
  employees = [],
  analisisIA,
}: Props) => {
  const [loading, setLoading] = useState(false);

  const captureElement = async (): Promise<string> => {
    const element = document.getElementById('ninebox-capture-area');
    if (!element) throw new Error('No se encontró el área de captura');

    const hidden = Array.from(
      element.querySelectorAll<HTMLElement>('[data-no-capture]')
    );
    const previous = hidden.map((el) => el.style.display);
    hidden.forEach((el) => (el.style.display = 'none'));

    await new Promise((r) => setTimeout(r, 300));

    try {
      return await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
    } finally {
      hidden.forEach((el, i) => (el.style.display = previous[i]));
    }
  };

  const baseName = `ninebox-${empresaNombre}-${tableroNombre}`
    .toLowerCase()
    .replace(/\s+/g, '-');

  const downloadPng = async () => {
    try {
      const dataUrl = await captureElement();
      const link = document.createElement('a');
      link.download = `${baseName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Error al generar PNG:', e);
    }
  };

  const downloadPdf = async () => {
    setLoading(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 15;
      const pageWidth = 210;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const addPageIfNeeded = (spaceNeeded: number) => {
        if (y + spaceNeeded > 280) { pdf.addPage(); y = margin; }
      };

      // ── HEADER ──────────────────────────────────────────────
      pdf.setFillColor(22, 33, 62);
      pdf.rect(0, 0, 210, 28, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
      pdf.text(`Nine Box Grid — ${empresaNombre}`, margin, 12);
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Tablero: ${tableroNombre}  ·  Período: ${periodo || 2026}  ·  Generado: ${new Date().toLocaleDateString('es-AR')}`,
        margin,
        21
      );
      pdf.setTextColor(0, 0, 0);
      y = 38;

      // ── KPI CARDS ───────────────────────────────────────────
      const kpis = [
        { label: 'Total evaluados', value: String(employees.length), color: [22, 33, 62] },
        { label: 'Talento Estratégico', value: String(employees.filter(e => e.quadrant === 'Talento Estratégico').length), color: [26, 115, 64] },
        { label: 'En riesgo', value: String(employees.filter(e => ['Riesgo','Dilema','Estancamiento'].includes(e.quadrant)).length), color: [198, 40, 40] },
      ];
      const cardW = (contentWidth - 8) / 3;
      kpis.forEach((kpi, i) => {
        const x = margin + i * (cardW + 4);
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(x, y, cardW, 18, 2, 2, 'F');
        pdf.setFontSize(8); pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'normal');
        pdf.text(kpi.label, x + 4, y + 6);
        pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        pdf.text(kpi.value, x + 4, y + 14);
      });
      pdf.setTextColor(0, 0, 0);
      y += 26;

      // ── NINE BOX GRID (tabla 3x3) ───────────────────────────
      pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
      pdf.text('Distribución Nine Box', margin, y); y += 6;

      const CUADRANTES_ORDER = [
        ['Enigma', 'Desarrollar', 'Talento Estratégico'],
        ['Dilema', 'Clave', 'Consistente'],
        ['Riesgo', 'Estancamiento', 'Confiable'],
      ];
      const COLORS: Record<string, number[]> = {
        // VERDE PASTEL
        'Talento Estratégico': [180, 230, 200],
        'Desarrollar':         [200, 240, 215],
        'Consistente':         [215, 245, 225],
        // AMARILLO PASTEL
        'Enigma':              [255, 243, 180],
        'Clave':               [255, 245, 195],
        'Confiable':           [255, 240, 170],
        // ROJO PASTEL
        'Dilema':              [255, 195, 195],
        'Estancamiento':       [255, 210, 210],
        'Riesgo':              [255, 180, 180],
      };

      // Todos con texto oscuro ya que son todos pasteles claros
      const getTextColor = (_cuadrante: string): number[] => [50, 50, 50];

      const cellW = contentWidth / 3;
      const cellH = 28;

      CUADRANTES_ORDER.forEach((row) => {
        addPageIfNeeded(cellH + 2);
        row.forEach((cuadrante, col) => {
          const x = margin + col * cellW;
          const color = COLORS[cuadrante] || [245, 245, 245];
          pdf.setFillColor(color[0], color[1], color[2]);
          pdf.rect(x, y, cellW - 1, cellH, 'F');
          const textColor = getTextColor(cuadrante);
          pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
          pdf.text(cuadrante, x + 3, y + 6);
          const personas = employees.filter(e => e.quadrant === cuadrante);
          pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
          pdf.text(`${personas.length} persona${personas.length !== 1 ? 's' : ''}`, x + 3, y + 11);
          personas.slice(0, 3).forEach((p, pi) => {
            pdf.text(`· ${p.name}`, x + 3, y + 16 + pi * 4);
          });
          if (personas.length > 3) {
            pdf.text(`+${personas.length - 3} más (ver detalle abajo)`, x + 3, y + 28);
          }
        });
        y += cellH + 2;
        pdf.setTextColor(0, 0, 0);
      });

      // ── ANÁLISIS DE IA ───────────────────────────────────────
      const analisis = typeof analisisIA === 'string' ? JSON.parse(analisisIA) : analisisIA;

      if (analisis && analisis.resumen) {
        addPageIfNeeded(20);
        y += 6;
        pdf.setFillColor(22, 33, 62);
        pdf.rect(margin, y, contentWidth, 8, 'F');
        pdf.setTextColor(255, 255, 255); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
        pdf.text('Análisis de talento con IA', margin + 3, y + 5.5);
        pdf.setTextColor(0, 0, 0);
        y += 12;

        pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
        pdf.text(`Estado: ${analisis.estado_general?.toUpperCase() || ''}`, margin, y); y += 5;
        pdf.setFont('helvetica', 'normal');
        const resumenLines = pdf.splitTextToSize(analisis.resumen || '', contentWidth);
        pdf.text(resumenLines, margin, y); y += resumenLines.length * 4 + 4;

        ['fortalezas', 'alertas', 'recomendaciones'].forEach((seccion) => {
          const labels: Record<string, string> = { fortalezas: 'Fortalezas', alertas: 'Alertas', recomendaciones: 'Recomendaciones' };
          addPageIfNeeded(20);
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
          pdf.text(labels[seccion], margin, y); y += 4;
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
          (analisis[seccion] || []).forEach((item: string, i: number) => {
            addPageIfNeeded(6);
            const prefix = seccion === 'recomendaciones' ? `${i + 1}. ` : '• ';
            const lines = pdf.splitTextToSize(`${prefix}${item}`, contentWidth);
            pdf.text(lines, margin + 2, y); y += lines.length * 4;
          });
          y += 2;
        });
      }

      // ── LISTA COMPLETA POR CUADRANTE ─────────────────────────
      addPageIfNeeded(20);
      y += 6;
      pdf.setFillColor(22, 33, 62);
      pdf.rect(margin, y, contentWidth, 8, 'F');
      pdf.setTextColor(255, 255, 255); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
      pdf.text('Detalle completo por cuadrante', margin + 3, y + 5.5);
      pdf.setTextColor(0, 0, 0);
      y += 12;

      CUADRANTES_ORDER.flat().forEach((cuadrante) => {
        const personas = employees.filter(e => e.quadrant === cuadrante);
        if (personas.length === 0) return;
        addPageIfNeeded(14);
        const color = COLORS[cuadrante] || [245, 245, 245];
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(margin, y, contentWidth, 7, 'F');
        pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(50, 50, 50);
        pdf.text(`${cuadrante} · ${personas.length} persona${personas.length !== 1 ? 's' : ''}`, margin + 3, y + 4.5);
        pdf.setTextColor(0, 0, 0);
        y += 9;

        personas.forEach((p) => {
          addPageIfNeeded(6);
          pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(0, 0, 0);
          const displayName = p.equipoNombre ? `${p.name}  (${p.equipoNombre})` : p.name;
          pdf.text(displayName, margin + 3, y);
          pdf.setDrawColor(220, 220, 220);
          pdf.line(margin, y + 1.5, margin + contentWidth, y + 1.5);
          y += 5.5;
        });
        y += 4;
      });

      // ── FOOTER en cada página ────────────────────────────────
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8); pdf.setTextColor(150, 150, 150);
        pdf.text('Nine Box Grid — Gestión Talento Seidor', margin, 290);
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, 290);
      }

      pdf.save(
        `ninebox-${empresaNombre}-${tableroNombre}-${periodo || 2026}.pdf`
          .toLowerCase()
          .replace(/\s+/g, '-')
      );
    } catch (e) {
      console.error('Error al generar PDF:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          {loading ? 'Generando...' : 'Descargar imagen'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={downloadPng}>Descargar PNG</DropdownMenuItem>
        <DropdownMenuItem onClick={downloadPdf}>Descargar PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
