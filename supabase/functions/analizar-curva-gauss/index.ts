import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      empresa, total, mean, p15, p85,
      bajoPct, esperadoPct, altoPct, resumenEquipos,
    } = await req.json();

    const prompt = `Sos un experto en gestión del talento y análisis estadístico de desempeño organizacional.
Analizá la siguiente distribución de desempeño en la Curva de Gauss y respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks.

EMPRESA: ${empresa}
TOTAL EMPLEADOS: ${total}
MEDIA DE DESEMPEÑO: ${Number(mean).toFixed(2)} (escala 1-5)
UMBRAL BAJO (P15): ${Number(p15).toFixed(2)}
UMBRAL ALTO (P85): ${Number(p85).toFixed(2)}

DISTRIBUCIÓN ACTUAL:
- Bajo desempeño (≤ ${Number(p15).toFixed(2)}): ${bajoPct}% | ideal: 15%
- Desempeño esperado: ${esperadoPct}% | ideal: 70%
- Alto desempeño (≥ ${Number(p85).toFixed(2)}): ${altoPct}% | ideal: 15%

DISTRIBUCIÓN POR EQUIPO:
${JSON.stringify(resumenEquipos, null, 2)}

Respondé con este JSON exacto:
{
  "estado_general": "saludable" | "atención" | "crítico",
  "resumen": "Una sola oración de máximo 25 palabras sobre el estado de la distribución",
  "pct_alto_potencial": número (% en alto desempeño),
  "pct_riesgo": número (% en bajo desempeño),
  "equipos": [
    { "nombre": "nombre del equipo", "estado": "verde" | "amarillo" | "rojo", "insight": "Una sola oración de máximo 15 palabras sobre este equipo" }
  ],
  "fortalezas": ["máximo 10 palabras cada una", "bullet 2", "bullet 3"],
  "alertas": ["máximo 10 palabras cada una", "alerta 2", "alerta 3"],
  "recomendaciones": ["acción concreta máximo 12 palabras", "acción 2", "acción 3"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Límite de uso alcanzado. Intentá de nuevo en unos minutos." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA agotados. Agregá créditos en Settings → Workspace → Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Error en el servicio de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const texto = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ analisis: texto }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error en analizar-curva-gauss:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
