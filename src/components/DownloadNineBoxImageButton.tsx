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

interface Props {
  tableroNombre: string;
  empresaNombre: string;
}

export const DownloadNineBoxImageButton = ({ tableroNombre, empresaNombre }: Props) => {
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
    try {
      const dataUrl = await captureElement();
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height],
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
      pdf.save(`${baseName}.pdf`);
    } catch (e) {
      console.error('Error al generar PDF:', e);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Descargar imagen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={downloadPng}>Descargar PNG</DropdownMenuItem>
        <DropdownMenuItem onClick={downloadPdf}>Descargar PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
