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

// Encabezado común con los datos del proyecto.
function ctx(d) {
  const ubic = d.ubicacion || `${d.municipio || "[municipio]"}, ${d.estado || "[estado]"}`;
  return `Proyecto: ${d.nombre_proyecto || "[Dato pendiente: nombre del proyecto]"}.
Ubicación: ${ubic}.${d.superficie ? ` Superficie del predio: ${d.superficie}.` : ""}
Giro: estación de servicio (gasolinera, sector hidrocarburos), ${d.en_anp ? "DENTRO de ANP/RAMSAR" : "zona urbana consolidada, fuera de ANP/RAMSAR"}.`;
}
const extra = (d) => (d.notas ? `\nDatos adicionales del proyecto (úsalos, no inventes más):\n${d.notas}` : "");

// Prompts maestros por sección (Sistema IP 2026 — compactados del catálogo VerdeRaíz).
const PROMPTS = {
  descripcion_tecnica: (d) => `${ctx(d)}
Redacta los apartados III.1.2 a III.1.7 (Descripción técnica) del Informe Preventivo, en prosa técnica continua:
1. Actividades principales (recepción, almacenamiento, despacho de combustibles y recuperación de vapores SRV).
2. Dimensiones y distribución de áreas del predio.
3. Características operativas (presiones, temperaturas) y programa de trabajo (preparación, construcción, operación, abandono).
4. Detalles técnicos: tanques de almacenamiento (TAR doble pared, identificados T-01, T-02, T-03 con capacidades), líneas/tuberías, sistema de recuperación de vapores (eficiencia ≥95%, NOM-004-ASEA-2017) y controles de seguridad.
Marca con [Dato pendiente: ...] cualquier especificación que no se proporcione.${extra(d)}`,

  emisiones_residuos: (d) => `${ctx(d)}
Redacta la sección III.3 (Emisiones, descargas y residuos) del Informe Preventivo, en prosa técnica continua, por etapa (preparación, construcción, operación, abandono):
1. Emisiones atmosféricas: COV/VOC sin SRV (~5 ton/año) vs con SRV ≥95% (~0.25 ton/año), cumplimiento NOM-004-ASEA-2017.
2. Descargas de agua: sanitarias (fosa séptica) y aceitosas (separador agua-aceite/trampa de grasas).
3. Residuos: RSU, RME (filtros/trapos, NOM-001-ASEA-2019), RP (aceites/solventes, NOM-052-SEMARNAT-2005, manifiestos y gestor autorizado) y RCD.
4. Ruido (NOM-081-SEMARNAT-1994) y medidas de control por tipo y etapa.
Marca [Dato pendiente: ...] donde falten cantidades.${extra(d)}`,

  flora_fauna: (d) => `${ctx(d)}
Redacta el apartado III.4.3 "Identificación de aspectos bióticos" del IP, en 3–4 párrafos de prosa continua:
1. Caracterización de la vegetación del área de influencia (tipo, cobertura y estado, base fisonómico-florística de Rzedowski 1978) y grado de modificación antrópica del predio.
2. Fauna asociada (mamíferos, aves, anfibios y reptiles) esperable para la región, citando CONABIO–Enciclovida, SNIB y CONANP, con estatus NOM-059-SEMARNAT-2010.
3. Diagnóstico del valor ambiental del predio y presencia/ausencia de especies en riesgo o endémicas.
${d.especies_resumen ? `\nDatos de campo disponibles (úsalos, no inventes más):\n${d.especies_resumen}` : "\nSi no hay listado de especies de campo, indícalo como [Dato pendiente: listado de especies con verificación en campo / CONABIO]."}${extra(d)}`,

  impactos: (d) => `${ctx(d)}
Redacta la sección III.5 (Identificación y descripción de impactos ambientales) del IP. La metodología (Matriz de Leopold adaptada 29 acciones × 18 factores y evaluación Gómez-Orea con índice de significancia ISIG) ya está descrita; enfócate en:
1. III.5.7 — Descripción narrativa de los impactos de mayor significancia (ALTOS y MEDIOS), tanto negativos como positivos: origen (acción-factor), receptor afectado y cuantificación cuando exista.
2. III.5.8 — Balance de impacto neto (resumen de positivos y negativos) y conclusión de viabilidad ambiental con medidas.
Para una gasolinera urbana, los impactos relevantes típicos son: riesgo de infiltración de hidrocarburos al suelo/acuífero, emisiones COV, ruido y tráfico (negativos), y empleo y servicio energético (positivos).
${d.matriz_resumen ? `\nResultados de la matriz (úsalos, no inventes índices):\n${d.matriz_resumen}` : "\nSi no se proporciona la matriz calculada, descríbelos cualitativamente y marca [Dato pendiente: índices ISIG de la matriz Leopold/Gómez-Orea]."}${extra(d)}`,

  medidas: (d) => `${ctx(d)}
Redacta las secciones III.6 y III.7 (Medidas de prevención, mitigación y compensación) del IP, en prosa técnica. Organiza las medidas por etapa (construcción, operación, abandono). Cada medida debe indicar: impacto que atiende, descripción específica (no genérica), responsable (puesto), indicador verificable y fundamento normativo (NOM aplicable), con impacto residual estimado. Cierra con el párrafo del Programa de Vigilancia Ambiental (frecuencias de inspección, pruebas SRV, medición de ruido, auditoría de RP).${extra(d)}`,

  abandono: (d) => `${ctx(d)}
Redacta la sección IV (Abandono del sitio) del IP, apartados IV.1 a IV.8, en prosa técnica:
1. Gatillos y tipo de cierre (fin de vida útil, ~25 años).
2. Acciones por componente (tanques: desgasificación y retiro con manifiestos; líneas: purga; SRV: desmontaje; estructuras: demolición; suelo: muestreo).
3. Procedimientos críticos de seguridad (desgasificación con N₂ y LEL <10%, LOTO, permisos de trabajo, EPP, detector 4 gases).
4. Gestión de residuos de cierre, muestreo confirmatorio de suelo (grid 3–5 puntos, TPH/BTEX/metales, laboratorio NMX-EC-17025), restitución del sitio, criterios de finalización y avisos administrativos (ASEA 30 días, municipio 10 días).${extra(d)}`,
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
