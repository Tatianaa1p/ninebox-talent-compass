// Edge function: analiza tendencias del Nine Box Consolidado con Lovable AI
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResumenEquipo {
  equipo: string;
  tablero: string;
  total: number;
  distribucion: Record<string, number>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar JWT antes de cualquier procesamiento
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabaseClient.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cuadrantesRef = `CUADRANTES:
- ALTO POTENCIAL: Talento Estratégico, Desarrollar, Consistente
- MEDIO: Enigma, Clave, Confiable
- RIESGO: Dilema, Estancamiento, Riesgo`;

    const jsonShape = `Respondé con este JSON exacto:
{
  "estado_general": "saludable" | "atención" | "crítico",
  "resumen": "Una sola oración de máximo 20 palabras sobre el estado global",
  "pct_alto_potencial": número entre 0 y 100,
  "pct_riesgo": número entre 0 y 100,
  "equipos": [
    {
      "nombre": "nombre del equipo",
      "estado": "verde" | "amarillo" | "rojo",
      "insight": "Una sola oración de máximo 15 palabras sobre este equipo"
    }
  ],
  "fortalezas": ["bullet 1 de máximo 10 palabras", "bullet 2", "bullet 3"],
  "alertas": ["alerta 1 de máximo 10 palabras", "alerta 2", "alerta 3"],
  "recomendaciones": ["acción 1 concreta y directa", "acción 2", "acción 3"]
}`;

    const buildPromptPlanes = (planes: {
      totalConPlanDesarrollo: number;
      totalConPip: number;
      pipPendiente: number;
      pipEnCurso: number;
      pipCompletado: number;
    } | null | undefined) => {
      if (!planes) return "";
      const { totalConPlanDesarrollo, totalConPip, pipPendiente, pipEnCurso, pipCompletado } = planes;
      if (totalConPlanDesarrollo > 0 || totalConPip > 0) {
        return `
PLANES DE TALENTO ACTIVOS EN ESTE EQUIPO:
- Colaboradores con Plan de Desarrollo: ${totalConPlanDesarrollo}
- Colaboradores con PIP (Plan de Mejora): ${totalConPip}
${pipPendiente > 0 ? `  • PIP Pendiente: ${pipPendiente}\n` : ""}${pipEnCurso > 0 ? `  • PIP En curso: ${pipEnCurso}\n` : ""}${pipCompletado > 0 ? `  • PIP Completado: ${pipCompletado}\n` : ""}`;
      }
      return `
PLANES DE TALENTO: Aún no se han cargado planes de desarrollo ni PIPs para este equipo.
`;
    };

    const instruccionPlanes = `IMPORTANTE sobre los planes de talento:
Debés mencionar EXPLÍCITAMENTE en el análisis:
- Cuántos colaboradores tienen Plan de Desarrollo activo (número exacto)
- Cuántos tienen PIP activo (número exacto) y en qué estado
- Si ese número es suficiente o insuficiente respecto a la distribución del Nine Box
- Si hay colaboradores en Riesgo o Dilema SIN PIP asignado, marcarlo como alerta crítica
- Si hay colaboradores en Talento Estratégico o Desarrollar SIN plan de desarrollo, mencionarlo como oportunidad perdida

Incluí estos datos en la sección de Alertas o Recomendaciones con números concretos, no de forma implícita.`;

    let prompt = "";
    if (body.modo === "tablero") {
      const { empresa, equipo, tablero, totalEmpleados, distribucion, planes } = body as {
        empresa: string; equipo: string; tablero: string;
        totalEmpleados: number; distribucion: Record<string, string[]>;
        planes?: {
          totalConPlanDesarrollo: number;
          totalConPip: number;
          pipPendiente: number;
          pipEnCurso: number;
          pipCompletado: number;
        } | null;
      };
      const resumenPorEquipo = [{
        equipo,
        tablero,
        total: totalEmpleados,
        distribucion: Object.fromEntries(
          Object.entries(distribucion).map(([k, v]) => [k, v.length])
        ),
      }];

      const promptPlanes = buildPromptPlanes(planes);

      prompt = `Sos un experto en gestión del talento. Analizá esta distribución del Nine Box y respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks.

EMPRESA: ${empresa}
EQUIPO: ${equipo}
TABLERO: ${tablero}
TOTAL DE EMPLEADOS: ${totalEmpleados}

DISTRIBUCIÓN POR EQUIPO:
${JSON.stringify(resumenPorEquipo, null, 2)}

${cuadrantesRef}
${promptPlanes}
${instruccionPlanes}

${jsonShape}`;
    } else {
      const { empresa, totalEmpleados, resumenPorEquipo } = body as {
        empresa: string; totalEmpleados: number; resumenPorEquipo: ResumenEquipo[];
      };
      prompt = `Sos un experto en gestión del talento. Analizá esta distribución del Nine Box y respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks.

EMPRESA: ${empresa}
TOTAL DE EMPLEADOS: ${totalEmpleados}

DISTRIBUCIÓN POR EQUIPO:
${JSON.stringify(resumenPorEquipo, null, 2)}

${cuadrantesRef}

${jsonShape}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Límite de uso alcanzado. Intentá de nuevo en unos minutos." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA agotados. Agregá créditos en Settings → Workspace → Usage." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Error en el servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const texto = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ analisis: texto }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error en analizar-tendencias-ninebox:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
