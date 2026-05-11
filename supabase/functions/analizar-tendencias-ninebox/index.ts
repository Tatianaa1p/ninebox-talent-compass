// Edge function: analiza tendencias del Nine Box Consolidado con Lovable AI
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
    const body = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cuadrantesRef = `CUADRANTES DEL NINE BOX:
- Talento Estratégico (Alto potencial + Alto desempeño): referentes, cuidar y retener
- Desarrollar (Alto potencial + Medio desempeño): potencial alto sin explotar
- Enigma (Alto potencial + Bajo desempeño): necesitan claridad y apoyo del líder
- Consistente (Medio potencial + Alto desempeño): sólidos y confiables
- Clave (Medio potencial + Medio desempeño): núcleo estable del equipo
- Dilema (Medio potencial + Bajo desempeño): requieren plan de mejora
- Confiable (Bajo potencial + Alto desempeño): expertos en su rol, motivarlos
- Estancamiento (Bajo potencial + Medio desempeño): riesgo de desmotivación
- Riesgo (Bajo potencial + Bajo desempeño): acción inmediata`;

    let prompt = "";
    if (body.modo === "tablero") {
      const { empresa, equipo, tablero, totalEmpleados, distribucion } = body as {
        empresa: string; equipo: string; tablero: string;
        totalEmpleados: number; distribucion: Record<string, string[]>;
      };
      const resumen = Object.entries(distribucion)
        .map(([c, nombres]) => `${c} (${nombres.length} persona${nombres.length !== 1 ? "s" : ""}): ${nombres.join(", ")}`)
        .join("\n");

      prompt = `Sos un experto en gestión del talento y desarrollo organizacional.
Analizá la siguiente distribución de empleados en el Nine Box Grid y generá recomendaciones accionables para RRHH.

EMPRESA: ${empresa}
EQUIPO: ${equipo}
TABLERO: ${tablero}
TOTAL DE EMPLEADOS: ${totalEmpleados}

DISTRIBUCIÓN:
${resumen}

${cuadrantesRef}

Generá el siguiente análisis en español, tono profesional y directo:
1. **Estado general del equipo** (2-3 oraciones)
2. **Fortalezas** (qué está bien)
3. **Riesgos y alertas** (qué requiere atención inmediata)
4. **Recomendaciones para RRHH** (3 acciones concretas y priorizadas)

Sé específico, mencioná los cuadrantes con más y menos personas. No uses lenguaje genérico.`;
    } else {
      const { empresa, totalEmpleados, resumenPorEquipo } = body as {
        empresa: string; totalEmpleados: number; resumenPorEquipo: ResumenEquipo[];
      };
      prompt = `Sos un experto en gestión del talento y desarrollo organizacional.
Analizá la siguiente distribución de empleados en el Nine Box Grid por equipo y generá un análisis de tendencias.

EMPRESA: ${empresa}
TOTAL DE EMPLEADOS: ${totalEmpleados}

DISTRIBUCIÓN POR EQUIPO:
${JSON.stringify(resumenPorEquipo, null, 2)}

${cuadrantesRef}

Por favor generá:
1. **Resumen ejecutivo** (2-3 oraciones sobre el estado general de la empresa)
2. **Tendencias por equipo** (para cada equipo, 1-2 oraciones sobre su situación)
3. **Equipos destacados** (cuál tiene más talento estratégico, cuál tiene más riesgo)
4. **Recomendaciones prioritarias** (3 acciones concretas para RRHH)

Usá un tono profesional, directo y accionable. Respondé en español usando markdown (negritas con **texto**).`;
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
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
