import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📊 Starting report generation...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('✅ User authenticated:', user.email);

    const { tablero_id, empresa_id, empresa_nombre } = await req.json();
    console.log('📥 Request params:', { tablero_id, empresa_id, empresa_nombre });

    // Get calibraciones with employee names
    const { data: calibraciones, error: calibError } = await supabase
      .from('calibraciones')
      .select(`
        *,
        evaluaciones!inner(persona_nombre, tablero_id)
      `)
      .eq('empresa_id', empresa_id)
      .eq('evaluaciones.tablero_id', tablero_id);

    if (calibError) {
      console.error('❌ Error fetching calibraciones:', calibError);
      throw calibError;
    }

    console.log(`📊 Found ${calibraciones?.length || 0} calibraciones`);

    // If no calibraciones, get empleados directly
    let employeeData: any[] = [];
    
    if (!calibraciones || calibraciones.length === 0) {
      console.log('⚠️ No calibraciones found, fetching empleados directly...');
      
      const { data: empleados, error: empError } = await supabase
        .from('empleados')
        .select('*')
        .eq('tablero_id', tablero_id);

      if (empError) {
        console.error('❌ Error fetching empleados:', empError);
        throw empError;
      }

      employeeData = empleados?.map(emp => ({
        nombre: emp.nombre,
        performance: emp.performance || 0,
        potencial: emp.potencial || 0,
        cuadrante: getCuadrante(emp.performance || 0, emp.potencial || 0),
        calibrado: false,
      })) || [];
    } else {
      employeeData = calibraciones.map(cal => ({
        nombre: cal.evaluaciones?.persona_nombre || 'N/A',
        performance: cal.score_calibrado_desempeno,
        potencial: cal.score_calibrado_potencial,
        cuadrante: cal.cuadrante_calibrado,
        cuadrante_original: cal.cuadrante_original,
        calibrado: true,
      }));
    }

    console.log(`✅ Processing ${employeeData.length} employees`);

    // Create PDF in memory
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    
    // Title
    page.drawText(`REPORTE NINE BOX - ${empresa_nombre}`, {
      x: 50,
      y: height - 50,
      size: 20,
      font: helveticaBold,
      color: rgb(0, 0, 0.5),
    });

    // Date
    page.drawText(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, {
      x: 50,
      y: height - 75,
      size: 12,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });

    // Total employees
    page.drawText(`Total Empleados: ${employeeData.length}`, {
      x: 50,
      y: height - 95,
      size: 12,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });

    // Draw 3x3 grid
    const gridStartX = 50;
    const gridStartY = height - 450;
    const cellWidth = 165;
    const cellHeight = 100;

    // Draw grid lines
    for (let i = 0; i <= 3; i++) {
      // Vertical lines
      page.drawLine({
        start: { x: gridStartX + (i * cellWidth), y: gridStartY },
        end: { x: gridStartX + (i * cellWidth), y: gridStartY + (3 * cellHeight) },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      // Horizontal lines
      page.drawLine({
        start: { x: gridStartX, y: gridStartY + (i * cellHeight) },
        end: { x: gridStartX + (3 * cellWidth), y: gridStartY + (i * cellHeight) },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }

    // Labels
    const potentialLabels = ['Alto', 'Medio', 'Bajo'];
    const performanceLabels = ['Bajo', 'Medio', 'Alto'];

    // Draw axis labels
    page.drawText('POTENCIAL →', {
      x: gridStartX - 40,
      y: gridStartY + 150,
      size: 10,
      font: helveticaBold,
      rotate: { angle: 90, type: 'degrees' },
    });

    page.drawText('DESEMPEÑO →', {
      x: gridStartX + 200,
      y: gridStartY - 20,
      size: 10,
      font: helveticaBold,
    });

    // Group by quadrant
    const byQuadrant: Record<string, any[]> = {};
    employeeData.forEach(emp => {
      const quad = emp.cuadrante || emp.cuadrante;
      if (!byQuadrant[quad]) byQuadrant[quad] = [];
      byQuadrant[quad].push(emp);
    });

    // Draw employee counts in grid
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const pot = potentialLabels[row];
        const perf = performanceLabels[col];
        const quadName = getCuadranteNombre(perf, pot);
        const employees = byQuadrant[quadName] || [];
        
        const cellX = gridStartX + (col * cellWidth) + 10;
        const cellY = gridStartY + ((2 - row) * cellHeight) + cellHeight - 20;
        
        page.drawText(`${pot}-${perf}`, {
          x: cellX,
          y: cellY,
          size: 8,
          font: timesRomanFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        
        page.drawText(`(${employees.length})`, {
          x: cellX,
          y: cellY - 15,
          size: 10,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
      }
    }

    // Employee list below grid
    let listY = gridStartY - 50;
    page.drawText('EMPLEADOS POR CUADRANTE:', {
      x: 50,
      y: listY,
      size: 12,
      font: helveticaBold,
    });

    listY -= 25;
    const quadrantOrder = [
      'Talento Estratégico', 'Desarrollar', 'Enigma',
      'Consistente', 'Clave', 'Dilema',
      'Confiable', 'Estancamiento', 'Riesgo'
    ];

    for (const quadName of quadrantOrder) {
      const employees = byQuadrant[quadName] || [];
      if (employees.length > 0 && listY > 50) {
        page.drawText(`${quadName} (${employees.length}):`, {
          x: 50,
          y: listY,
          size: 10,
          font: helveticaBold,
        });
        listY -= 15;

        employees.slice(0, 3).forEach(emp => {
          if (listY > 50) {
            page.drawText(
              `  • ${emp.nombre} (P:${emp.performance.toFixed(1)}, Pot:${emp.potencial.toFixed(1)})`,
              { x: 60, y: listY, size: 8, font: timesRomanFont }
            );
            listY -= 12;
          }
        });

        if (employees.length > 3) {
          page.drawText(`  ... y ${employees.length - 3} más`, {
            x: 60,
            y: listY,
            size: 8,
            font: timesRomanFont,
            color: rgb(0.5, 0.5, 0.5),
          });
          listY -= 15;
        }
        listY -= 5;
      }
    }

    // Generate PDF bytes in memory
    const pdfBytes = await pdfDoc.save();
    console.log(`✅ PDF generated: ${pdfBytes.length} bytes`);

    // Upload to storage
    const fileName = `ninebox_${empresa_nombre}_${Date.now()}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from('reportes')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw uploadError;
    }

    console.log('✅ PDF uploaded to storage:', fileName);

    // Get signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('reportes')
      .createSignedUrl(fileName, 3600);

    if (signedUrlError) {
      console.error('❌ Signed URL error:', signedUrlError);
      throw signedUrlError;
    }

    console.log('✅ Report generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        signedUrl: signedUrlData.signedUrl,
        fileName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error generating report:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Error generating report',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper functions
function getCuadrante(performance: number, potencial: number): string {
  const perfCat = performance >= 4 ? 'Alto' : performance >= 3 ? 'Medio' : 'Bajo';
  const potCat = potencial >= 4 ? 'Alto' : potencial >= 3 ? 'Medio' : 'Bajo';
  return getCuadranteNombre(perfCat, potCat);
}

function getCuadranteNombre(performance: string, potential: string): string {
  const nombres: Record<string, string> = {
    'Alto-Alto': 'Talento Estratégico',
    'Alto-Medio': 'Desarrollar',
    'Alto-Bajo': 'Enigma',
    'Medio-Alto': 'Consistente',
    'Medio-Medio': 'Clave',
    'Medio-Bajo': 'Dilema',
    'Bajo-Alto': 'Confiable',
    'Bajo-Medio': 'Estancamiento',
    'Bajo-Bajo': 'Riesgo',
  };
  return nombres[`${potential}-${performance}`] || 'Desconocido';
}
