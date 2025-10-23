import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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

    // Generate CSV content
    const csvLines = [
      'Nombre,Desempeño,Potencial,Cuadrante,Calibrado',
      ...employeeData.map(emp => 
        `"${emp.nombre}",${emp.performance},${emp.potencial},"${emp.cuadrante}",${emp.calibrado ? 'Sí' : 'No'}`
      )
    ];

    // Group by quadrant for summary
    const byQuadrant: Record<string, any[]> = {};
    employeeData.forEach(emp => {
      const quad = emp.cuadrante;
      if (!byQuadrant[quad]) byQuadrant[quad] = [];
      byQuadrant[quad].push(emp);
    });

    csvLines.push('');
    csvLines.push('RESUMEN POR CUADRANTE');
    csvLines.push('Cuadrante,Cantidad');
    
    Object.entries(byQuadrant).forEach(([quad, emps]) => {
      csvLines.push(`"${quad}",${emps.length}`);
    });

    const csvContent = csvLines.join('\n');
    const fileName = `ninebox_${empresa_nombre}_${Date.now()}.csv`;

    console.log(`✅ CSV generated: ${csvContent.length} characters`);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('reportes')
      .upload(fileName, csvContent, {
        contentType: 'text/csv',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw uploadError;
    }

    console.log('✅ CSV uploaded to storage:', fileName);

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
        format: 'csv',
        employeeCount: employeeData.length,
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
