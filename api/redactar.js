/* =====================================================================
   /api/redactar.js — Función serverless (Vercel) que redacta secciones
   abiertas del IP con Claude (Anthropic). La API key vive en el servidor
   (variable de entorno ANTHROPIC_API_KEY), nunca en el navegador.

   POST /api/redactar
     body: { seccion: "flora_fauna" | ..., datos: {...} }
     ->   { ok:true, texto:"...", tablas?:{...} }

   Sin dependencias: usa fetch nativo (Node 18+ en Vercel).
   ===================================================================== */

const MODEL = "claude-sonnet-4-6";

// ── SYSTEM ─────────────────────────────────────────────────────────────────
// Se pasa como bloque "system" de la API; define el rol y las reglas absolutas.
const SYSTEM =
  "Eres un consultor ambiental senior especializado en Informes Preventivos (IP) " +
  "para la Agencia de Seguridad, Energía y Ambiente (ASEA) de México, sector hidrocarburos.\n\n" +
  "REGLAS ABSOLUTAS — incumplirlas invalida el texto:\n" +
  "Escribe exclusivamente en español técnico formal.\n" +
  "No inventes datos ni cifras; si un dato no se proporcionó, escribe [Dato pendiente: descripción breve].\n" +
  "El texto debe poder insertarse directamente en el IP sin edición de formato posterior.\n" +
  "PROHIBIDO TODO MARKDOWN: no uses almohadillas (#), asteriscos (*), guiones bajos (_), " +
  "negritas (**texto**), cursivas (*texto*), viñetas (- o •) ni tablas markdown.\n" +
  "PROHIBIDOS los encabezados implícitos: no comiences párrafo con el nombre de una subsección, " +
  "una letra seguida de paréntesis (A), B)) ni un número seguido de punto (1., 2.).\n" +
  "Entrega ÚNICAMENTE prosa de informe en párrafos separados por una línea en blanco.\n" +
  "No incluyas títulos de sección, subtítulos ni ningún tipo de cabecera.\n" +
  "Cita las normas con su clave completa y, cuando proceda, su año de publicación en DOF.\n" +
  "Longitud y profundidad: ajústate al objetivo indicado; ni más breve ni más extenso.";

