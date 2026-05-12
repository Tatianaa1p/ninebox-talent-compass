import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import {
  EmpleadoConPlan,
  PIP_ESTADO_LABELS,
  ACCION_ESTADO_LABELS,
} from '@/types/talentPlan';
import jsPDF from 'jspdf';
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Packer,
} from 'docx';
import { saveAs } from 'file-saver';

interface Props {
  empleado: EmpleadoConPlan;
}

export const DownloadPlanButton = ({ empleado }: Props) => {
  const [loading, setLoading] = useState(false);

  const getTipoLabel = () =>
    empleado.tipo === 'desarrollo' ? 'Plan de Desarrollo' : 'Plan de Mejora (PIP)';

  const buildContent = () => {
    const lines: string[] = [];
    lines.push(getTipoLabel());
    lines.push(`Colaborador: ${empleado.nombre}`);
    
    lines.push('');

    if (empleado.tipo === 'desarrollo') {
      lines.push('PLAN DE DESARROLLO');
      lines.push(`Plan de carrera: ${empleado.plan?.plan_carrera || 'No definido'}`);
      lines.push(`Mentor asignado: ${empleado.plan?.mentor || 'No asignado'}`);
      lines.push(`Proyectos clave: ${empleado.plan?.proyectos_clave || 'No definidos'}`);
      lines.push(`Notas: ${empleado.plan?.notas || '-'}`);
    } else {
      lines.push('PLAN DE MEJORA (PIP)');
      lines.push(`Objetivo: ${empleado.plan?.pip_objetivo || 'No definido'}`);
      lines.push(
        `Estado: ${empleado.plan?.pip_estado ? PIP_ESTADO_LABELS[empleado.plan.pip_estado] : 'Sin estado'}`,
      );
      lines.push(
        `Fecha inicio: ${empleado.plan?.pip_fecha_inicio ? new Date(empleado.plan.pip_fecha_inicio).toLocaleDateString('es-AR') : '-'}`,
      );
      lines.push(
        `Fecha límite: ${empleado.plan?.pip_fecha_fin ? new Date(empleado.plan.pip_fecha_fin).toLocaleDateString('es-AR') : '-'}`,
      );
      lines.push(`Notas: ${empleado.plan?.notas || '-'}`);
    }

    lines.push('');
    lines.push('ACCIONES DE SEGUIMIENTO');
    if (empleado.acciones.length === 0) {
      lines.push('Sin acciones registradas.');
    } else {
      empleado.acciones.forEach((acc, i) => {
        lines.push(`${i + 1}. ${acc.descripcion}`);
        lines.push(`   Estado: ${ACCION_ESTADO_LABELS[acc.estado]}`);
        if (acc.responsable) lines.push(`   Responsable: ${acc.responsable}`);
        if (acc.fecha_limite)
          lines.push(`   Fecha límite: ${new Date(acc.fecha_limite).toLocaleDateString('es-AR')}`);
      });
    }

    lines.push('');
    lines.push('NOTAS Y COMENTARIOS');
    if (empleado.notas.length === 0) {
      lines.push('Sin notas registradas.');
    } else {
      empleado.notas.forEach((nota) => {
        lines.push(`• ${nota.contenido}`);
        lines.push(
          `  ${nota.autor_email || ''} — ${new Date(nota.created_at).toLocaleDateString('es-AR')}`,
        );
      });
    }

    return lines;
  };

  const fileBaseName = () =>
    `plan-${empleado.nombre.toLowerCase().replace(/\s+/g, '-')}`;

  const downloadPdf = async () => {
    setLoading(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const lines = buildContent();
      const margin = 20;
      let y = margin;
      const lineHeight = 7;
      const pageHeight = 297 - margin;

      pdf.setFillColor(22, 33, 62);
      pdf.rect(0, 0, 210, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(getTipoLabel(), margin, 16);
      y = 35;

      pdf.setTextColor(0, 0, 0);

      lines.forEach((line) => {
        if (y > pageHeight) {
          pdf.addPage();
          y = margin;
        }

        if (line === getTipoLabel()) return;

        if (
          line === 'PLAN DE DESARROLLO' ||
          line === 'PLAN DE MEJORA (PIP)' ||
          line === 'ACCIONES DE SEGUIMIENTO' ||
          line === 'NOTAS Y COMENTARIOS'
        ) {
          y += 3;
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(22, 33, 62);
          pdf.text(line, margin, y);
          y += lineHeight;
          pdf.setTextColor(0, 0, 0);
        } else if (line === '') {
          y += 3;
        } else if (line.startsWith('   ') || line.startsWith('  ')) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text(line.trim(), margin + 8, y);
          y += lineHeight - 1;
          pdf.setTextColor(0, 0, 0);
        } else {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const split = pdf.splitTextToSize(line, 170);
          split.forEach((l: string) => {
            if (y > pageHeight) {
              pdf.addPage();
              y = margin;
            }
            pdf.text(l, margin, y);
            y += lineHeight;
          });
        }
      });

      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generado el ${new Date().toLocaleDateString('es-AR')}`, margin, 290);

      pdf.save(`${fileBaseName()}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocx = async () => {
    setLoading(true);
    try {
      const accionesRows =
        empleado.acciones.length > 0
          ? empleado.acciones.map(
              (acc) =>
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun(acc.descripcion)] })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun(ACCION_ESTADO_LABELS[acc.estado])] }),
                      ],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun(acc.responsable || '-')] })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun(
                              acc.fecha_limite
                                ? new Date(acc.fecha_limite).toLocaleDateString('es-AR')
                                : '-',
                            ),
                          ],
                        }),
                      ],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
            )
          : [];

      const planParagraphs =
        empleado.tipo === 'desarrollo'
          ? [
              new Paragraph({ text: `Plan de carrera: ${empleado.plan?.plan_carrera || 'No definido'}` }),
              new Paragraph({ text: `Mentor: ${empleado.plan?.mentor || 'No asignado'}` }),
              new Paragraph({ text: `Proyectos clave: ${empleado.plan?.proyectos_clave || 'No definidos'}` }),
              new Paragraph({ text: `Notas: ${empleado.plan?.notas || '-'}` }),
            ]
          : [
              new Paragraph({ text: `Objetivo: ${empleado.plan?.pip_objetivo || 'No definido'}` }),
              new Paragraph({
                text: `Estado: ${empleado.plan?.pip_estado ? PIP_ESTADO_LABELS[empleado.plan.pip_estado] : '-'}`,
              }),
              new Paragraph({
                text: `Fecha inicio: ${empleado.plan?.pip_fecha_inicio ? new Date(empleado.plan.pip_fecha_inicio).toLocaleDateString('es-AR') : '-'}`,
              }),
              new Paragraph({
                text: `Fecha límite: ${empleado.plan?.pip_fecha_fin ? new Date(empleado.plan.pip_fecha_fin).toLocaleDateString('es-AR') : '-'}`,
              }),
              new Paragraph({ text: `Notas: ${empleado.plan?.notas || '-'}` }),
            ];

      const accionesContent =
        empleado.acciones.length > 0
          ? [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [new TextRun({ text: 'Descripción', bold: true })],
                          }),
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({ children: [new TextRun({ text: 'Estado', bold: true })] }),
                        ],
                        width: { size: 20, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [new TextRun({ text: 'Responsable', bold: true })],
                          }),
                        ],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [new TextRun({ text: 'Fecha límite', bold: true })],
                          }),
                        ],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                  ...accionesRows,
                ],
              }),
            ]
          : [new Paragraph({ text: 'Sin acciones registradas.' })];

      const notasContent =
        empleado.notas.length > 0
          ? empleado.notas.map(
              (nota) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: nota.contenido }),
                    new TextRun({
                      text: `  — ${nota.autor_email || ''} (${new Date(nota.created_at).toLocaleDateString('es-AR')})`,
                      color: '888888',
                      size: 18,
                    }),
                  ],
                }),
            )
          : [new Paragraph({ text: 'Sin notas registradas.' })];

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({ text: getTipoLabel(), heading: HeadingLevel.HEADING_1 }),
              new Paragraph({ text: `Colaborador: ${empleado.nombre}` }),
              
              new Paragraph({ text: '' }),
              new Paragraph({
                text: empleado.tipo === 'desarrollo' ? 'Plan de Desarrollo' : 'Plan de Mejora (PIP)',
                heading: HeadingLevel.HEADING_2,
              }),
              ...planParagraphs,
              new Paragraph({ text: '' }),
              new Paragraph({ text: 'Acciones de seguimiento', heading: HeadingLevel.HEADING_2 }),
              ...accionesContent,
              new Paragraph({ text: '' }),
              new Paragraph({ text: 'Notas y comentarios', heading: HeadingLevel.HEADING_2 }),
              ...notasContent,
              new Paragraph({ text: '' }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Generado el ${new Date().toLocaleDateString('es-AR')}`,
                    color: '999999',
                    size: 18,
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileBaseName()}.docx`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={loading}>
          <Download className="h-3.5 w-3.5 mr-1" />
          {loading ? 'Generando...' : 'Descargar plan'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={downloadPdf}>Descargar PDF</DropdownMenuItem>
        <DropdownMenuItem onClick={downloadDocx}>Descargar Word (.docx)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
