import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmployeeData {
  nombre: string;
  performance: number;
  potencial: number;
  performance_category: string;
  potential_category: string;
  quadrant: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { tablero_id, empresa_id, empresa_nombre } = await req.json();

    console.log('📊 Generating report for tablero:', tablero_id, 'empresa:', empresa_id);

    // Get employees data
    const { data: empleados, error: empleadosError } = await supabase
      .from('empleados')
      .select('*')
      .eq('tablero_id', tablero_id)
      .order('performance', { ascending: false });

    if (empleadosError) {
      console.error('Error fetching employees:', empleadosError);
      throw empleadosError;
    }

    if (!empleados || empleados.length === 0) {
      throw new Error('No hay empleados en este tablero');
    }

    // Categorize employees
    const categorizedEmployees: EmployeeData[] = empleados.map((emp: any) => {
      const perfCategory = emp.performance >= 4 ? 'Alto' : emp.performance >= 3 ? 'Medio' : 'Bajo';
      const potCategory = emp.potencial > 2.5 ? 'Alto' : emp.potencial > 1.5 ? 'Medio' : 'Bajo';
      
      const quadrantNames: Record<string, string> = {
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

      return {
        nombre: emp.nombre,
        performance: emp.performance,
        potencial: emp.potencial,
        performance_category: perfCategory,
        potential_category: potCategory,
        quadrant: quadrantNames[`${potCategory}-${perfCategory}`] || 'Unknown',
      };
    });

    // Generate simple text report (PDF library not available in Deno Deploy)
    const reportLines = [
      `REPORTE NINE BOX - ${empresa_nombre}`,
      `Fecha: ${new Date().toLocaleDateString('es-ES')}`,
      `Total Empleados: ${empleados.length}`,
      '',
      'DISTRIBUCIÓN POR CUADRANTE:',
      '',
    ];

    // Group by quadrant
    const byQuadrant: Record<string, EmployeeData[]> = {};
    categorizedEmployees.forEach(emp => {
      if (!byQuadrant[emp.quadrant]) {
        byQuadrant[emp.quadrant] = [];
      }
      byQuadrant[emp.quadrant].push(emp);
    });

    // Add quadrant summaries with colors
    const quadrantOrder = [
      'Talento Estratégico',
      'Desarrollar', 
      'Enigma',
      'Consistente',
      'Clave',
      'Dilema',
      'Confiable',
      'Estancamiento',
      'Riesgo'
    ];

    quadrantOrder.forEach(quadrant => {
      const employees = byQuadrant[quadrant] || [];
      if (employees.length > 0) {
        reportLines.push(`\n${quadrant} (${employees.length}):`);
        employees.forEach(emp => {
          reportLines.push(`  - ${emp.nombre} (Perf: ${emp.performance.toFixed(1)}, Pot: ${emp.potencial.toFixed(1)})`);
        });
      }
    });

    // Create report as text file
    const reportText = reportLines.join('\n');
    const fileName = `ninebox_${empresa_nombre}_${new Date().toISOString().split('T')[0]}.txt`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('reportes')
      .upload(fileName, new Blob([reportText], { type: 'text/plain' }), {
        contentType: 'text/plain',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading report:', uploadError);
      throw uploadError;
    }

    // Get signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('reportes')
      .createSignedUrl(fileName, 3600); // 1 hour expiration

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
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
    console.error('Error generating report:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Error generating report',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});