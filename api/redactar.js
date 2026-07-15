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
// Modelo económico/rápido para acciones de EXTRACCIÓN mecánica (leer un
// Sheet ya estructurado y mapearlo a columnas exactas) donde no hace falta
// la redacción/razonamiento de Sonnet — mismo formato de API, ~12x más
// barato y notablemente más rápido (ayuda también a no pegarle al techo de
// 60s de Vercel Hobby). NO se usa para redacción de prosa técnica ni para
// juicio normativo (aplicabilidad de criterios, clasificación NOM-059).
const MODEL_HAIKU = "claude-haiku-4-5-20251001";

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

function sheetDocId(url) {
  const m = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/) || String(url).match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

// Lee TODAS las pestañas de un Google Sheet público, sin autenticación ni
// dependencias: (1) /htmlview trae en su HTML embebido la lista {name, gid} de
// cada pestaña en orden, sin login; (2) cada pestaña se descarga por separado
// vía export?format=csv&gid=. Si htmlview falla o no encuentra pestañas, cae a
// una sola "pestaña" con fetchSheetCSV (comportamiento anterior).
async function fetchSheetTabs(url) {
  const id = sheetDocId(url);
  if (!id) return [];

  let tabs = [];
  try {
    const resp = await fetch(`https://docs.google.com/spreadsheets/d/${id}/htmlview`);
    if (resp.ok) {
      const html = await resp.text();
      const re = /\{name:\s*"((?:[^"\\]|\\.)*)"[^{}]*?gid:\s*"(\d+)"/g;
      const seen = new Set();
      let mm;
      while ((mm = re.exec(html))) {
        const gid = mm[2];
        if (seen.has(gid)) continue;
        seen.add(gid);
        tabs.push({ name: mm[1].replace(/\\"/g, '"'), gid });
      }
    }
  } catch (e) {
    console.error("[fetchSheetTabs] htmlview falló:", e.message);
  }

  if (!tabs.length) {
    const csv = await fetchSheetCSV(url);
    return csv ? [{ name: "Hoja 1", csv }] : [];
  }

  const resultados = await Promise.all(
    tabs.map(async (t) => {
      try {
        const r = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${t.gid}`);
        return { name: t.name, csv: r.ok ? await r.text() : "" };
      } catch (e) {
        return { name: t.name, csv: "" };
      }
    })
  );
  console.log(`[fetchSheetTabs] ${id}: ${resultados.length} pestañas — ${resultados.map((r) => r.name).join(", ")}`);
  return resultados.filter((t) => t.csv && t.csv.trim());
}

// Llamada genérica a Claude que espera JSON como respuesta, con el mismo
// manejo robusto ya probado en el modo "plano": quita cercas ```json```,
// distingue truncamiento por max_tokens de JSON genuinamente mal formado, y
// loggea lo suficiente para diagnosticar desde Vercel → Logs.
async function llamarJSON(apiKey, system, content, maxTokens, etiqueta, model) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: model || MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content }] }),
  });
  if (!resp.ok) { const d2 = await resp.text(); throw new Error(`Anthropic ${resp.status}: ${d2.slice(0, 300)}`); }
  const data = await resp.json();
  const truncado = data.stop_reason === "max_tokens";
  const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  console.log(`[${etiqueta}] stop_reason=${data.stop_reason} respuesta_chars=${txt.length}`);
  const sinCercas = txt.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  let jsonStr = sinCercas;
  const i = sinCercas.indexOf("{"), j = sinCercas.lastIndexOf("}");
  if (i !== -1 && j !== -1) jsonStr = sinCercas.slice(i, j + 1);
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    const motivo = truncado ? "la respuesta se cortó por límite de longitud" : e.message;
    console.error(`[${etiqueta}] JSON inválido (${motivo}). Primeros 500 chars:`, txt.slice(0, 500));
    throw new Error(motivo);
  }
}

// Reintenta UNA vez ante un fallo antes de darse por vencido. Usado en
// llamadas que van muchas a la vez en paralelo (chunks de especies/tablas,
// categorías de la matriz) — ahí un fallo aislado es más probable que en una
// llamada única, y perder un pedazo obliga a rehacer todo el flujo desde la
// app. Si el fallo fue por TRUNCAMIENTO (la respuesta necesitaba más
// max_tokens de los que se le dieron — ej. una categoría con muchos
// impactos distintos que narrar) el reintento duplica el límite en vez de
// repetir la misma llamada con el mismo tope, que fallaría igual siempre.
async function llamarJSONConReintento(apiKey, system, content, maxTokens, etiqueta, model) {
  try {
    return await llamarJSON(apiKey, system, content, maxTokens, etiqueta, model);
  } catch (e) {
    const truncado = /l[ií]mite de longitud/i.test(e.message);
    const maxTokensReintento = truncado ? Math.min(maxTokens * 2, 8192) : maxTokens;
    console.error(`[${etiqueta}] intento 1 falló (${e.message}) — reintentando${truncado ? ` con max_tokens=${maxTokensReintento}` : ""}…`);
    return llamarJSON(apiKey, system, content, maxTokensReintento, etiqueta + ":retry", model);
  }
}

async function extraerPerfil({ campos, datos_crudos, imagen, sheet_url }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");
  if (!Array.isArray(campos) || !campos.length) throw new Error("Faltan los campos a extraer.");

  // RECOPILACION_DATOS puede traer varias pestañas (identificación, predio,
  // polígono, fechas/inversión/empleos, personal/brigada, instalaciones,
  // sustancias, residuos, seguridad, póliza, checklist, cronograma, fotos).
  // fetchSheetTabs lee TODAS, cada una etiquetada por nombre.
  let fuente = datos_crudos || "";
  let hayCronograma = false;
  if (sheet_url) {
    const tabs = await fetchSheetTabs(sheet_url);
    if (tabs.length) {
      fuente += tabs.map((t) => `\n\n=== Pestaña: ${t.name} ===\n${t.csv}`).join("");
      hayCronograma = tabs.some((t) => /cronograma/i.test(t.name));
    }
  }

  const lista = campos
    .map((c) => `- ${c.id}: ${c.label}${c.opts && c.opts.length ? ` (opciones: ${c.opts.join(" | ")})` : ""}`)
    .join("\n");

  const instruccionCronograma = hayCronograma
    ? ' Además, la fuente trae una pestaña de Cronograma (columnas tipo Código/Etapa/Actividad/Duración ' +
      'típica/Notas): devuelve también "tablas": { "tablaPrograma": [ { "Etapa": "Preparación y ' +
      'construcción"|"Operación"|"Abandono", "Actividad": "...", "Periodo estimado": "...", "Duración": ' +
      '"..." }, ... ] } — una fila por actividad del cronograma, agrupada por Etapa (normaliza el nombre ' +
      'de etapa a esas 3 opciones), copiando la Duración típica tal cual y dejando "Periodo estimado" ' +
      'vacío si el Sheet no da un orden temporal explícito.'
    : "";

  const instruccion =
    `Extrae del formulario de recopilación los siguientes campos y devuelve ÚNICAMENTE:\n` +
    `{ "campos": { "id_campo": "valor", ... }` + (hayCronograma ? `, "tablas": { "tablaPrograma": [...] }` : "") + ` }\n` +
    `Omite los campos que no encuentres. No inventes datos.` + instruccionCronograma + `\n\n` +
    `Campos a extraer:\n${lista}\n\n` +
    `Formulario de recopilación:\n${fuente || "(ver imagen adjunta)"}`;

  const content = [];
  if (imagen && imagen.data)
    content.push({ type: "image", source: { type: "base64", media_type: imagen.media_type || "image/png", data: imagen.data } });
  content.push({ type: "text", text: instruccion });

  const parsed = await llamarJSON(apiKey, SYSTEM_PERFIL, content, 6144, "perfil", MODEL_HAIKU);
  return { campos: parsed.campos || {}, tablas: parsed.tablas || {} };
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

// ── MODO "PROGRAMAS_MULTI" ──────────────────────────────────────────────────
// Un solo link de Sheets con VARIAS pestañas = varios programas de
// ordenamiento/planeación a la vez (ej. POEGT/POEL_JALISCO/PMDU en 3 pestañas
// de un mismo Sheet). A diferencia de "programa" (que asume una hoja de
// intersección SIGEIA con valores UAB ya resueltos), aquí cada pestaña es un
// CATÁLOGO de criterios con una columna "Criterio de Aplicabilidad (para IA)"
// que hay que evaluar contra los datos reales del proyecto — Sí/No/Parcial
// + justificación, fila por fila, sin omitir ninguna.
// Parte el CSV de una pestaña en fragmentos de N filas (conservando el
// encabezado en cada fragmento) — así cada llamada a Claude evalúa muchas
// menos filas y termina mucho más rápido, en vez de una sola llamada grande
// por pestaña que puede pasarse del límite de 60s de la función serverless.
function chunkCSV(csv, rowsPerChunk) {
  const lineas = String(csv).split(/\r?\n/);
  const header = lineas[0] || "";
  const filas = lineas.slice(1).filter((l) => l.trim());
  if (!filas.length) return [csv];
  const chunks = [];
  for (let i = 0; i < filas.length; i += rowsPerChunk) {
    chunks.push(header + "\n" + filas.slice(i, i + rowsPerChunk).join("\n"));
  }
  return chunks;
}

// Algunos Sheets (ej. exports crudos de iNaturalist con miles de
// observaciones) son demasiado grandes para mandarlos completos — se
// muestrean uniformemente en vez de solo tomar las primeras N filas, para
// conservar diversidad (especies distintas repartidas en todo el archivo, no
// solo las capturadas primero).
function muestrearCSV(csv, maxFilas) {
  const lineas = String(csv).split(/\r?\n/);
  const header = lineas[0] || "";
  const filas = lineas.slice(1).filter((l) => l.trim());
  if (filas.length <= maxFilas) return csv;
  const paso = filas.length / maxFilas;
  const muestra = [];
  for (let i = 0; i < maxFilas; i++) muestra.push(filas[Math.floor(i * paso)]);
  return header + "\n" + muestra.join("\n") + `\n[...muestreo: ${maxFilas} de ${filas.length} filas totales...]`;
}

// Parsea una línea CSV respetando comillas (evita romper columnas cuando un
// valor trae comas embebidas — común en exports de campo libre).
function parseCSVLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

// Exports de biodiversidad (iNaturalist/SNIB/Enciclovida) traen miles de
// OBSERVACIONES individuales (~20 columnas irrelevantes: coordenadas,
// fecha, observador, url...) cuando lo único que necesita el listado
// bibliográfico (Tablas III.15–III.18) es la especie única. En vez de
// muestrear filas (que puede omitir especies raras) se deduplica por
// scientific_name y se descartan las columnas que no aportan — baja de
// ~1.6M chars/5290 filas a ~30k chars/tantas especies únicas haya, sin
// perder ninguna especie y sin gastar tokens en columnas que Claude nunca
// usa. Si el CSV no trae ese formato (no es un export de biodiversidad),
// regresa null y el llamador cae al muestreo genérico.

// Grupos taxonómicos que NO caben en ninguna de las 4 tablas bibliográficas
// del IP (Flora/Mamíferos/Avifauna/Herpetofauna) — se excluyen para no
// gastar tokens clasificando especies que de todos modos no tienen dónde
// ir. Lista de EXCLUSIÓN (no de inclusión): ante un valor desconocido o
// vacío se conserva la fila, para no perder datos por variaciones de
// formato entre distintas fuentes.
const GRUPOS_FUERA_DE_ALCANCE = new Set(["Insecta", "Arachnida", "Fungi", "Mollusca", "Actinopterygii", "Chromista", "Protozoa"]);

function podarListaEspecies(csv) {
  const lineas = String(csv).split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length < 2) return null;
  const header = parseCSVLine(lineas[0]).map((h) => h.trim().toLowerCase());
  const idxSci = header.indexOf("scientific_name");
  if (idxSci < 0) return null;
  const idxCommon = header.indexOf("common_name");
  const idxGrupo = header.indexOf("iconic_taxon_name");

  const vistos = new Map();
  for (let i = 1; i < lineas.length; i++) {
    const cols = parseCSVLine(lineas[i]);
    const sci = (cols[idxSci] || "").trim();
    if (!sci || vistos.has(sci)) continue;
    const grupo = idxGrupo >= 0 ? (cols[idxGrupo] || "").trim() : "";
    if (GRUPOS_FUERA_DE_ALCANCE.has(grupo)) continue;
    vistos.set(sci, { common: idxCommon >= 0 ? (cols[idxCommon] || "").trim() : "", grupo });
  }
  if (!vistos.size) return null;

  let salida = "scientific_name,common_name,grupo_taxonomico\n";
  vistos.forEach((v, sci) => { salida += `"${sci}","${v.common}","${v.grupo}"\n`; });
  return { csv: salida, especies: vistos.size };
}

// Pestañas del Sheet multi-programa (POEGT/POE Estatal/POEL/PDUM/...) que
// ADEMÁS de la evaluación genérica de incisos/aplicabilidad (que ya corre
// para TODAS las pestañas, ver abajo) alimentan una tabla estructurada del
// cuestionario — la IA localiza la pestaña correcta por su NOMBRE; no hace
// falta un documento ni un link separado por categoría. Agregar una
// categoría nueva es solo agregar una entrada aquí.
const TABLA_POR_PESTANA_PROGRAMA = [
  { patron: /poel/i, tablas: [{ key: "tablaPOEL", titulo: "POEL — UGA del municipio",
      columnas: ["Clave UGA", "Nombre UGA", "Política territorial", "Uso predominante", "Uso condicionado", "Uso incompatible"] }] },
  { patron: /plan\s*municipal|municipal/i, tablas: [{ key: "tablaPlanMunicipal", titulo: "Vinculación con criterios del Plan Municipal",
      columnas: ["Criterio", "Descripción", "Relación directa con el proyecto"] }] },
];

async function extraerProgramasMulti({ sheet_url, datos }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");
  if (!sheet_url) throw new Error("Pega el link de Google Sheets con los programas de ordenamiento.");

  const tabs = await fetchSheetTabs(sheet_url);
  if (!tabs.length) throw new Error("No se pudo leer ninguna pestaña de ese Sheet (¿es público?).");

  const contexto = ctx(datos || {});
  const ROWS_PER_CHUNK = 10;

  // Aplana TODAS las pestañas EXCEPTO las que ya van a su propia tabla
  // estructurada (POEL/Plan Municipal, ver TABLA_POR_PESTANA_PROGRAMA más
  // abajo) en tareas pequeñas (pestaña + fragmento de ~10 filas) y las
  // dispara TODAS a la vez en un solo Promise.all — el tiempo total pasa a
  // ser el del fragmento más lento (segundos), no el de la pestaña más
  // grande completa (que podía pasarse de 60s con 41 filas). Evaluar
  // "aplica sí/no/parcial" fila por fila NO tiene sentido sobre una tabla de
  // zonificación UGA (POEL) o de criterios del plan municipal — esas
  // pestañas suelen ser además las más grandes del Sheet, así que
  // excluirlas de este camino también es lo que evitaba el timeout de 60s
  // al combinarse con su propia extracción estructurada (ver más abajo).
  const tareas = [];
  tabs.forEach((tab) => {
    if (TABLA_POR_PESTANA_PROGRAMA.some((cat) => cat.patron.test(tab.name))) return;
    const chunks = chunkCSV(tab.csv, ROWS_PER_CHUNK);
    chunks.forEach((csvFragmento, i) => {
      tareas.push({ nombre: tab.name, indice: i + 1, total: chunks.length, csv: csvFragmento });
    });
  });

  const incisosPromise = Promise.all(tareas.map(async (t) => {
    const instruccion =
      `${contexto}\n\n` +
      `Estás evaluando el programa/instrumento "${t.nombre}" para este proyecto (fragmento ${t.indice}` +
      `/${t.total} de la tabla — algunas filas de otros fragmentos no se muestran aquí, evalúa SOLO ` +
      `las de este fragmento). La fuente es una tabla de criterios o estrategias de ordenamiento ` +
      "ecológico/urbano, con una columna que describe CUÁNDO aplica cada fila (columna de aplicabilidad " +
      "para IA). Evalúa CADA fila de este fragmento contra los datos del proyecto de arriba (giro — " +
      "estación de servicio/gasolinera —, ubicación, superficie, si está en ANP) y determina si aplica. " +
      "Si falta un dato del proyecto para decidir con certeza, usa tu mejor juicio como consultor " +
      "ambiental para una estación de servicio urbana típica y dilo en la justificación (no dejes " +
      "ninguna fila sin evaluar).\n\n" +
      "Devuelve ÚNICAMENTE:\n" +
      "{ \"incisos\": [ { \"criterio\": \"identificador breve de la fila, ej. 'N°3 — Recuperación de " +
      "especies en riesgo'\", \"aplica\": \"Sí\"|\"No\"|\"Parcial\", \"justificacion\": \"...\" }, ... ], " +
      "\"estrategias\": [ { \"n\": 1, \"disposicion\": \"Aplica directamente\"|\"Aplica indirectamente\"" +
      "|\"No aplica\" }, ... ] }\n\n" +
      "Incluye un inciso por CADA fila de este fragmento, sin omitir ninguna. Llena \"estrategias\" " +
      "(usando el N° de la primera columna como \"n\") SOLO si esta pestaña es específicamente el " +
      "catálogo de las 44 estrategias del POEGT nacional; si no aplica, deja \"estrategias\": [].\n\n" +
      `Fragmento ${t.indice}/${t.total} de la pestaña "${t.nombre}":\n${t.csv}`;

    try {
      const r = await llamarJSON(apiKey, SYSTEM_PROGRAMA, [{ type: "text", text: instruccion }], 3072, `programas_multi:${t.nombre}:${t.indice}/${t.total}`);
      return { nombre: t.nombre, incisos: Array.isArray(r.incisos) ? r.incisos : [], estrategias: Array.isArray(r.estrategias) ? r.estrategias : [] };
    } catch (e) {
      console.error(`[programas_multi] falló "${t.nombre}" fragmento ${t.indice}/${t.total}:`, e.message);
      return { nombre: t.nombre, incisos: [], estrategias: [], error: e.message };
    }
  }));

  // En paralelo con lo anterior (no en serie, para no sumar tiempos): por
  // cada pestaña cuyo NOMBRE coincida con una categoría de
  // TABLA_POR_PESTANA_PROGRAMA (ej. "POEL"), estructura esa pestaña completa
  // en su tabla del cuestionario — misma mecánica que estructurarTabla()
  // usa para flora/fauna/tanques, aquí reutilizada sobre el CSV ya
  // descargado (sin volver a pedir un link aparte).
  const tareasTablas = [];
  tabs.forEach((tab) => {
    TABLA_POR_PESTANA_PROGRAMA.forEach((cat) => {
      if (cat.patron.test(tab.name)) tareasTablas.push({ tab, cat });
    });
  });
  const tablasPromise = Promise.all(tareasTablas.map(({ tab, cat }) =>
    estructurarTabla({ tablas: cat.tablas, datos_crudos: tab.csv, imagen: null, sheet_url: null })
      .then((r) => r.tablas || {})
      .catch((e) => { console.error(`[programas_multi] falló tabla de pestaña "${tab.name}":`, e.message); return {}; })
  ));

  const [resultados, resultadosTablas] = await Promise.all([incisosPromise, tablasPromise]);

  // Reensambla por pestaña, en el mismo orden en que aparecen en el Sheet.
  const porTab = {};
  resultados.forEach((r) => {
    if (!porTab[r.nombre]) porTab[r.nombre] = { nombre: r.nombre, incisos: [], estrategias: [] };
    porTab[r.nombre].incisos.push(...r.incisos);
    porTab[r.nombre].estrategias.push(...r.estrategias);
  });
  const programas = tabs.map((tab) => porTab[tab.name] || { nombre: tab.name, incisos: [], estrategias: [] });

  const tablas = {};
  resultadosTablas.forEach((t) => {
    Object.keys(t).forEach((k) => { if (Array.isArray(t[k]) && t[k].length) tablas[k] = t[k]; });
  });

  if (!programas.some((p) => p.incisos.length) && !Object.keys(tablas).length) {
    throw new Error("La IA no pudo procesar ninguna pestaña del Sheet. Intenta de nuevo.");
  }
  return { programas, tablas };
}

// ── MODO "MATRICES" ─────────────────────────────────────────────────────────
// La plantilla estándar de Matriz de Impacto (Leopold adaptada / Gómez-Orea)
// suele traer varias pestañas ("Parámetros", "Matriz Leopold", "Matriz de
// Resultados", "Balance y Criterios"...), pero SOLO "Matriz de Resultados"
// aporta algo que la IA necesite: es formato largo (una fila por
// interacción) YA con ISIG/Clase/Subsistema calculados por el propio Sheet.
// El resto (Parámetros = constantes del modelo, Matriz Leopold = la misma
// info en formato ancho/disperso, Balance = agregados que igual se calculan
// aquí mismo sin IA) NO se lee — a propósito: entre menos pestañas entran al
// flujo, menos puede fallar y menos tiempo/tokens se gastan. Mandar las
// pestañas completas (hasta 113 KB solo en "Matriz de Resultados", recortadas
// a 20 000 caracteres — perdiendo la mayoría de las filas) es lo que producía
// el timeout de 60 s.
//
// Camino optimizado (el único que se usa si la hoja sigue la plantilla): se
// agrupan las filas de "Matriz de Resultados" por su columna Subsistema
// (agrupación que la propia hoja ya trae calculada — no hace falta pedirle a
// la IA que la "detecte"), filtrando a Clase != BAJO (impactos altos y
// medios, que es lo único que pide III.5.7), y se lanza UNA llamada IA en
// paralelo por categoría con solo sus filas relevantes. Las Tablas
// III.25/25b/26 se calculan aparte, sin IA, sobre las mismas filas ya
// parseadas (ver calcularTabla* más abajo). Si la hoja no sigue la
// plantilla esperada (no se encuentra "Matriz de Resultados" con las
// columnas Clase+Subsistema), cae al camino genérico de una sola llamada
// con todo lo no descartable, dejando que la IA detecte las categorías.
const TAB_DESCARTABLE = /instrucci|leyenda|par[aá]metro|^matriz\s*leopold$/i;

const NOMBRE_SUBSISTEMA = {
  "ABIÓTICO": "Medio físico (abiótico)",
  ABIOTICO: "Medio físico (abiótico)",
  "BIÓTICO": "Medio biótico",
  BIOTICO: "Medio biótico",
  "SOCIOECON.": "Medio socioeconómico",
  SOCIOECON: "Medio socioeconómico",
  "SOCIOECONÓMICO": "Medio socioeconómico",
};
// Etiquetas EXACTAS de D.IMPACTOS_BALANCE_DEFAULT (data.js) — para que las
// filas calculadas encajen con las filas por defecto de la Tabla III.26.
const MEDIO_BALANCE = {
  "ABIÓTICO": "Físico (suelo, agua, aire, ruido)",
  ABIOTICO: "Físico (suelo, agua, aire, ruido)",
  "BIÓTICO": "Biótico (flora, fauna)",
  BIOTICO: "Biótico (flora, fauna)",
  "SOCIOECON.": "Socioeconómico y perceptual",
  SOCIOECON: "Socioeconómico y perceptual",
  "SOCIOECONÓMICO": "Socioeconómico y perceptual",
};
const ORDEN_SUBSISTEMA = ["ABIÓTICO", "ABIOTICO", "BIÓTICO", "BIOTICO", "SOCIOECON.", "SOCIOECON", "SOCIOECONÓMICO"];

// Etiquetas EXACTAS de D.IMPACTOS_RESUMEN_DEFAULT (data.js) — normaliza el
// texto de Etapa que traiga la hoja (puede variar entre proyectos) a las 3
// etapas fijas de la Tabla III.25.
const ETAPA_CANONICA = [
  { patron: /preparaci|construcci/i, nombre: "Preparación de sitio y construcción" },
  { patron: /operaci|mantenimiento/i, nombre: "Operación y mantenimiento" },
  { patron: /aband/i, nombre: "Abandono de sitio" },
];
function normalizarEtapa(raw) {
  const e = ETAPA_CANONICA.find((x) => x.patron.test(raw));
  return e ? e.nombre : (raw || "").trim() || "Otra";
}
function tituloClase(c) {
  return String(c || "").toLowerCase().split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
}

function detectarColumna(header, patrones) {
  for (const pat of patrones) {
    const i = header.findIndex((h) => pat.test(h));
    if (i >= 0) return i;
  }
  return -1;
}

// Parsea un CSV completo respetando comillas, INCLUYENDO saltos de línea
// embebidos dentro de una celda (común en encabezados de dos líneas de
// Sheets exportados, ej. "Cód.\nAcción") — a diferencia de split("\n") +
// parseCSVLine (usado para listados simples de una línea por fila), esto es
// indispensable para no desalinear columnas en hojas con encabezados así.
function parseCSVRows(text) {
  const rows = [];
  let row = [], cur = "", inQ = false;
  const s = String(text);
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\r") { /* ignora */ }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

// Parsea la pestaña "Matriz de Resultados" a un arreglo de filas normalizadas
// (una por interacción acción×factor). Devuelve null si la hoja no trae
// Clase+Subsistema (plantilla distinta) para que el llamador caiga al camino
// genérico. Esto se hace UNA sola vez; tanto la narrativa (III.5.7) como las
// 3 tablas calculadas (III.25/25b/26, ver más abajo) reusan este arreglo —
// sin volver a parsear ni gastar una sola llamada IA extra en ellas: los
// índices (ISIG, Clase) ya vienen calculados por el propio Sheet, así que
// agruparlos/sumarlos es aritmética determinista, no algo que requiera IA.
function parseFilasMatrizResultados(csv) {
  const filas = parseCSVRows(csv).filter((r) => r.some((c) => c.trim()));
  if (filas.length < 2) return null;
  const headerIdx = filas.findIndex((r) => r.some((c) => /^etapa$/i.test(c.trim())));
  if (headerIdx < 0) return null;
  const header = filas[headerIdx].map((h) => h.replace(/\s+/g, " ").trim());

  const idx = {
    etapa: detectarColumna(header, [/^etapa$/i]),
    codAccion: detectarColumna(header, [/c[oó]d\.?\s*acci[oó]n/i]),
    accion: detectarColumna(header, [/acci[oó]n del proyecto/i, /^acci[oó]n$/i]),
    codFactor: detectarColumna(header, [/c[oó]d\.?\s*factor/i]),
    factor: detectarColumna(header, [/factor ambiental/i]),
    atributo: detectarColumna(header, [/atributo/i]),
    m: detectarColumna(header, [/^m\b/i]),
    e: detectarColumna(header, [/^e\b/i]),
    d: detectarColumna(header, [/^d\b/i]),
    r: detectarColumna(header, [/^r\b/i]),
    p: detectarColumna(header, [/^p\b/i]),
    a: detectarColumna(header, [/^a\b/i]),
    s: detectarColumna(header, [/^s\b/i]),
    isig: detectarColumna(header, [/isig.*signad/i, /isig/i]),
    clase: detectarColumna(header, [/^clase/i]),
    medida: detectarColumna(header, [/medida/i]),
    norma: detectarColumna(header, [/nom\b|normativ/i]),
    plazo: detectarColumna(header, [/plazo|duraci[oó]n/i]),
    subsistema: detectarColumna(header, [/subsistema/i]),
  };
  if (idx.clase < 0 || idx.subsistema < 0) return null;

  const val = (r, k) => (idx[k] >= 0 ? (r[idx[k]] || "").replace(/\s*[\r\n]+\s*/g, " ").trim() : "");
  const filasOut = [];
  for (let i = headerIdx + 1; i < filas.length; i++) {
    const r = filas[i];
    const clase = val(r, "clase"), subsistema = val(r, "subsistema");
    if (!clase || !subsistema) continue;
    filasOut.push({
      etapa: val(r, "etapa"), codAccion: val(r, "codAccion"), accion: val(r, "accion"),
      codFactor: val(r, "codFactor"), factor: val(r, "factor"), atributo: val(r, "atributo"),
      m: val(r, "m"), e: val(r, "e"), d: val(r, "d"), rr: val(r, "r"), p: val(r, "p"), a: val(r, "a"), s: val(r, "s"),
      isig: val(r, "isig"), clase, medida: val(r, "medida"), norma: val(r, "norma"), plazo: val(r, "plazo"), subsistema,
    });
  }
  return filasOut.length ? filasOut : null;
}

// Agrupa las filas YA parseadas por Subsistema, filtrando a Clase != BAJO —
// esto es lo único que necesita la narrativa de III.5.7 (impactos "altos y
// medios"). Devuelve { nombreSubsistema: csvCompacto } con solo las columnas
// relevantes para narrar (nada de M/E/D/R/P/A/S/III/IB/C/IC crudos: esos son
// insumos de la fórmula, no algo que el texto deba citar — sí van, en
// cambio, íntegros en calcularTablaSignificativos() para la Tabla III.25b).
function agruparNarrativaPorSubsistema(filas) {
  const cols = [
    ["etapa", "Etapa"], ["accion", "Acción"], ["factor", "Factor ambiental"],
    ["atributo", "Atributo del impacto"], ["isig", "ISIG (signo indica adverso/benéfico)"],
    ["clase", "Clase"], ["medida", "Medida de control"], ["norma", "NOM/normativa"], ["plazo", "Plazo"],
  ];
  const cabecera = cols.map(([, l]) => l).join(",");

  const grupos = {};
  filas.forEach((f) => {
    if (/^bajo$/i.test(f.clase)) return; // solo altos y medios
    const fila = cols.map(([k]) => `"${String(f[k] || "").replace(/"/g, "'")}"`).join(",");
    (grupos[f.subsistema] = grupos[f.subsistema] || [cabecera]).push(fila);
  });
  const nombres = Object.keys(grupos);
  if (!nombres.length) return {};
  nombres.sort((a, b) => {
    const ia = ORDEN_SUBSISTEMA.indexOf(a), ib = ORDEN_SUBSISTEMA.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const salida = {};
  nombres.forEach((n) => { salida[n] = grupos[n].join("\n"); });
  return salida;
}

// ── Tablas III.25 / III.25b / III.26 — cálculo determinista ────────────────
// Las 3 tablas que documento.js espera para III.5.6/III.5.8 (ver
// app.js: tablaImpactosResumen/tablaImpactosSignificativos/tablaImpactosBalance)
// son sumatorias/conteos sobre columnas que la propia hoja ya calculó (ISIG,
// Clase) — no requieren IA, solo agrupar y sumar. Esto además es 100% exacto
// (cero riesgo de que la IA invente o redondee mal una cifra).

// III.25 — conteo de impactos +/- por etapa.
function calcularTablaResumen(filas) {
  const grupos = {};
  filas.forEach((f) => {
    const etapa = normalizarEtapa(f.etapa);
    const g = (grupos[etapa] = grupos[etapa] || { pos: 0, neg: 0 });
    const v = parseFloat(f.isig) || 0;
    if (v > 0) g.pos++; else if (v < 0) g.neg++;
  });
  const orden = ETAPA_CANONICA.map((e) => e.nombre);
  const nombres = Object.keys(grupos).sort((a, b) => {
    const ia = orden.indexOf(a), ib = orden.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const out = nombres.map((etapa) => ({
    etapa, positivos: String(grupos[etapa].pos), negativos: String(grupos[etapa].neg),
    total: String(grupos[etapa].pos + grupos[etapa].neg),
  }));
  const tot = out.reduce((acc, r) => ({ pos: acc.pos + Number(r.positivos), neg: acc.neg + Number(r.negativos) }), { pos: 0, neg: 0 });
  out.push({ etapa: "Total", positivos: String(tot.pos), negativos: String(tot.neg), total: String(tot.pos + tot.neg) });
  return out;
}

// III.25b — impactos con |ISIG| ≥ 40 (medio-alto/alto y el tramo superior de
// medio), con los criterios Gómez-Orea crudos (M/E/D/R/P/A/S) tal como los
// trae la hoja.
function calcularTablaSignificativos(filas) {
  return filas
    .filter((f) => Math.abs(parseFloat(f.isig) || 0) >= 40)
    .sort((a, b) => Math.abs(parseFloat(b.isig) || 0) - Math.abs(parseFloat(a.isig) || 0))
    .map((f) => ({
      codigo: [f.codAccion, f.codFactor].filter(Boolean).join(" · "),
      accion: f.accion, factor: f.factor,
      m: f.m, e: f.e, d: f.d, r: f.rr, p: f.p, a: f.a, s: f.s,
      isig: f.isig, semaforo: tituloClase(f.clase), desc: f.atributo,
    }));
}

// III.26 — balance de ISIG (+/−) y conteo de impactos altos/medios por medio
// ambiental (Subsistema), sumado a través de TODAS las etapas.
function calcularTablaBalance(filas) {
  const grupos = {};
  filas.forEach((f) => {
    const medio = MEDIO_BALANCE[f.subsistema] || f.subsistema;
    const g = (grupos[medio] = grupos[medio] || { sigNeg: 0, sigPos: 0, altos: 0, medios: 0 });
    const v = parseFloat(f.isig) || 0;
    if (v < 0) g.sigNeg += Math.abs(v); else if (v > 0) g.sigPos += v;
    const clase = f.clase.toUpperCase();
    if (clase === "ALTO" || clase === "MEDIO-ALTO") g.altos++;
    else if (clase === "MEDIO") g.medios++;
  });
  const orden = ["ABIÓTICO", "BIÓTICO", "SOCIOECON."].map((k) => MEDIO_BALANCE[k]);
  const nombres = Object.keys(grupos).sort((a, b) => {
    const ia = orden.indexOf(a), ib = orden.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const fmt = (n) => String(Math.round(n * 10) / 10);
  const out = nombres.map((medio) => ({
    medio, sig_neg: fmt(grupos[medio].sigNeg), sig_pos: fmt(grupos[medio].sigPos),
    balance: fmt(grupos[medio].sigPos - grupos[medio].sigNeg),
    altos: String(grupos[medio].altos), medios: String(grupos[medio].medios),
  }));
  const tot = out.reduce((acc, r) => ({
    sigNeg: acc.sigNeg + Number(r.sig_neg), sigPos: acc.sigPos + Number(r.sig_pos),
    altos: acc.altos + Number(r.altos), medios: acc.medios + Number(r.medios),
  }), { sigNeg: 0, sigPos: 0, altos: 0, medios: 0 });
  out.push({
    medio: "Total", sig_neg: fmt(tot.sigNeg), sig_pos: fmt(tot.sigPos),
    balance: fmt(tot.sigPos - tot.sigNeg), altos: String(tot.altos), medios: String(tot.medios),
  });
  return out;
}

const SYSTEM_MATRICES_CAT =
  "Eres un consultor ambiental senior especializado en evaluación de impacto ambiental (metodología " +
  "Leopold adaptada + índices Gómez-Orea) para Informes Preventivos ASEA. Lees una tabla de impactos " +
  "YA calculados (ISIG, clase) para UNA sola categoría del medio ambiental y redactas su descripción " +
  "técnica. Escribe en español técnico formal, sin markdown, sin encabezados. No inventes impactos, " +
  "cifras ni normas que no estén en la fuente. Devuelve ÚNICAMENTE JSON válido.";

// Redacta la narrativa de UNA categoría (subsistema), leyendo ÚNICAMENTE
// "Matriz de Resultados" (tablaCSV ya viene filtrada a Clase != BAJO de esa
// misma pestaña — nada de Parámetros/Leopold/Balance: entre menos fuentes,
// menos puede fallar). Si tablaCSV excede ~180 filas se fragmenta con
// chunkCSV (mismo mecanismo que el listado de especies) y las llamadas se
// disparan en paralelo — el tiempo total es el del fragmento más lento, no
// la suma. Cada llamada lleva 1 reintento automático (llamarJSONConReintento)
// para no perder una categoría entera por un fallo transitorio aislado.
async function narrarCategoriaMatriz(apiKey, datos, nombreCrudo, tablaCSV) {
  const nombre = NOMBRE_SUBSISTEMA[nombreCrudo] || nombreCrudo;
  const nFilas = tablaCSV.split("\n").length - 1;

  const buildInstruccion = (bloque, totalCtx) =>
    `${ctx(datos || {})}\n\n` +
    `Redacta la descripción narrativa de los impactos ambientales de la categoría "${nombre}" para el ` +
    "apartado III.5.7 del Informe Preventivo, en 1 a 3 párrafos de prosa continua (un string por " +
    "párrafo, sin saltos de línea internos, sin markdown). Prioriza los impactos de mayor ISIG (clase " +
    "MEDIO-ALTO y ALTO primero, luego MEDIO y BAJO-MEDIO); para cada impacto relevante menciona la " +
    "acción generadora, el factor ambiental receptor, si es adverso o benéfico, y — cuando la fuente lo " +
    "traiga — la medida de control y la norma aplicable. Agrupa impactos similares; no repitas fila por fila.\n\n" +
    `Impactos de esta categoría (ya filtrados a clase MEDIO o superior${totalCtx}):\n${bloque}` +
    "\n\nNunca uses el símbolo \" (comillas de pulgadas) dentro de ningún valor — escribe 'pulg' en su lugar; rompe el JSON.\n\n" +
    `Devuelve ÚNICAMENTE: { "nombre": "${nombre}", "narrativa": ["párrafo 1", "..."] }`;

  if (nFilas > 180) {
    const chunks = chunkCSV(tablaCSV, 150);
    const resultados = await Promise.all(
      chunks.map((chunk, idx) =>
        llamarJSONConReintento(
          apiKey, SYSTEM_MATRICES_CAT,
          [{ type: "text", text: buildInstruccion(chunk, ` — parte ${idx + 1}/${chunks.length}`) }],
          3072, `matrices:${nombreCrudo}:${idx + 1}/${chunks.length}`, MODEL_HAIKU
        ).catch((e) => { console.error(`[matrices] falló ${nombreCrudo} parte ${idx + 1}:`, e.message); return null; })
      )
    );
    const narrativa = resultados.filter(Boolean).flatMap((r) => (Array.isArray(r.narrativa) ? r.narrativa : []));
    if (!narrativa.length) return null;
    return { nombre, narrativa };
  }

  const parsed = await llamarJSONConReintento(
    apiKey, SYSTEM_MATRICES_CAT, [{ type: "text", text: buildInstruccion(tablaCSV, "") }],
    3072, `matrices:${nombreCrudo}`, MODEL_HAIKU
  ).catch((e) => { console.error(`[matrices] falló ${nombreCrudo}:`, e.message); return null; });
  if (!parsed || !Array.isArray(parsed.narrativa) || !parsed.narrativa.length) return null;
  return { nombre: parsed.nombre || nombre, narrativa: parsed.narrativa };
}

// ── Camino genérico (fallback) ──────────────────────────────────────────────
// Se usa solo si la hoja no sigue la plantilla esperada (no se detectó una
// pestaña "Matriz de Resultados" con columnas Clase+Subsistema): se manda
// todo lo no descartable en una sola llamada, dejando que la IA detecte las
// categorías — comportamiento anterior, conservado como red de seguridad.
const SYSTEM_MATRICES =
  "Eres un consultor ambiental senior especializado en evaluación de impacto ambiental (metodología " +
  "Leopold adaptada + índices Gómez-Orea) para Informes Preventivos ASEA. Lees hojas de cálculo con " +
  "matrices de impacto ya calculadas y redactas la descripción técnica de los resultados. Escribe en " +
  "español técnico formal, sin markdown, sin encabezados. No inventes cifras: básate únicamente en los " +
  "datos de la matriz; si un dato no es determinable, dilo en prosa. Devuelve ÚNICAMENTE JSON válido.";

async function extraerMatricesGenerico(tabsCrudos, datos) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const tabs = tabsCrudos.filter((t) => !TAB_DESCARTABLE.test(t.name));
  const MAX_CHARS = 20000;
  const fuente = tabs
    .map((t) => {
      const csv = t.csv.length > MAX_CHARS ? t.csv.slice(0, MAX_CHARS) + "\n[...recortado por longitud...]" : t.csv;
      return `=== Pestaña: ${t.name} ===\n${csv}`;
    })
    .join("\n\n");

  const instruccion =
    `${ctx(datos || {})}\n\n` +
    "Analiza estas matrices de impacto ambiental (Leopold adaptada / resultados Gómez-Orea / balance) " +
    "y DETECTA las categorías de impacto presentes — sin asumir una lista fija: pueden ser por medio " +
    "ambiental (físico/biótico/socioeconómico), por etapa del proyecto, o como estén agrupados los " +
    "datos en la matriz misma. Por cada categoría detectada, redacta la descripción narrativa de sus " +
    "impactos más significativos (acción generadora, factor receptor, magnitud/significancia cuando " +
    "el dato exista en la matriz), como un ARREGLO de 1 a 3 párrafos (un string por párrafo, sin " +
    "saltos de línea internos, sin markdown).\n\n" +
    "Devuelve ÚNICAMENTE:\n" +
    "{ \"categorias\": [ { \"nombre\": \"nombre de la categoría\", \"narrativa\": [\"párrafo 1\", \"...\"] }, ... ] }\n\n" +
    "Nunca uses el símbolo \" (comillas de pulgadas) dentro de ningún valor de texto — escribe 'pulg' " +
    "en su lugar; rompe el JSON.\n\n" +
    `Datos (${tabs.length} pestaña(s)):\n${fuente}`;

  const parsed = await llamarJSON(apiKey, SYSTEM_MATRICES, [{ type: "text", text: instruccion }], 8192, "matrices", MODEL_HAIKU);
  const categorias = Array.isArray(parsed.categorias) ? parsed.categorias.filter((c) => c && c.nombre) : [];
  if (!categorias.length) throw new Error("La IA no detectó categorías de impacto en la matriz.");
  return { categorias };
}

async function extraerMatrices({ sheet_url, datos }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");
  if (!sheet_url) throw new Error("Pega el link de Google Sheets de las matrices de impacto.");

  const tabsCrudos = await fetchSheetTabs(sheet_url);
  if (!tabsCrudos.length) throw new Error("No se pudo leer ninguna pestaña de ese Sheet (¿es público?).");

  const resultadosTab = tabsCrudos.find((t) => /resultado/i.test(t.name));
  if (resultadosTab) {
    const filas = parseFilasMatrizResultados(resultadosTab.csv);
    if (filas) {
      // Tablas III.25/25b/26: aritmética determinista sobre lo que la hoja
      // ya calculó — no cuesta una sola llamada IA extra ni puede fallar por
      // timeout, así que se calculan siempre que la plantilla coincida.
      const tablas = {
        tablaImpactosResumen: calcularTablaResumen(filas),
        tablaImpactosSignificativos: calcularTablaSignificativos(filas),
        tablaImpactosBalance: calcularTablaBalance(filas),
      };

      const grupos = agruparNarrativaPorSubsistema(filas);
      const nombres = Object.keys(grupos);
      if (nombres.length) {
        let resultados = await Promise.all(
          nombres.map((n) =>
            narrarCategoriaMatriz(apiKey, datos, n, grupos[n])
              .catch((e) => { console.error(`[matrices] falló categoría ${n}:`, e.message); return null; })
          )
        );
        if (resultados.some((r) => !r) && resultados.some(Boolean)) {
          // Reintenta SOLO los índices que fallaron (una vez más) antes de
          // darlos por perdidos — evita quedarse con menos de las 3
          // categorías esperadas (Abiótico/Biótico/Socioeconómico) por un
          // fallo aislado y transitorio de una sola llamada. Se identifica
          // por ÍNDICE, no por el texto de "nombre" que devuelva la IA (que
          // puede variar levemente respecto al que se le pidió).
          const faltantes = nombres.map((n, i) => (resultados[i] ? null : i)).filter((i) => i !== null);
          const reintentos = await Promise.all(
            faltantes.map((i) =>
              narrarCategoriaMatriz(apiKey, datos, nombres[i], grupos[nombres[i]])
                .catch((e) => { console.error(`[matrices] categoría ${nombres[i]} falló también en el reintento:`, e.message); return null; })
            )
          );
          faltantes.forEach((i, j) => { resultados[i] = reintentos[j]; });
        }
        const categorias = resultados.filter(Boolean);
        if (categorias.length) return { categorias, tablas };
        console.error("[matrices] todas las categorías fallaron en el camino optimizado — cae al genérico");
      }
      // Sin categorías narrables (o todas fallaron): conserva igual las 3
      // tablas ya calculadas y deja que el camino genérico intente la
      // narrativa de todos modos; si hasta el genérico falla, las tablas
      // calculadas igual valen la pena devolverlas.
      try {
        const generico = await extraerMatricesGenerico(tabsCrudos, datos);
        return { ...generico, tablas };
      } catch (e) {
        console.error("[matrices] camino genérico también falló:", e.message);
        return { categorias: [], tablas };
      }
    }
  }
  return extraerMatricesGenerico(tabsCrudos, datos);
}

// ── MODO "RECEPTORES" ───────────────────────────────────────────────────────
// Lee el Sheet de receptores sensibles / análisis de cercanía (zonas de
// amenaza térmica ALOHA de referencia + inventario real de receptores +
// criterios LCP generales) y devuelve las filas YA en el formato corto que
// usan las tablas III.4.5 (tablaReceptores / tablaRiesgoReceptores) — el
// mismo shape que ya lee documento.js, sin pasar por state.tablas.
const SYSTEM_RECEPTORES =
  "Eres un consultor ambiental senior que evalúa receptores sensibles y análisis de cercanía para " +
  "Informes Preventivos ASEA (sector hidrocarburos), conforme a NOM-005-ASEA-2016 §6.1.3 y al Acuerdo " +
  "DOF 23/02/2017 de Lugares de Concentración Pública (LCP). Escribe en español técnico formal, sin " +
  "markdown. No inventes receptores ni distancias que no estén en la fuente. Devuelve ÚNICAMENTE JSON válido.";

async function extraerReceptores({ sheet_url, datos_crudos, datos }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");

  let fuente = datos_crudos || "";
  if (sheet_url) {
    const tabs = await fetchSheetTabs(sheet_url);
    fuente += tabs.map((t) => `\n\n=== Pestaña: ${t.name} ===\n${t.csv}`).join("");
  }
  if (!fuente.trim()) throw new Error("Pega el link de Google Sheets de receptores sensibles o los datos.");

  const instruccion =
    `${ctx(datos || {})}\n\n` +
    "Esta fuente trae el análisis de receptores sensibles: puede incluir zonas de amenaza térmica ALOHA " +
    "de referencia, un inventario real de receptores con su distancia/zona/cumplimiento, y criterios " +
    "generales de clasificación LCP. Devuelve DOS tablas:\n\n" +
    "1) \"tablaReceptores\": UN registro por cada receptor sensible que aparezca en el inventario de la " +
    "fuente — no inventes receptores que no estén ahí. Columnas: {\"no\": consecutivo, \"tipo\": tipo de " +
    "receptor, \"nombre\": nombre/descripción, \"dist\": distancia al predio en metros (solo número), " +
    "\"dir\": dirección cardinal si la fuente la trae (si no, \"\"), \"pob\": capacidad/población si la " +
    "fuente la trae (si no, \"\"), \"obs\": zona de amenaza térmica correspondiente + si cumple la " +
    "distancia mínima requerida}.\n\n" +
    "2) \"tablaRiesgoReceptores\": evaluación de riesgo por PARÁMETRO ambiental relevante para receptores " +
    "sensibles (COV/vapores del SRV, ruido operacional, derrame accidental de hidrocarburos — no una fila " +
    "por receptor, sino una fila por parámetro). Columnas: {\"receptor\": el receptor más cercano/sensible " +
    "relevante para ese parámetro, \"parametro\": nombre del parámetro, \"nivel\": \"Bajo\"|\"Bajo-Medio\"|" +
    "\"Medio\"|\"Alto\", \"justif\": justificación breve citando distancia y criterio aplicable}.\n\n" +
    "Devuelve ÚNICAMENTE:\n{ \"tablaReceptores\": [...], \"tablaRiesgoReceptores\": [...] }\n\n" +
    "Nunca uses el símbolo \" (comillas de pulgadas) dentro de ningún valor — escribe 'pulg' en su lugar; " +
    "rompe el JSON.\n\n" +
    `Fuente:\n${fuente}`;

  const parsed = await llamarJSON(apiKey, SYSTEM_RECEPTORES, [{ type: "text", text: instruccion }], 6144, "receptores", MODEL_HAIKU);
  return {
    tablaReceptores: Array.isArray(parsed.tablaReceptores) ? parsed.tablaReceptores : [],
    tablaRiesgoReceptores: Array.isArray(parsed.tablaRiesgoReceptores) ? parsed.tablaRiesgoReceptores : [],
  };
}

// ── MODO "VIGENCIAS" ────────────────────────────────────────────────────────
// Lee el Sheet de vigencias documentales (permisos/dictámenes: estatus, folio,
// autoridad, emisión, vencimiento, prioridad, texto sugerido para el IP) y
// devuelve dos cosas: la tabla de evidencia tal cual (para el capítulo VI,
// mismo shape "tablaIA" que usa tK/tRows) y los compromisos que se derivan de
// los documentos vencidos/pendientes (para V.8, shape corto de esa tabla).
const SYSTEM_VIGENCIAS =
  "Eres un consultor ambiental senior que revisa el expediente documental (permisos, dictámenes, " +
  "registros) de una estación de servicio para un Informe Preventivo ASEA. Escribe en español técnico " +
  "formal, sin markdown. No inventes folios ni fechas que no estén en la fuente. Devuelve ÚNICAMENTE JSON válido.";

async function extraerVigencias({ sheet_url, datos_crudos, datos }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");

  let fuente = datos_crudos || "";
  if (sheet_url) {
    const tabs = await fetchSheetTabs(sheet_url);
    fuente += tabs.map((t) => `\n\n=== Pestaña: ${t.name} ===\n${t.csv}`).join("");
  }
  if (!fuente.trim()) throw new Error("Pega el link de Google Sheets de vigencias o los datos.");

  const instruccion =
    `${ctx(datos || {})}\n\n` +
    "Esta fuente trae el expediente documental del proyecto: por cada documento/trámite, su estatus, " +
    "folio, autoridad, fecha de emisión, fecha de vencimiento, prioridad y (si la fuente la trae) un " +
    "texto ya redactado sugerido para el IP. Devuelve DOS cosas:\n\n" +
    "1) \"tablaVigencias\": UN registro por cada documento de la fuente (no omitas ninguno), con estas " +
    "claves EXACTAS: { \"Documento\": \"...\", \"Estatus\": \"...\", \"Folio\": \"...\", \"Autoridad\": " +
    "\"...\", \"Emisión\": \"fecha o 'No aplica'\", \"Vencimiento\": \"fecha o 'Permanente'\", " +
    "\"Prioridad\": \"BAJA\"|\"MEDIA\"|\"ALTA\" }.\n\n" +
    "2) \"compromisos\": SOLO para los documentos cuyo estatus indique una acción pendiente (vencido, " +
    "próximo a vencer, no existe, en elaboración, pendiente de confirmar/renovar — NO para los ya " +
    "vigentes), un compromiso por documento con estas claves: { \"compromiso\": usa tal cual el texto " +
    "sugerido para el IP de la fuente si existe, o redáctalo tú brevemente si no; \"etapa\": " +
    "\"Operación\" (son trámites de operación vigente, salvo que la fuente indique otra etapa); " +
    "\"normativa\": la norma/instrumento asociado si es identificable del nombre del documento o del " +
    "texto sugerido, si no \"\" }.\n\n" +
    "Devuelve ÚNICAMENTE:\n{ \"tablaVigencias\": [...], \"compromisos\": [...] }\n\n" +
    "Nunca uses el símbolo \" (comillas de pulgadas) dentro de ningún valor — escribe 'pulg' en su " +
    "lugar; rompe el JSON.\n\n" +
    `Fuente:\n${fuente}`;

  const parsed = await llamarJSON(apiKey, SYSTEM_VIGENCIAS, [{ type: "text", text: instruccion }], 8192, "vigencias", MODEL_HAIKU);
  return {
    tablaVigencias: Array.isArray(parsed.tablaVigencias) ? parsed.tablaVigencias : [],
    compromisos: Array.isArray(parsed.compromisos) ? parsed.compromisos : [],
  };
}

// ── MODO "CUMPLIMIENTO" ─────────────────────────────────────────────────────
// Lee el Sheet de cumplimiento normativo específico (NOM / Descripción /
// Requisito clave / Cumple) y devuelve la tabla lista para II.1, mismo shape
// "tablaIA" que usa tK/tRows.
const SYSTEM_CUMPLIMIENTO =
  "Eres un consultor ambiental senior que revisa el cumplimiento de Normas Oficiales Mexicanas " +
  "aplicables a una estación de servicio para un Informe Preventivo ASEA. Escribe en español " +
  "técnico formal, sin markdown. No inventes NOMs ni datos que no estén en la fuente. Devuelve " +
  "ÚNICAMENTE JSON válido.";

async function extraerCumplimiento({ sheet_url, datos_crudos, datos }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");

  let fuente = datos_crudos || "";
  if (sheet_url) {
    const tabs = await fetchSheetTabs(sheet_url);
    fuente += tabs.map((t) => `\n\n=== Pestaña: ${t.name} ===\n${t.csv}`).join("");
  }
  if (!fuente.trim()) throw new Error("Pega el link de Google Sheets de cumplimiento normativo o los datos.");

  const instruccion =
    `${ctx(datos || {})}\n\n` +
    "Esta fuente trae la evaluación de cumplimiento de NOMs específicas aplicables al proyecto. " +
    "Devuelve \"tablaCumplimiento\": UN registro por cada NOM de la fuente (no omitas ninguna), con " +
    "estas claves EXACTAS: { \"NOM\": \"...\", \"Descripción\": \"...\", \"Requisito clave\": \"...\", " +
    "\"Cumple\": \"...\" }.\n\n" +
    "Devuelve ÚNICAMENTE:\n{ \"tablaCumplimiento\": [...] }\n\n" +
    "Nunca uses el símbolo \" (comillas de pulgadas) dentro de ningún valor — escribe 'pulg' en su " +
    "lugar; rompe el JSON.\n\n" +
    `Fuente:\n${fuente}`;

  const parsed = await llamarJSON(apiKey, SYSTEM_CUMPLIMIENTO, [{ type: "text", text: instruccion }], 6144, "cumplimiento", MODEL_HAIKU);
  return {
    tablaCumplimiento: Array.isArray(parsed.tablaCumplimiento) ? parsed.tablaCumplimiento : [],
  };
}

// ── MODO "NORMATIVO" ────────────────────────────────────────────────────────
// Lee el Sheet de leyes y NOMs aplicables (Ley / Descripción / Sector
// aplicable / Límite-Requisito / Vigente) y devuelve la tabla lista para
// II.1, mismo shape "tablaIA" que usa tK/tRows.
const SYSTEM_NORMATIVO =
  "Eres un consultor ambiental senior que compila el marco normativo (leyes y NOMs) aplicable a " +
  "una estación de servicio para un Informe Preventivo ASEA. Escribe en español técnico formal, " +
  "sin markdown. No inventes leyes ni datos que no estén en la fuente. Devuelve ÚNICAMENTE JSON válido.";

async function extraerNormativo({ sheet_url, datos_crudos, datos }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");

  let fuente = datos_crudos || "";
  if (sheet_url) {
    const tabs = await fetchSheetTabs(sheet_url);
    fuente += tabs.map((t) => `\n\n=== Pestaña: ${t.name} ===\n${t.csv}`).join("");
  }
  if (!fuente.trim()) throw new Error("Pega el link de Google Sheets de leyes y NOMs aplicables o los datos.");

  const instruccion =
    `${ctx(datos || {})}\n\n` +
    "Esta fuente trae el listado de leyes y NOMs aplicables al proyecto. Devuelve \"tablaNoms\": UN " +
    "registro por cada ley/NOM de la fuente (no omitas ninguna), con estas claves EXACTAS: " +
    "{ \"Ley\": \"...\", \"Descripción\": \"...\", \"Sector aplicable\": \"...\", " +
    "\"Límite/Requisito\": \"...\", \"Vigente\": \"...\" }.\n\n" +
    "Devuelve ÚNICAMENTE:\n{ \"tablaNoms\": [...] }\n\n" +
    "Nunca uses el símbolo \" (comillas de pulgadas) dentro de ningún valor — escribe 'pulg' en su " +
    "lugar; rompe el JSON.\n\n" +
    `Fuente:\n${fuente}`;

  const parsed = await llamarJSON(apiKey, SYSTEM_NORMATIVO, [{ type: "text", text: instruccion }], 6144, "normativo", MODEL_HAIKU);
  return {
    tablaNoms: Array.isArray(parsed.tablaNoms) ? parsed.tablaNoms : [],
  };
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
  "encabezados de subsección). Devuelve ÚNICAMENTE JSON válido, sin texto antes ni después. " +
  "JSON válido significa: nunca un salto de línea real dentro de un string (usa el arreglo de " +
  "párrafos indicado abajo, uno por elemento, sin \\n dentro de cada elemento); nunca una " +
  "comilla doble literal sin escapar dentro de un string (si necesitas indicar pulgadas, escribe " +
  "la palabra 'pulg', nunca el símbolo \" suelto).";

const TABLAS_PLANO = [
  { key: "tablaTanques", titulo: "Tanques sujetos a presión",
    columnas: ["ID Tanque", "Capacidad (L)", "Producto", "Presión diseño", "Presión operación", "Set PSV", "Año/Serie", "Fabricante", "Dictamen/UV"] },
  { key: "tablaTuberias", titulo: "Tuberías y conexiones",
    columnas: ["Fluido / Servicio", "Ø Nominal", "Material", "Tipo de instalación", "Profundidad", "Pendiente", "Prueba / Dictamen", "Observaciones"] },
  { key: "tablaExtintores", titulo: "Extintores",
    columnas: ["No.", "Ubicación", "Tipo", "Capacidad", "Evidencia"] },
  { key: "tablaDistancias", titulo: "Distancias mínimas",
    columnas: ["Elemento", "Distancia requerida (m)", "Distancia de proyecto (m)", "Cumple"] },
  { key: "tablaPrograma", titulo: "Programa de trabajo — actividades y duración estimada",
    columnas: ["Etapa", "Actividad", "Periodo estimado", "Duración"] },
];

// Una sola llamada que le pide al modelo redacción + 4 tablas a la vez tarda
// demasiado (PDF con visión + salida larga) y se acerca al límite de tiempo
// de la función serverless. Se parte en 2 llamadas MÁS CHICAS Y EN PARALELO
// (Promise.all) — el tiempo total pasa a ser el de la más lenta, no la suma
// de ambas, y si una falla la otra igual se aprovecha.
async function llamarPlano(apiKey, docBlock, instruccion, maxTokens, etiqueta) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL, max_tokens: maxTokens, system: SYSTEM_PLANO,
      messages: [{ role: "user", content: [docBlock, { type: "text", text: instruccion }] }],
    }),
  });
  if (!resp.ok) { const d2 = await resp.text(); throw new Error(`Anthropic ${resp.status}: ${d2.slice(0, 300)}`); }
  const data = await resp.json();
  const truncado = data.stop_reason === "max_tokens";
  const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  console.log(`[plano:${etiqueta}] stop_reason=${data.stop_reason} respuesta_chars=${txt.length}`);
  const sinCercas = txt.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  let jsonStr = sinCercas;
  const i = sinCercas.indexOf("{"), j = sinCercas.lastIndexOf("}");
  if (i !== -1 && j !== -1) jsonStr = sinCercas.slice(i, j + 1);
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    const motivo = truncado ? "la respuesta se cortó por límite de longitud" : e.message;
    console.error(`[plano:${etiqueta}] JSON inválido (${motivo}). Primeros 500 chars:`, txt.slice(0, 500));
    throw new Error(motivo);
  }
}

async function interpretarPlano({ datos, plano, notas_adicionales }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");
  if (!plano || !plano.data) throw new Error("Adjunta el PDF del plano.");

  const d = datos || {};
  const docBlock = { type: "document", source: { type: "base64", media_type: plano.media_type || "application/pdf", data: plano.data } };
  const reglaComillas =
    "Nunca uses el símbolo \" (comillas de pulgadas) dentro de ningún valor de texto — escribe " +
    "'pulg' en su lugar; rompe el JSON.";
  const notasTxt = notas_adicionales
    ? `\n\nNotas adicionales del consultor (úsalas; no inventes más):\n${notas_adicionales}` : "";
  const base = `${ctx(d)}\n\nCon base en el plano adjunto (y los datos del proyecto de arriba), `;

  // En vez de 2 llamadas grandes (narrativa completa + todas las tablas), se
  // parte en 5 llamadas más chicas y MÁS RÁPIDAS, disparadas TODAS a la vez —
  // cada una cubre menos texto/tablas por generar, así que aunque las 5 leen
  // el mismo PDF, el tiempo total baja porque ninguna carga con todo el
  // trabajo de redacción o de tablas de una sola vez.
  const narrInstr = (claves, parrafos) =>
    base +
    `interpreta el plano y redacta SOLO estas subsecciones de la Descripción Técnica (Sección III.1) ` +
    `del Informe Preventivo, en español técnico formal, cada una como un arreglo de párrafos (un ` +
    `string por párrafo, sin saltos de línea internos, sin markdown ni encabezados):\n${parrafos}\n\n` +
    `Devuelve ÚNICAMENTE:\n{ "narrativa": { ${claves.map((k) => `"${k}": ["..."]`).join(", ")} } }\n\n` +
    "Interpreta razonablemente lo que el plano permita; usa \"[Dato pendiente: descripción]\" dentro " +
    "del párrafo solo cuando un dato concreto no sea determinable del plano. " + reglaComillas + notasTxt;

  const especTabla = (keys) => {
    const subset = TABLAS_PLANO.filter((t) => keys.includes(t.key));
    const spec = subset.map((t) => `- "${t.key}" (${t.titulo}): columnas [${t.columnas.join(", ")}]`).join("\n");
    const forma = "{ " + subset.map((t) => `"${t.key}": [ { ${t.columnas.map((c) => `"${c}": ""`).join(", ")} } ]`).join(", ") + " }";
    return { spec, forma };
  };

  const tareas = [
    { etiqueta: "narrativa:1", maxTokens: 2048, instruccion: narrInstr(
        ["general", "actividades"],
        "- \"general\": III.1 visión general del proyecto/actividad proyectada (1-2 párrafos).\n" +
        "- \"actividades\": III.1.2 actividades principales del ciclo operativo que se aprecian en el plano (recepción, almacenamiento, despacho, recuperación de vapores, etc.) (1-2 párrafos)."
      ) },
    { etiqueta: "narrativa:2", maxTokens: 2048, instruccion: narrInstr(
        ["dimensiones", "caracteristicas"],
        "- \"dimensiones\": III.1.3 dimensiones y distribución de áreas del predio, leídas/inferidas de las cotas, escala y leyenda del plano (1-2 párrafos).\n" +
        "- \"caracteristicas\": III.1.4 características del proyecto según su naturaleza (procesos, servicios ofrecidos, tipo de instalación) (1-2 párrafos)."
      ) },
    { etiqueta: "narrativa:3", maxTokens: 2048, instruccion: narrInstr(
        ["detallesTecnicos"],
        "- \"detallesTecnicos\": III.1.7 detalles técnicos de los equipos mostrados (tanques con sus identificadores tal como aparecen —p.ej. T-01, T-02—, líneas y tuberías, dispensarios/islas, SRV, sistemas de seguridad) (2-3 párrafos)."
      ) },
  ];

  const gruposTablas = [["tablaTanques", "tablaTuberias"], ["tablaExtintores", "tablaDistancias"], ["tablaPrograma"]];
  gruposTablas.forEach((keys) => {
    const { spec, forma } = especTabla(keys);
    const esPrograma = keys.includes("tablaPrograma");
    tareas.push({
      etiqueta: "tablas:" + keys.join("+"),
      maxTokens: 3072,
      instruccion:
        base +
        "interpreta lo que muestra (cotas, escala, símbolos, etiquetas, leyendas, notas, conteo de " +
        "equipos, productos por rótulo/color) y llena SOLO estas tablas:\n" + spec + "\n\n" +
        (esPrograma
          ? "Para \"tablaPrograma\" (III.1.6 Programa de trabajo): interpreta los tiempos y lapsos " +
            "estimados por actividad y agrúpalas por etapa (Preparación y construcción, Operación, " +
            "Abandono). \"Periodo estimado\" = la ventana temporal; \"Duración\" = cuánto dura esa " +
            "actividad. Si el plano no indica tiempos, estima un cronograma típico de una estación de " +
            "servicio y marca la Duración con \"[Dato pendiente]\" cuando no puedas estimarla.\n\n"
          : "") +
        "Devuelve ÚNICAMENTE:\n{ \"tablas\": " + forma + " }\n\n" +
        "Reglas: no inventes marcas/números de serie/dictámenes que no estén en el plano (usa \"\" o " +
        "\"[Dato pendiente]\" en esas celdas); sí puedes inferir capacidades, cantidades, productos y " +
        "distancias de las cotas y símbolos. Incluye TODAS las filas que el plano muestre, sin límite. " +
        reglaComillas + notasTxt,
    });
  });

  const resultados = await Promise.all(tareas.map((t) =>
    llamarPlano(apiKey, docBlock, t.instruccion, t.maxTokens, t.etiqueta)
      .catch((e) => { console.error(`[plano] falló "${t.etiqueta}":`, e.message); return null; })
  ));

  if (resultados.every((r) => !r)) {
    throw new Error(
      "La IA no pudo procesar el plano (fallaron todas las partes). Intenta de nuevo, o con un plano " +
      "más simple/menos páginas si el problema persiste."
    );
  }

  // Une cada subsección (arreglo de párrafos) con doble salto de línea, para que
  // IAP() del documento la vuelva a partir en párrafos.
  const unir = (v) => limpiarMarkdown(Array.isArray(v) ? v.join("\n\n") : (v || ""));
  const narrativa = { general: "", actividades: "", dimensiones: "", caracteristicas: "", detallesTecnicos: "" };
  const tablas = {};
  resultados.forEach((r) => {
    if (!r) return;
    if (r.narrativa) Object.keys(r.narrativa).forEach((k) => { if (k in narrativa) narrativa[k] = unir(r.narrativa[k]); });
    if (r.tablas) Object.assign(tablas, r.tablas);
  });

  const hayNarrativa = Object.values(narrativa).some((s) => s.trim());
  if (!hayNarrativa && !Object.keys(tablas).length) {
    console.warn("[plano] todas las llamadas devolvieron JSON válido pero vacío — revisa la calidad/legibilidad del PDF.");
  }
  return { narrativa, tablas };
}

// ── MODO "TABLA" ──────────────────────────────────────────────────────────
// Estructura datos pegados o imágenes en filas para las tablaIA del formulario.
const SYSTEM_TABLA =
  "Eres un asistente que estructura datos crudos (texto o imágenes de tablas/listados) " +
  "en tablas para un Informe Preventivo (IP) ASEA. Devuelve ÚNICAMENTE JSON válido, sin " +
  "texto adicional. No inventes datos: si un campo no aparece en la fuente, usa cadena vacía. " +
  "No limites el número de filas: incluye TODAS las que encuentres.";

async function estructurarTabla({ tablas, datos_crudos, imagen, sheet_url }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada en el servidor.");
  if (!Array.isArray(tablas) || !tablas.length) throw new Error("Faltan especificaciones de tabla.");

  // Cualquier campo tablaIA puede opcionalmente traer un link de Google
  // Sheets (ej. la base de flora/fauna) además de/en vez de texto pegado.
  // Los listados de especies (podarListaEspecies) se mandan aparte porque
  // pueden ser grandes incluso después de podados — se fragmentan más abajo.
  let fuente = datos_crudos || "";
  let especiesCSV = "";
  let especiesTotal = 0;
  if (sheet_url) {
    const tabs = await fetchSheetTabs(sheet_url);
    tabs.forEach((t) => {
      const podado = podarListaEspecies(t.csv);
      if (podado) {
        especiesCSV += (especiesCSV ? "\n" : "") + podado.csv.split("\n").slice(1).join("\n");
        especiesTotal += podado.especies;
      } else {
        fuente += `\n\n=== Pestaña: ${t.name} ===\n${muestrearCSV(t.csv, 600)}`;
      }
    });
    if (especiesCSV) especiesCSV = "scientific_name,common_name,grupo_taxonomico\n" + especiesCSV;
  }
  const esListaEspecies = !!especiesCSV;
  // Listados de especies necesitan el conocimiento taxonómico amplio de
  // Sonnet (clasificación NOM-059); el resto de tablaIA es extracción
  // mecánica de datos ya estructurados — Haiku es más rápido y barato.
  const modelTabla = esListaEspecies ? MODEL : MODEL_HAIKU;

  const spec = tablas
    .map((t) => `- "${t.key}" (${t.titulo || t.key}): columnas [${(t.columnas || []).join(", ")}]`)
    .join("\n");
  const forma =
    "{ " +
    tablas
      .map((t) => `"${t.key}": [ { ${(t.columnas || []).map((c) => `"${c}": ""`).join(", ")} } ]`)
      .join(", ") +
    " }";
  const buildInstruccion = (fuenteBloque) =>
    `Estructura la información proporcionada (texto y/o imagen) en las siguientes tablas.\n` +
    `Devuelve ÚNICAMENTE un objeto JSON con esta forma exacta:\n${forma}\n\n` +
    `Tablas a llenar:\n${spec}\n\n` +
    `Reglas: una fila por registro; no inventes datos (campo vacío si no aparece en la fuente); ` +
    `incluye TODAS las filas encontradas, sin límite; nunca uses el símbolo " (comillas de ` +
    `pulgadas) dentro de ningún valor, escribe 'pulg' en su lugar — rompe el JSON.` +
    (fuenteBloque ? `\n\nDatos crudos:\n${fuenteBloque}` : "");

  // Ejecuta chunks de un CSV en paralelo (con 1 reintento cada uno) y
  // combina los resultados por tabla — mismo mecanismo para (a) listados de
  // especies (clasificación NOM-059, necesita el criterio amplio de Sonnet)
  // y (b) cualquier otra tabla grande pegada directa o venida de una
  // pestaña de Sheet (ej. POEL con muchas UGAs) — antes SOLO el camino (a)
  // fragmentaba, así que una pestaña/pegado grande sin ser un listado de
  // especies se mandaba de un jalón y se cortaba por max_tokens ("la
  // respuesta se cortó por límite de longitud (demasiadas filas)").
  async function procesarEnChunks(csv, filasPorChunk, model, etiqueta, prefijoBloque, contextoExtra) {
    const chunks = chunkCSV(csv, filasPorChunk);
    const resultados = await Promise.all(
      chunks.map((chunk, idx) => {
        // Cuenta las filas de datos que trae ESTE chunk (sin encabezado) y
        // lo hace explícito en la instrucción — refuerza "incluye TODAS las
        // filas" con un número concreto que el modelo puede autoverificar,
        // en vez de confiar solo en la regla genérica (que un modelo puede
        // incumplir "de oído" en tablas largas, sobre todo con Haiku).
        const nFilasChunk = chunk.split(/\r?\n/).filter((l) => l.trim()).length - 1;
        const bloque = (contextoExtra ? contextoExtra + "\n\n" : "") +
          `=== ${prefijoBloque} (parte ${idx + 1}/${chunks.length} — trae EXACTAMENTE ${nFilasChunk} filas de datos; ` +
          `tu respuesta debe incluir las ${nFilasChunk}, ninguna de más ni de menos) ===\n${chunk}`;
        return llamarJSONConReintento(apiKey, SYSTEM_TABLA, [{ type: "text", text: buildInstruccion(bloque) }], 8192, `${etiqueta}:${idx + 1}/${chunks.length}`, model)
          .then((r) => {
            const nDevueltas = tablas.reduce((s, t) => s + (Array.isArray(r[t.key]) ? r[t.key].length : 0), 0);
            if (nDevueltas < nFilasChunk) console.error(`[tabla] ${etiqueta} parte ${idx + 1}/${chunks.length}: esperaba ${nFilasChunk} filas, devolvió ${nDevueltas}`);
            return r;
          })
          .catch((e) => { console.error(`[tabla] falló ${etiqueta} parte ${idx + 1}/${chunks.length}:`, e.message); return null; });
      })
    );
    const combinado = {};
    tablas.forEach((t) => { combinado[t.key] = []; });
    resultados.forEach((r) => {
      if (!r) return;
      tablas.forEach((t) => { if (Array.isArray(r[t.key])) combinado[t.key].push(...r[t.key]); });
    });
    return combinado;
  }

  // Listados de especies: chunks chicos (40) porque cada fila exige que el
  // modelo razone la clasificación NOM-059 (no es extracción mecánica) —
  // pedazos grandes tardaban más de los 60s de Vercel Hobby aun en
  // paralelo, porque cada llamada individual ya se pasaba del límite.
  const FILAS_POR_CHUNK_ESPECIES = 40;
  if (esListaEspecies) {
    const nEspecies = especiesCSV.split("\n").length - 1;
    if (nEspecies > FILAS_POR_CHUNK_ESPECIES) {
      const combinado = await procesarEnChunks(especiesCSV, FILAS_POR_CHUNK_ESPECIES, modelTabla, "tabla:especies", "Especies", fuente);
      if (!Object.values(combinado).some((arr) => arr.length)) {
        throw new Error(`La IA no pudo procesar el listado de ${especiesTotal} especies. Intenta de nuevo.`);
      }
      return { tablas: combinado };
    }
    // Pocas especies (cabe en 1 sola llamada): sigue el camino normal de abajo.
    fuente += (fuente ? "\n\n" : "") + `=== Especies ===\n${especiesCSV}`;
  } else {
    // Tabla no-especie (mecánica): si trae muchas filas (ej. POEL con
    // decenas/cientos de UGAs), fragmenta igual. Chunks chicos (30): con
    // menos filas por llamada es menos probable que el modelo "resuma" o se
    // salte alguna en vez de transcribirlas todas — y ya no compite por
    // tiempo con la evaluación de incisos (esa pestaña se excluye de ese
    // camino, ver extraerProgramasMulti), así que hay margen de sobra.
    const FILAS_POR_CHUNK_TABLA = 30;
    const nLineasFuente = fuente ? fuente.split(/\r?\n/).filter((l) => l.trim()).length - 1 : 0;
    if (nLineasFuente > FILAS_POR_CHUNK_TABLA) {
      const combinado = await procesarEnChunks(fuente, FILAS_POR_CHUNK_TABLA, modelTabla, "tabla:fragmento", "Datos");
      if (!Object.values(combinado).some((arr) => arr.length)) {
        throw new Error(`La IA no pudo procesar la tabla (${nLineasFuente} filas). Intenta de nuevo.`);
      }
      return { tablas: combinado };
    }
  }

  const instruccion = buildInstruccion(fuente);
  const content = [];
  if (imagen && imagen.data)
    content.push({ type: "image", source: { type: "base64", media_type: imagen.media_type || "image/png", data: imagen.data } });
  content.push({ type: "text", text: instruccion });

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: modelTabla, max_tokens: 8192, system: SYSTEM_TABLA, messages: [{ role: "user", content }] }),
  });
  if (!resp.ok) { const d = await resp.text(); throw new Error(`Anthropic ${resp.status}: ${d.slice(0, 300)}`); }
  const data = await resp.json();
  const truncado = data.stop_reason === "max_tokens";
  const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  const sinCercas = txt.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  let jsonStr = sinCercas;
  const i = sinCercas.indexOf("{"), j = sinCercas.lastIndexOf("}");
  if (i !== -1 && j !== -1) jsonStr = sinCercas.slice(i, j + 1);
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    const motivo = truncado ? "la respuesta se cortó por límite de longitud (demasiadas filas)" : e.message;
    throw new Error(`La IA no devolvió JSON válido para la tabla (${motivo}). Intenta de nuevo.`);
  }
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
    if (body.accion === "programas_multi") {
      const out = await extraerProgramasMulti(body);
      res.status(200).json({ ok: true, ...out });
      return;
    }
    if (body.accion === "matrices") {
      const out = await extraerMatrices(body);
      res.status(200).json({ ok: true, ...out });
      return;
    }
    if (body.accion === "receptores") {
      const out = await extraerReceptores(body);
      res.status(200).json({ ok: true, ...out });
      return;
    }
    if (body.accion === "vigencias") {
      const out = await extraerVigencias(body);
      res.status(200).json({ ok: true, ...out });
      return;
    }
    if (body.accion === "cumplimiento") {
      const out = await extraerCumplimiento(body);
      res.status(200).json({ ok: true, ...out });
      return;
    }
    if (body.accion === "normativo") {
      const out = await extraerNormativo(body);
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
module.exports.extraerProgramasMulti = extraerProgramasMulti;
module.exports.extraerMatrices = extraerMatrices;
module.exports.extraerReceptores = extraerReceptores;
module.exports.extraerVigencias = extraerVigencias;
module.exports.extraerCumplimiento = extraerCumplimiento;
module.exports.extraerNormativo = extraerNormativo;
module.exports.interpretarPlano = interpretarPlano;
module.exports.limpiarMarkdown = limpiarMarkdown;
module.exports.fetchSheetTabs = fetchSheetTabs;
