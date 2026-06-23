/* =====================================================================
   /api/redactar.js — Función serverless (Vercel) que redacta secciones
   abiertas del IP con Claude (Anthropic). La API key vive en el servidor
   (variable de entorno ANTHROPIC_API_KEY), nunca en el navegador.

   POST /api/redactar
     body: { seccion: "flora_fauna" | ..., datos: {...} }
     ->   { ok:true, texto:"...", tablas?:{flora:[...], fauna:[...]} }

   Sin dependencias: usa fetch nativo (Node 18+ en Vercel).
   ===================================================================== */

const MODEL = "claude-sonnet-4-6";

const SYSTEM = [
  "Eres un especialista en elaboración de Informes Preventivos (IP) para la ASEA",
  "(Agencia de Seguridad, Energía y Ambiente) de México.",
  "Reglas estrictas:",
  "- Escribe en español técnico formal, nivel consultor ambiental senior.",
  "- No inventes datos. Usa únicamente la información proporcionada.",
  "- Si un dato no está disponible, escribe: [Dato pendiente: descripción].",
  "- El texto debe poder insertarse directamente en el IP sin edición posterior.",
  "- No incluyas encabezados de sección ni numeración; sólo el cuerpo redactado.",
].join("\n");

// Prompts maestros por sección (compactados del catálogo VerdeRaiz).
const PROMPTS = {
  flora_fauna: (d) => `Redacta el apartado III.4.3 "Identificación de aspectos bióticos" del IP.
Proyecto: ${d.nombre_proyecto || "[Dato pendiente: nombre del proyecto]"}.
Ubicación: ${d.ubicacion || `${d.municipio || "[municipio]"}, ${d.estado || "[estado]"}`}.
${d.superficie ? `Superficie del predio: ${d.superficie}.` : ""}
Contexto: estación de servicio (gasolinera) en ${d.en_anp ? "ZONA dentro de ANP/RAMSAR" : "zona urbana consolidada, fuera de ANP/RAMSAR"}.

Redacta 3–4 párrafos de prosa continua:
1. Caracterización de la vegetación del área de influencia (tipo, cobertura y estado de conservación, con base fisonómico-florística de Rzedowski 1978), señalando el grado de modificación antrópica del predio.
2. Fauna asociada (mamíferos, aves, anfibios y reptiles) esperable para la región, citando fuentes bibliográficas (CONABIO–Enciclovida, SNIB, CONANP) y el estatus conforme a la NOM-059-SEMARNAT-2010.
3. Diagnóstico del valor ambiental del predio y de la presencia/ausencia de especies en categoría de riesgo o endémicas.
${d.especies_resumen ? `\nDatos de campo disponibles (úsalos, no inventes más):\n${d.especies_resumen}` : "\nNo hay listado de especies de campo; indícalo como [Dato pendiente: listado de especies con verificación en campo / CONABIO]."}`,
};

async function redactarSeccion(seccion, datos) {
  const build = PROMPTS[seccion];
  if (!build) throw new Error(`Sección no soportada: ${seccion}`);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor (Vercel → Settings → Environment Variables).");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{ role: "user", content: build(datos || {}) }],
    }),
  });

  if (!resp.ok) {
    const detalle = await resp.text();
    throw new Error(`Anthropic ${resp.status}: ${detalle.slice(0, 300)}`);
  }
  const data = await resp.json();
  const texto = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  return { texto };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Usa POST." });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { seccion, datos } = body;
    const out = await redactarSeccion(seccion, datos);
    res.status(200).json({ ok: true, ...out });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
};

// Exportado para pruebas locales con node.
module.exports.redactarSeccion = redactarSeccion;