// ── LIMPIEZA DEFENSIVA DE MARKDOWN ────────────────────────────────────────
// El modelo puede incumplir a pesar del SYSTEM; este paso corrige los residuos.
function limpiarMarkdown(t) {
  if (!t) return t;
  return String(t)
    // Encabezados Markdown: # Título, ## Título, etc.
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    // Negritas e itálicas: **texto**, __texto__, *texto*, _texto_
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    // Asteriscos y guiones bajos sueltos residuales
    .replace(/\*+/g, "").replace(/_+/g, "")
    // Viñetas: líneas que empiezan con - , • , *, + seguido de espacio
    .replace(/^\s*[-•*+]\s+/gm, "")
    // Listas numeradas: "1. ", "2. ", "A. ", "a) ", "A) " al inicio de línea
    .replace(/^\s*(?:[0-9]+\.|[A-Za-z][.):])\s+/gm, "")
    // Separadores horizontales: --- , ___ , ===
    .replace(/^[-_=]{3,}\s*$/gm, "")
    // Código inline: `código`
    .replace(/`([^`]+)`/g, "$1")
    // Bloques de código: ```...```
    .replace(/```[\s\S]*?```/g, "")
    // Más de dos saltos de línea consecutivos → dos
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── CONTEXTO COMÚN ────────────────────────────────────────────────────────
// Encabezado con los datos del proyecto que antecede a cada prompt.
function ctx(d) {
  const ubic = d.ubicacion || `${d.municipio || "[municipio]"}, ${d.estado || "[estado]"}`;
  return (
    `Proyecto: ${d.nombre_proyecto || "[Dato pendiente: nombre del proyecto]"}. ` +
    `Ubicación: ${ubic}.` +
    (d.superficie ? ` Superficie del predio: ${d.superficie}.` : "") +
    ` Giro: estación de servicio (gasolinera, sector hidrocarburos), ` +
    (d.en_anp ? "DENTRO de ANP o sitio RAMSAR." : "zona urbana consolidada, fuera de ANP y sitio RAMSAR.")
  );
}
const extra = (d) =>
  d.notas
    ? `\n\nDatos adicionales del proyecto (úsalos; no inventes más):\n${d.notas}`
    : "";

// ── META (instrucciones de longitud y fuente por sección) ─────────────────
const meta = (fuente, longitud, formato) =>
  `\n\n[Fuente de datos: ${fuente}. Longitud objetivo: ${longitud}. ${formato}.]`;

const META = {
  descripcion_tecnica: meta(
    "memoria técnica del proyecto, planos y P&ID",
    "4–6 párrafos (≈1–1.5 cuartillas)",
    "Prosa técnica continua; no repitas los datos en tablas; narra el proceso operativo"
  ),
  emisiones_residuos: meta(
    "HDSM, NOMs aplicables, memoria técnica",
    "un párrafo por etapa (cuatro etapas)",
    "Prosa por etapa; cuantifica cuando haya dato; vincula cada residuo con su NOM"
  ),
  flora_fauna: meta(
    "CONABIO-Enciclovida, SNIB, iNaturalist, SIGEIA",
    "3–4 párrafos",
    "Prosa; razona el grado de modificación; separa el predio del área de influencia"
  ),
  impactos: meta(
    "Matriz de Leopold adaptada, índices ISIG de Gómez-Orea, secciones III.1–III.4",
    "4–8 párrafos para III.5.7 más 1–2 párrafos para III.5.8",
    "Prosa; prioriza impactos por significancia; nombra acción-factor-receptor; concluye viabilidad"
  ),
  medidas: meta(
    "impactos de III.5, catálogo de NOMs aplicables",
    "un párrafo por etapa más uno de PVA",
    "Cada medida ligada a un impacto con responsable, indicador y NOM; sin generalidades"
  ),
  vigilancia: meta(
    "impactos de III.5, tablas de medidas de III.6",
    "2–3 párrafos",
    "Prosa técnica; incluye acciones, indicadores verificables, frecuencias y responsables"
  ),
  abandono: meta(
    "datos técnicos del proyecto: tanques, volúmenes, vida útil estimada",
    "1–2 párrafos por apartado (IV.1 a IV.8)",
    "Prosa técnica; procedimientos explícitos con desgasificación, LOTO y plazos de aviso"
  ),
  sustentabilidad: meta(
    "compromisos voluntarios del promovente, contexto del proyecto",
    "1–2 párrafos",
    "Prosa declarativa; buenas prácticas voluntarias con indicador de cumplimiento para cada una"
  ),
  conclusion: meta(
    "síntesis del IP completo: secciones I a IV, tablas de impactos y compromisos",
    "4–5 párrafos de síntesis",
    "Prosa integradora; sintetiza hallazgos; no repite datos detallados; tono declarativo ante ASEA"
  ),
  diagnostico_ambiental: meta(
    "resultados de III.4.1–III.4.5: abióticos, bióticos, socioeconómico y receptores",
    "3–4 párrafos integradores",
    "Prosa continua; cierra con juicio de sensibilidad global del AI y compatibilidad del sitio"
  ),
};

// ── PROMPTS MAESTROS ───────────────────────────────────────────────────────
// Cada función recibe los datos del proyecto y devuelve el texto del prompt de usuario.
// Regla de escritura: instrucciones en prosa fluida, sin listas numeradas ni viñetas,
// para que el modelo no reproduzca esa estructura en la salida.
const PROMPTS = {

  descripcion_tecnica: (d) =>
    `${ctx(d)}\n\n` +
    "Redacta los apartados III.1.2 a III.1.7 de la Descripción Técnica del Informe Preventivo " +
    "en prosa técnica continua, abarcando en orden los siguientes temas sin encabezarlos: " +
    "las actividades principales del ciclo operativo —recepción de combustibles desde autotanque, " +
    "almacenamiento en tanques subterráneos, despacho mediante dispensadores y recuperación de vapores " +
    "con el Sistema SRV de Fase I—; las dimensiones y distribución de áreas del predio; " +
    "las características operativas de presiones y temperaturas de almacenamiento; " +
    "el programa de trabajo con las etapas de preparación, construcción, operación y abandono; " +
    "y los detalles técnicos de los equipos: tanques de almacenamiento de doble pared identificados " +
    "como T-01, T-02 y T-03 con sus capacidades en litros, líneas y tuberías de succión y descarga, " +
    "sistema SRV con eficiencia mínima del noventa y cinco por ciento conforme a NOM-004-ASEA-2017, " +
    "y sistemas de control de seguridad (LOTO, trampa agua-aceite, sistema de tierras). " +
    "Señala con [Dato pendiente: descripción] cada especificación que no se haya proporcionado." +
    extra(d),

  emisiones_residuos: (d) =>
    `${ctx(d)}\n\n` +
    "Redacta el apartado III.3 —Emisiones, descargas y residuos— del Informe Preventivo en prosa " +
    "técnica continua, recorriendo cronológicamente las etapas de preparación de sitio, construcción, " +
    "operación y abandono. Para cada etapa, integra en el texto los siguientes aspectos sin separarlos " +
    "en listas: las emisiones atmosféricas de COV y VOC generadas y su control mediante el SRV de " +
    "Fase I con eficiencia mínima del noventa y cinco por ciento conforme a NOM-004-ASEA-2017; " +
    "las descargas de aguas sanitarias a fosa séptica y de aguas aceitosas al separador agua-aceite; " +
    "los residuos sólidos urbanos, residuos de manejo especial como filtros y trapos con referencia " +
    "a NOM-001-ASEA-2019, residuos peligrosos como aceites lubricantes usados y solventes sujetos a " +
    "NOM-052-SEMARNAT-2005 con manifiestos y gestor autorizado, y residuos de construcción; " +
    "y las fuentes de ruido con el nivel estimado en dB(A) y el cumplimiento de NOM-081-SEMARNAT-1994. " +
    "Señala con [Dato pendiente: descripción] donde falten cantidades específicas." +
    extra(d),

  flora_fauna: (d) =>
    `${ctx(d)}\n\n` +
    "Redacta el apartado III.4.3 —Caracterización biótica del área de influencia— del Informe " +
    "Preventivo en tres o cuatro párrafos de prosa continua. El primero describe la vegetación " +
    "presente en el área —tipo fisonómico-florístico conforme a la clasificación de Rzedowski (1978), " +
    "cobertura estimada y estado de conservación— y explica el grado de modificación antrópica del " +
    "predio en relación con su entorno. El segundo caracteriza la fauna regional esperable —mamíferos, " +
    "aves, anfibios y reptiles— con referencia a las bases CONABIO-Enciclovida, SNIB e iNaturalist, " +
    "indicando el estatus de riesgo de cada grupo conforme a NOM-059-SEMARNAT-2010. El tercero " +
    "presenta el diagnóstico del valor ambiental del predio: si hay o no especies en riesgo que " +
    "dependan del sitio, si hay hábitat crítico o corredores, y la conclusión sobre la sensibilidad " +
    "biótica del área de influencia." +
    (d.especies_resumen
      ? `\n\nDatos de campo disponibles (úsalos tal cual; no inventes más):\n${d.especies_resumen}`
      : "\n\n[Dato pendiente: listado de especies verificadas en campo o CONABIO para el municipio].") +
    extra(d),

  impactos: (d) =>
    `${ctx(d)}\n\n` +
    "Redacta la evaluación de impactos ambientales del Informe Preventivo —apartados III.5.7 y III.5.8— " +
    "en prosa técnica continua. La metodología —Matriz de Leopold adaptada con veintinueve acciones y " +
    "dieciocho factores, e índice de significancia ISIG de Gómez-Orea— ya está descrita en el documento; " +
    "no la repitas. Desarrolla la descripción narrativa de los impactos de mayor significancia (altos y " +
    "medios), tanto negativos como positivos, indicando para cada uno la acción generadora, el factor " +
    "ambiental receptor y la cuantificación cuando se disponga de ella. Para una estación de servicio " +
    "en zona urbana los impactos relevantes típicos incluyen: riesgo de infiltración de hidrocarburos " +
    "al suelo y al acuífero durante carga y posibles fugas, emisiones de COV controladas por el SRV, " +
    "ruido de equipos y tráfico vehicular adicional como negativos, y generación de empleo directo e " +
    "indirecto y abasto energético local como positivos. Cierra con un párrafo de balance neto que " +
    "sume los impactos positivos frente a los negativos residuales con medidas, y concluye la " +
    "viabilidad ambiental del proyecto." +
    (d.matriz_resumen
      ? `\n\nResultados de la matriz disponibles (úsalos; no inventes índices):\n${d.matriz_resumen}`
      : "\n\n[Dato pendiente: resultados numéricos ISIG de la Matriz de Leopold/Gómez-Orea].") +
    extra(d),

  medidas: (d) =>
    `${ctx(d)}\n\n` +
    "Redacta las secciones III.6 y III.7 —Medidas de prevención, mitigación y compensación— del " +
    "Informe Preventivo en prosa técnica continua, organizando el texto cronológicamente por etapa: " +
    "construcción, operación y abandono. Para cada medida, intégrala en el párrafo de su etapa " +
    "indicando el impacto que atiende, la descripción específica de la acción (evita generalidades " +
    "como 'minimizar residuos'), el puesto responsable de ejecutarla, el indicador verificable de " +
    "cumplimiento y el fundamento normativo con la clave NOM completa. Al finalizar las tres etapas, " +
    "desarrolla un párrafo descriptivo del Programa de Vigilancia Ambiental con las frecuencias de " +
    "inspección interna, las verificaciones externas de la Unidad de Verificación ASEA, las pruebas " +
    "periódicas del SRV, la medición de ruido y la auditoría de manifiestos de residuos peligrosos." +
    extra(d),

  vigilancia: (d) =>
    `${ctx(d)}\n\n` +
    "Redacta el texto narrativo del Programa de Vigilancia Ambiental —apartado III.6.1— del " +
    "Informe Preventivo en dos o tres párrafos de prosa continua. El primer párrafo describe el " +
    "alcance del programa: las etapas que cubre, los componentes ambientales monitoreados (calidad " +
    "del suelo, emisiones de COV, ruido, residuos peligrosos) y los impactos cuya evolución se " +
    "vigila. El segundo describe las acciones de supervisión periódica: inspecciones internas " +
    "mensuales, verificaciones externas semestrales con Unidad de Verificación acreditada ante ASEA, " +
    "pruebas de hermeticidad anual de tanques y líneas, medición semestral de emisiones del SRV, " +
    "auditoría trimestral de manifiestos de residuos peligrosos y monitoreo anual de calidad del " +
    "suelo bajo los islotes; para cada acción indica el indicador verificable, la frecuencia y el " +
    "responsable. El tercer párrafo describe el mecanismo de reporte ante la ASEA y la obligación " +
    "de conservar registros disponibles para inspección en cualquier momento." +
    extra(d),

  abandono: (d) =>
    `${ctx(d)}\n\n` +
    "Redacta la sección IV —Abandono del sitio— del Informe Preventivo en prosa técnica continua, " +
    "abarcando en orden los siguientes temas integrados en el texto sin encabezarlos: los supuestos " +
    "que activan el cierre —fin de vida útil estimada en veinticinco años, daño catastrófico, " +
    "cambio de política energética u orden de autoridad—; las acciones específicas por componente, " +
    "describiendo para los tanques la desgasificación con nitrógeno hasta alcanzar LEL menor al " +
    "diez por ciento certificado por Unidad de Verificación y el posterior retiro mecánico con " +
    "manifiestos, para las líneas la purga con aire comprimido y el retiro de tuberías soterradas, " +
    "y para el SRV su desmontaje y disposición; los protocolos de seguridad —sistema LOTO, permisos " +
    "de trabajo caliente y de espacio confinado, EPP mínimo y monitoreo continuo con detector de " +
    "cuatro gases (O₂, LEL, CO, H₂S)—; la gestión de los residuos del cierre clasificando fondos " +
    "de tanques como RP presuntos sujetos a análisis TCLP, aguas de enjuague y RCD de demolición; " +
    "el muestreo confirmatorio de suelos en cuatro puntos con análisis de TPH, BTEX y metales en " +
    "laboratorio acreditado NMX-EC-17025 comparados contra criterios SEMARNAT; la restitución del " +
    "terreno con relleno, nivelación y revegetación; y los avisos administrativos obligatorios a " +
    "la ASEA con treinta días de anticipación, al municipio con diez días y a la CONAGUA con " +
    "quince días." +
    extra(d),

  sustentabilidad: (d) =>
    `${ctx(d)}\n\n` +
    "Redacta el apartado III.7 —Condiciones adicionales para la sustentabilidad— del Informe " +
    "Preventivo en uno o dos párrafos de prosa continua. Describe los compromisos voluntarios que " +
    "el promovente adopta más allá de las obligaciones normativas mínimas, integrando en el texto " +
    "las siguientes medidas con su indicador de cumplimiento: instalación de señalética ambiental " +
    "para separación de residuos y ahorro de agua; revegetación con especies nativas en las áreas " +
    "verdes disponibles del predio; eficiencia energética mediante la sustitución de luminarias " +
    "convencionales por LED y el uso de temporizadores; capacitación anual del personal en manejo " +
    "seguro de sustancias peligrosas conforme a NOM-005-STyPS-1998; y monitoreo semestral de " +
    "calidad del suelo bajo los islotes de despacho para detectar contaminación temprana. " +
    "Concluye señalando que estas medidas refuerzan la viabilidad ambiental del proyecto y " +
    "manifiestan la responsabilidad ambiental del operador más allá del cumplimiento normativo." +
    extra(d),

  diagnostico_ambiental: (d) =>
    `${ctx(d)}\n\n` +
    "Redacta la síntesis del diagnóstico ambiental integral —apartado III.4.6— del Informe Preventivo " +
    "en tres o cuatro párrafos de prosa continua, integrando los apartados III.4.1 a III.4.5 sin encabezarlos. " +
    "El primer párrafo describe el estado de conservación del ecosistema en el área de influencia: " +
    "cobertura vegetal (porcentaje estimado y tipo fisonómico-florístico), fauna silvestre observada, " +
    "presencia o ausencia de especies protegidas conforme a la NOM-059-SEMARNAT-2010, y el grado de " +
    "modificación antrópica del entorno. El segundo párrafo describe los riesgos preexistentes en el AI: " +
    "riesgo de inundación según CONAGUA, estabilidad de laderas y pendientes, condición del acuífero " +
    "(sobreexplotado o disponible), posible contaminación previa del suelo o subsuelo y conflictos " +
    "socioambientales documentados. El tercer párrafo evalúa los servicios ambientales del sistema " +
    "—regulación hídrica, microclima, provisión de hábitat y valor paisajístico— con su nivel de " +
    "importancia para el AI. El cuarto párrafo concluye la sensibilidad ambiental global del sitio: " +
    "si el AI es de baja, media o alta sensibilidad, la compatibilidad del uso propuesto con el entorno " +
    "y la capacidad del proyecto para operar sin superar los umbrales normativos con las medidas propuestas." +
    extra(d),

  conclusion: (d) =>
    `${ctx(d)}\n\n` +
    "Redacta la síntesis central de la sección V —Conclusión— del Informe Preventivo en cuatro " +
    "o cinco párrafos de prosa continua, con tono declarativo orientado a demostrar ante la ASEA " +
    "la viabilidad y la diligencia ambiental del proyecto. El primer párrafo sintetiza el proyecto " +
    "—qué es, dónde está, de quién es y su importancia energética local. El segundo presenta el " +
    "resultado del diagnóstico ambiental del área de influencia: el estado de conservación del " +
    "entorno, la ausencia o presencia de especies en riesgo, la ausencia de ANP y la compatibilidad " +
    "del sitio con el uso propuesto. El tercer párrafo resume la evaluación de impactos: los " +
    "impactos más significativos identificados, su naturaleza (temporal, localizada, reversible) y " +
    "el balance neto positivo una vez aplicadas las medidas de mitigación. El cuarto párrafo " +
    "declara la eficacia de las medidas propuestas en la Sección III.6 y los compromisos " +
    "voluntarios de la Sección III.7, dejando los impactos residuales en rango bajo a medio. " +
    "Si es necesario un quinto párrafo, úsalo para afirmar la congruencia del proyecto con el " +
    "marco jurídico aplicable —LGEEPA, REIA, POEGT y NOMs del sector— y con el Plan Nacional " +
    "de Desarrollo." +
    extra(d),
};

// ── MOTOR DE REDACCIÓN ────────────────────────────────────────────────────
async function redactarSeccion(seccion, datos) {
  const build = PROMPTS[seccion];
  if (!build) throw new Error(`Sección no soportada: "${seccion}". Disponibles: ${Object.keys(PROMPTS).join(", ")}.`);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada (Vercel → Settings → Environment Variables).");

  // Longitud máxima ajustada por sección
  const maxTok = { impactos: 4096, medidas: 4096, abandono: 3072, conclusion: 3072 }[seccion] || 2048;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTok,
      system: SYSTEM,
      messages: [{ role: "user", content: build(datos || {}) + (META[seccion] || "") }],
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
  return { texto: limpiarMarkdown(texto) };
}

// ── MODO "PERFIL" ─────────────────────────────────────────────────────────
// Extrae campos del proyecto desde texto de recopilación o imagen.
const SYSTEM_PERFIL =
  "Eres un asistente que extrae datos de proyecto desde un formulario de RECOPILACIÓN DE DATOS " +
  "(texto o imagen) para llenar un Informe Preventivo. Devuelve ÚNICAMENTE JSON válido. " +
  "No inventes: si un campo no aparece en la fuente, omítelo. " +
  "Para campos con lista de opciones elige la más cercana.";

function fetchSheetCSV(url) {
  const m = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/) || String(url).match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!m) return Promise.resolve("");
  return fetch(`https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv`)
    .then((r) => (r.ok ? r.text() : ""))
    .catch(() => "");
}

async function extraerPerfil({ campos, datos_crudos, imagen, sheet_url }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");
  if (!Array.isArray(campos) || !campos.length) throw new Error("Faltan los campos a extraer.");

  let fuente = datos_crudos || "";
  if (sheet_url) { const csv = await fetchSheetCSV(sheet_url); if (csv) fuente += "\n\n" + csv; }

  const lista = campos
    .map((c) => `- ${c.id}: ${c.label}${c.opts && c.opts.length ? ` (opciones: ${c.opts.join(" | ")})` : ""}`)
    .join("\n");
  const instruccion =
    `Extrae del formulario de recopilación los siguientes campos y devuelve ÚNICAMENTE:\n` +
    `{ "campos": { "id_campo": "valor", ... } }\n` +
    `Omite los campos que no encuentres. No inventes datos.\n\n` +
    `Campos a extraer:\n${lista}\n\n` +
    `Formulario de recopilación:\n${fuente || "(ver imagen adjunta)"}`;

  const content = [];
  if (imagen && imagen.data)
    content.push({ type: "image", source: { type: "base64", media_type: imagen.media_type || "image/png", data: imagen.data } });
  content.push({ type: "text", text: instruccion });

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 4096, system: SYSTEM_PERFIL, messages: [{ role: "user", content }] }),
  });
  if (!resp.ok) { const d = await resp.text(); throw new Error(`Anthropic ${resp.status}: ${d.slice(0, 300)}`); }
  const data = await resp.json();
  const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  let jsonStr = txt;
  const i = txt.indexOf("{"), j = txt.lastIndexOf("}");
  if (i !== -1 && j !== -1) jsonStr = txt.slice(i, j + 1);
  let parsed;
  try { parsed = JSON.parse(jsonStr); } catch (e) { throw new Error("La IA no devolvió JSON válido para el perfil."); }
  return { campos: parsed.campos || parsed };
}

// ── MODO "PROGRAMA" ────────────────────────────────────────────────────────
// Extrae los datos de UN programa de ordenamiento ecológico (POEGT, POE
// Estatal, POEL, PDUM, programa de manejo de ANP, etc.) a partir de su Sheet
// de intersección SIGEIA. Se puede llamar N veces, una por programa ligado
// al proyecto (ver campo "programas" en II.2).
const SYSTEM_PROGRAMA =
  "Eres un asistente que extrae los datos de un Programa de Ordenamiento Ecológico " +
  "(POEGT, POE Estatal, POE Regional, POEL, PDUM municipal, programa de manejo de ANP, u otro) " +
  "desde su hoja de intersección SIGEIA, para vincularlo con un proyecto de Informe Preventivo ASEA. " +
  "Devuelve ÚNICAMENTE JSON válido. No inventes: si un dato no aparece en la fuente, omítelo.";

async function extraerPrograma({ nombre, sheet_url, datos_crudos, imagen }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");

  let fuente = datos_crudos || "";
  if (sheet_url) { const csv = await fetchSheetCSV(sheet_url); if (csv) fuente += "\n\n" + csv; }
  if (!fuente.trim() && !(imagen && imagen.data))
    throw new Error("Pega el link de Google Sheets, datos o una imagen del programa.");

  const instruccion =
    `Analiza la hoja de intersección del programa de ordenamiento "${nombre || "(sin nombre)"}" y ` +
    `devuelve ÚNICAMENTE:\n` +
    `{ "campos": { "uab": "", "clave_politica": "", "ord_regional": "", "region_eco": "", "region_eco_nombre": "" }, ` +
    `"incisos": [ { "campo": "nombre del campo/criterio", "valor": "..." }, ... ] }\n\n` +
    `"campos" son los 5 datos de la Unidad Ambiental Biofísica (UAB) del POEGT — inclúyelos SOLO si ` +
    `este programa es el POEGT y la hoja los trae; omite el objeto "campos" (déjalo vacío {}) si no aplica.\n` +
    `"incisos" es la lista de TODOS los demás campos relevantes que encuentres para vincular el proyecto ` +
    `con este programa (p.ej. clave UGA, política ambiental, uso de suelo predominante, criterios ecológicos ` +
    `aplicables, región/subregión, etc.) — sin límite de incisos, uno por cada dato relevante encontrado.\n` +
    `No inventes datos: si no encuentras nada relevante, devuelve "incisos": [].\n\n` +
    `Fuente:\n${fuente || "(ver imagen adjunta)"}`;

  const content = [];
  if (imagen && imagen.data)
    content.push({ type: "image", source: { type: "base64", media_type: imagen.media_type || "image/png", data: imagen.data } });
  content.push({ type: "text", text: instruccion });

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 4096, system: SYSTEM_PROGRAMA, messages: [{ role: "user", content }] }),
  });
  if (!resp.ok) { const d = await resp.text(); throw new Error(`Anthropic ${resp.status}: ${d.slice(0, 300)}`); }
  const data = await resp.json();
  const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  let jsonStr = txt;
  const i = txt.indexOf("{"), j = txt.lastIndexOf("}");
  if (i !== -1 && j !== -1) jsonStr = txt.slice(i, j + 1);
  let parsed;
  try { parsed = JSON.parse(jsonStr); } catch (e) { throw new Error("La IA no devolvió JSON válido para el programa."); }
  return { campos: parsed.campos || {}, incisos: Array.isArray(parsed.incisos) ? parsed.incisos : [] };
}

// ── MODO "PLANO" ───────────────────────────────────────────────────────────
// Lee un plano del proyecto (PDF nativo — Claude soporta PDF directamente,
// sin convertir a imagen) y en una sola llamada genera la redacción de
// III.1.2–III.1.7 (Descripción Técnica) y llena las tablas técnicas de
// III.1.7 (tanques, tuberías, extintores, distancias) con lo que el plano
// muestre explícitamente.
const SYSTEM_PLANO =
  "Eres un ingeniero ambiental senior que interpreta planos técnicos (arquitectónicos, " +
  "isométricos, P&ID o de distribución) de estaciones de servicio para redactar un Informe " +
  "Preventivo ASEA. Lee el PDF adjunto con atención a cotas, simbología, tablas de " +
  "especificaciones y notas del plano. Escribe en español técnico formal. No inventes datos " +
  "ni cifras que no se puedan leer o inferir razonablemente del plano; si algo no es " +
  "determinable, usa \"[Dato pendiente: descripción]\" en el texto o cadena vacía \"\" en las " +
  "tablas. PROHIBIDO TODO MARKDOWN en el texto narrativo (sin #, sin **, sin viñetas, sin " +
  "encabezados de subsección). Devuelve ÚNICAMENTE JSON válido, sin texto antes ni después.";

const TABLAS_PLANO = [
  { key: "tablaTanques", titulo: "Tanques sujetos a presión",
    columnas: ["ID Tanque", "Capacidad (L)", "Producto", "Presión diseño", "Presión operación", "Set PSV", "Año/Serie", "Fabricante", "Dictamen/UV"] },
  { key: "tablaTuberias", titulo: "Tuberías y conexiones",
    columnas: ["Fluido / Servicio", "Ø Nominal", "Material", "Tipo de instalación", "Profundidad", "Pendiente", "Prueba / Dictamen", "Observaciones"] },
  { key: "tablaExtintores", titulo: "Extintores",
    columnas: ["No.", "Ubicación", "Tipo", "Capacidad", "Evidencia"] },
  { key: "tablaDistancias", titulo: "Distancias mínimas",
    columnas: ["Elemento", "Distancia requerida (m)", "Distancia de proyecto (m)", "Cumple"] },
];

async function interpretarPlano({ datos, plano, notas_adicionales }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");
  if (!plano || !plano.data) throw new Error("Adjunta el PDF del plano.");

  const d = datos || {};
  const specTablas = TABLAS_PLANO
    .map((t) => `- "${t.key}" (${t.titulo}): columnas [${t.columnas.join(", ")}]`)
    .join("\n");
  const formaTablas =
    "{ " +
    TABLAS_PLANO.map((t) => `"${t.key}": [ { ${t.columnas.map((c) => `"${c}": ""`).join(", ")} } ]`).join(", ") +
    " }";

  const instruccion =
    `${ctx(d)}\n\n` +
    "Con base ÚNICAMENTE en el plano adjunto (y los datos del proyecto de arriba), genera dos cosas:\n\n" +
    "1) \"texto\": la redacción de los apartados III.1.2 a III.1.7 (Descripción Técnica) del " +
    "Informe Preventivo, en prosa técnica continua de 4 a 6 párrafos, cubriendo en orden: " +
    "actividades principales del ciclo operativo que se aprecien en el plano; dimensiones y " +
    "distribución de áreas del predio (léelas de las cotas/leyenda); programa de trabajo por " +
    "etapas si el plano lo indica (si no, escribe \"[Dato pendiente: programa de trabajo]\"); y " +
    "detalles técnicos de los equipos mostrados (tanques, líneas, dispensarios, SRV, sistemas de " +
    "seguridad) con sus identificadores tal como aparecen en el plano (p.ej. T-01, T-02). No uses " +
    "markdown ni encabezados de subsección.\n\n" +
    "2) \"tablas\": llena las siguientes tablas SOLO con lo que el plano muestre explícitamente " +
    "(cotas, tablas de especificaciones, leyendas, notas):\n" + specTablas + "\n\n" +
    "Devuelve ÚNICAMENTE:\n{ \"texto\": \"...\", \"tablas\": " + formaTablas + " }\n\n" +
    "Reglas: no inventes cifras ni marcas que no estén en el plano; usa \"\" en las celdas que no " +
    "puedas leer; incluye TODAS las filas que el plano muestre, sin límite." +
    (notas_adicionales ? `\n\nNotas adicionales del consultor (úsalas; no inventes más):\n${notas_adicionales}` : "");

  const content = [
    { type: "document", source: { type: "base64", media_type: plano.media_type || "application/pdf", data: plano.data } },
    { type: "text", text: instruccion },
  ];

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 8192, system: SYSTEM_PLANO, messages: [{ role: "user", content }] }),
  });
  if (!resp.ok) { const d2 = await resp.text(); throw new Error(`Anthropic ${resp.status}: ${d2.slice(0, 300)}`); }
  const data = await resp.json();
  const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  let jsonStr = txt;
  const i = txt.indexOf("{"), j = txt.lastIndexOf("}");
  if (i !== -1 && j !== -1) jsonStr = txt.slice(i, j + 1);
  let parsed;
  try { parsed = JSON.parse(jsonStr); } catch (e) { throw new Error("La IA no devolvió JSON válido para el plano."); }
  return { texto: limpiarMarkdown(parsed.texto || ""), tablas: parsed.tablas || {} };
}

// ── MODO "TABLA" ──────────────────────────────────────────────────────────
// Estructura datos pegados o imágenes en filas para las tablaIA del formulario.
const SYSTEM_TABLA =
  "Eres un asistente que estructura datos crudos (texto o imágenes de tablas/listados) " +
  "en tablas para un Informe Preventivo (IP) ASEA. Devuelve ÚNICAMENTE JSON válido, sin " +
  "texto adicional. No inventes datos: si un campo no aparece en la fuente, usa cadena vacía. " +
  "No limites el número de filas: incluye TODAS las que encuentres.";

async function estructurarTabla({ tablas, datos_crudos, imagen }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");
  if (!Array.isArray(tablas) || !tablas.length) throw new Error("Faltan especificaciones de tabla.");

  const spec = tablas
    .map((t) => `- "${t.key}" (${t.titulo || t.key}): columnas [${(t.columnas || []).join(", ")}]`)
    .join("\n");
  const forma =
    "{ " +
    tablas
      .map((t) => `"${t.key}": [ { ${(t.columnas || []).map((c) => `"${c}": ""`).join(", ")} } ]`)
      .join(", ") +
    " }";

  const instruccion =
    `Estructura la información proporcionada (texto y/o imagen) en las siguientes tablas.\n` +
    `Devuelve ÚNICAMENTE un objeto JSON con esta forma exacta:\n${forma}\n\n` +
    `Tablas a llenar:\n${spec}\n\n` +
    `Reglas: una fila por registro; no inventes datos (campo vacío si no aparece en la fuente); ` +
    `incluye TODAS las filas encontradas, sin límite.` +
    (datos_crudos ? `\n\nDatos crudos:\n${datos_crudos}` : "");

  const content = [];
  if (imagen && imagen.data)
    content.push({ type: "image", source: { type: "base64", media_type: imagen.media_type || "image/png", data: imagen.data } });
  content.push({ type: "text", text: instruccion });

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 8192, system: SYSTEM_TABLA, messages: [{ role: "user", content }] }),
  });
  if (!resp.ok) { const d = await resp.text(); throw new Error(`Anthropic ${resp.status}: ${d.slice(0, 300)}`); }
  const data = await resp.json();
  const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  let jsonStr = txt;
  const i = txt.indexOf("{"), j = txt.lastIndexOf("}");
  if (i !== -1 && j !== -1) jsonStr = txt.slice(i, j + 1);
  let parsed;
  try { parsed = JSON.parse(jsonStr); } catch (e) { throw new Error("La IA no devolvió JSON válido para la tabla."); }
  return { tablas: parsed };
}

// ── HANDLER VERCEL ─────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Usa POST." });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (body.accion === "tabla") {
      const out = await estructurarTabla(body);
      res.status(200).json({ ok: true, ...out });
      return;
    }
    if (body.accion === "perfil") {
      const out = await extraerPerfil(body);
      res.status(200).json({ ok: true, ...out });
      return;
    }
    if (body.accion === "programa") {
      const out = await extraerPrograma(body);
      res.status(200).json({ ok: true, ...out });
      return;
    }
    if (body.accion === "plano") {
      const out = await interpretarPlano(body);
      res.status(200).json({ ok: true, ...out });
      return;
    }
    const out = await redactarSeccion(body.seccion, body.datos);
    res.status(200).json({ ok: true, ...out });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
};

// Exportados para pruebas locales con node.
module.exports.redactarSeccion = redactarSeccion;
module.exports.estructurarTabla = estructurarTabla;
module.exports.extraerPerfil = extraerPerfil;
module.exports.extraerPrograma = extraerPrograma;
module.exports.interpretarPlano = interpretarPlano;
module.exports.limpiarMarkdown = limpiarMarkdown;
