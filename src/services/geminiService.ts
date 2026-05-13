import { GoogleGenAI, Type } from "@google/genai";
import { Gasolinera, TipoReporte, Plantilla } from "../types";
import { interpolarPrompt, plantillaParaReporte } from "./reportResolver";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL = "gemini-2.0-flash";

function extractRetryDelayMs(error: unknown): number {
  try {
    const msg = (error as any)?.message ?? '';
    const match = msg.match(/"retryDelay":"(\d+)s"/);
    return match ? parseInt(match[1]) * 1000 : 35000;
  } catch {
    return 35000;
  }
}

function isDailyQuotaExhausted(error: unknown): boolean {
  const msg = (error as any)?.message ?? '';
  return (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) && msg.includes('limit: 0');
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = (err as any)?.message ?? '';
      const is429 = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
      // Daily quota exhausted — retrying won't help
      if (!is429 || isDailyQuotaExhausted(err) || attempt >= maxRetries) throw err;
      const delay = extractRetryDelayMs(err) * (attempt + 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// Local fallback — populates all available fields and marks sections needing AI
function generateReporteFallback(tipoReporte: TipoReporte, gas: Gasolinera, plantilla: Plantilla): string {
  const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const ubicacion = [gas.calle, gas.numero_exterior, gas.colonia, gas.municipio, gas.estado, gas.cp ? `CP ${gas.cp}` : '']
    .filter(Boolean).join(', ');

  const cabecera = `BORRADOR — PENDIENTE DE REDACCION POR IA
Cuota diaria de Gemini API agotada. Las secciones indicadas se completarán cuando la cuota se restablezca (medianoche, hora Pacífico) o al activar facturación en https://aistudio.google.com
Fecha de generación: ${fecha}

================================================================================
${plantilla.nombre.toUpperCase()}
Autoridad: ${plantilla.autoridad}
Fundamento legal: ${plantilla.fundamento_legal}
Tiempo de resolución: ${plantilla.tiempo_resolucion}
================================================================================

I. DATOS DEL PROMOVENTE

Razón Social:                  ${gas.razon_social}
RFC:                           ${gas.rfc}
Representante Legal:           ${gas.representante_legal ?? '[VERIFICAR]'}
Domicilio para notificaciones: ${gas.domicilio_notificaciones ?? '[VERIFICAR]'}
Correo electrónico:            ${gas.correo_electronico ?? '[VERIFICAR]'}
Teléfono:                      ${gas.telefono ?? '[VERIFICAR]'}

II. DATOS DEL PROYECTO

Tipo de proyecto:              ${gas.tipo_proyecto ?? '[VERIFICAR]'}
Capacidad de almacenamiento:   ${gas.capacidad_almacenamiento_litros ? gas.capacidad_almacenamiento_litros.toLocaleString() + ' L' : '[VERIFICAR]'}
Número de tanques:             ${gas.numero_tanques_total ?? '[VERIFICAR]'}
Tipo de tanque:                ${gas.tipo_tanque ?? '[VERIFICAR]'}
Superficie total del predio:   ${gas.superficie_total_m2 ? gas.superficie_total_m2 + ' m²' : '[VERIFICAR]'}
Superficie utilizada:          ${gas.superficie_utilizada_m2 ? gas.superficie_utilizada_m2 + ' m²' : '[VERIFICAR]'}
Vigencia de operación:         ${gas.vigencia_operacion_anos ? gas.vigencia_operacion_anos + ' años' : '[VERIFICAR]'}
Permiso CRE:                   ${gas.permiso_cre ?? '[VERIFICAR]'}
NRA:                           ${gas.nra ?? '[VERIFICAR]'}

III. UBICACION

Domicilio:                     ${ubicacion || '[VERIFICAR]'}
Coordenadas geográficas:       Lat ${gas.lat}, Lng ${gas.lng}
Área Natural Protegida (ANP):  ${gas.esta_en_anp ? 'SÍ — requiere análisis específico' : 'No'}
Sitio RAMSAR:                  ${gas.esta_en_ramsar ? 'SÍ — requiere análisis específico' : 'No'}
Remoción vegetación forestal:  ${gas.requiere_remocion_vegetacion ? 'SÍ — requiere trámite forestal' : 'No'}

IV. DATOS SOCIOECONÓMICOS Y DE OPERACIÓN

Núm. trabajadores total:       ${gas.num_trabajadores_total ?? '[VERIFICAR]'}
  Hombres:                     ${gas.num_trabajadores_hombres ?? '[VERIFICAR]'}
  Mujeres:                     ${gas.num_trabajadores_mujeres ?? '[VERIFICAR]'}
Grado de marginación:          ${gas.grado_marginacion ?? '[VERIFICAR]'}
Índice de marginación:         ${gas.indice_marginacion ?? '[VERIFICAR]'}
Grado de rezago social:        ${gas.grado_rezago_social ?? '[VERIFICAR]'}
`;

  const seccion: Record<TipoReporte, string> = {
    MISSE_FormatoA: `
================================================================================
SECCIÓN III.3 — CARACTERIZACIÓN SOCIOECONÓMICA
(PENDIENTE DE REDACCIÓN POR IA — Gemini API sin cuota)
================================================================================

Esta sección debe contener, de conformidad con la DACG MISSE (DOF 16-feb-2026):

1. Referencia a las tablas de indicadores de marginación, rezago social y carencia
   en viviendas del INEGI/CONEVAL para el municipio de ${gas.municipio ?? '[MUNICIPIO]'},
   ${gas.estado ?? '[ESTADO]'}.

2. Perfil socioeconómico de la localidad, incluyendo índice de marginación
   (grado ${gas.grado_marginacion ?? '[VERIFICAR]'}) y rezago social.

3. Análisis de los beneficios del proyecto de ${gas.tipo_proyecto ?? '[TIPO]'} para
   la población usuaria de gas LP/petrolíferos frente a quienes utilizan leña como
   combustible doméstico.

4. Compromisos con la protección de grupos vulnerables y referencia al Plan de
   Gestión Social del promovente.

[Este texto debe ser redactado por un consultor ambiental o regenerado con IA
 cuando la cuota de la API de Gemini se restablezca.]`,

    Informe_Preventivo: `
================================================================================
SECCIÓN V — CONCLUSIONES
(PENDIENTE DE REDACCIÓN POR IA — Gemini API sin cuota)
================================================================================

Esta sección debe contener una declaración formal (3-4 párrafos) que establezca:

1. Que el proyecto de ${gas.razon_social} (RFC: ${gas.rfc}), consistente en
   ${gas.tipo_proyecto ?? '[TIPO]'} con capacidad de ${gas.capacidad_almacenamiento_litros?.toLocaleString() ?? '[VERIFICAR]'} L,
   ubicado en ${ubicacion || '[VERIFICAR]'}, se inscribe en el supuesto del
   Art. 31 Fracción I de la LGEEPA y Art. 29 del RLGEEPA-MEIA.

2. Que la NOM-005-ASEA-2016 regula integralmente todos los impactos ambientales
   relevantes asociados a la operación de la estación de servicio.

3. Que en virtud de lo anterior, NO se requiere la presentación de una Manifestación
   de Impacto Ambiental (MIA) para el presente proyecto.

4. Compromiso formal del promovente con el cumplimiento de toda la normatividad
   aplicable, incluyendo el Acuerdo DOF 17-oct-2017.

[Este texto debe ser redactado por un consultor ambiental o regenerado con IA
 cuando la cuota de la API de Gemini se restablezca.]`,

    MIA_Particular: `
================================================================================
SECCIÓN VII — PRONÓSTICOS AMBIENTALES Y EVALUACIÓN DE ALTERNATIVAS
(PENDIENTE DE REDACCIÓN POR IA — Gemini API sin cuota)
================================================================================

Esta sección debe desarrollar tres escenarios para el proyecto de ${gas.razon_social}
(${gas.tipo_proyecto ?? '[TIPO]'}), superficie ${gas.superficie_total_m2 ?? '[VERIFICAR]'} m²,
capacidad ${gas.capacidad_almacenamiento_litros?.toLocaleString() ?? '[VERIFICAR]'} L,
ubicado en ${gas.municipio ?? '[VERIFICAR]'}, ${gas.estado ?? '[VERIFICAR]'}:

ESCENARIO 1 — SIN PROYECTO
Descripción del estado actual del predio y tendencias de desarrollo
sin la instalación de la estación de servicio.
[PENDIENTE DE REDACCIÓN POR IA]

ESCENARIO 2 — CON PROYECTO SIN MEDIDAS DE MITIGACIÓN
Identificación y cuantificación de impactos potenciales sobre agua,
suelo, aire y comunidades aledañas durante construcción y operación.
[PENDIENTE DE REDACCIÓN POR IA]

ESCENARIO 3 — CON PROYECTO Y MEDIDAS DE PREVENCIÓN/MITIGACIÓN
Descripción de las medidas de mitigación aplicables conforme a
NOM-005-ASEA-2016, NOM-003-SEDG-2004 y la Ley del Sector Hidrocarburos
(DOF 11-ago-2014 y sus reformas). Impactos residuales aceptables y
dictamen de viabilidad ambiental.
[PENDIENTE DE REDACCIÓN POR IA]

[Este texto debe ser redactado por un consultor ambiental o regenerado con IA
 cuando la cuota de la API de Gemini se restablezca.]`,

    RGRP: `
================================================================================
SECCIÓN IV — CLASIFICACIÓN DE RESIDUOS PELIGROSOS (NOM-052-SEMARNAT-2005)
(PENDIENTE DE REDACCIÓN POR IA — Gemini API sin cuota)
================================================================================

Empresa: ${gas.razon_social} | RFC: ${gas.rfc}
Ubicación: ${ubicacion || '[VERIFICAR]'}
Trabajadores: ${gas.num_trabajadores_total ?? '[VERIFICAR]'}

Residuos peligrosos típicos de estación de servicio (cantidades pendientes de IA):

| Residuo                          | Cód. NOM-052 | Estado  | CRIT | kg/mes    | Origen          | Destino final      |
|----------------------------------|--------------|---------|------|-----------|-----------------|--------------------|
| Aceites lubricantes usados       | [IA]         | Líquido | T    | [IA]      | Cambio de aceite| Empresa autorizada |
| Trapos impregnados c/ hidrocarburo| [IA]        | Sólido  | I,T  | [IA]      | Limpieza        | Incineración       |
| Filtros de aceite usados         | [IA]         | Sólido  | T    | [IA]      | Mantenimiento   | Empresa autorizada |
| Solventes usados                 | [IA]         | Líquido | I,T  | [IA]      | Limpieza        | Empresa autorizada |
| Envases contaminados c/ hidrocarburo| [IA]      | Sólido  | T    | [IA]      | Operación       | Empresa autorizada |
| Baterías desechadas              | [IA]         | Sólido  | T,C  | [IA]      | Eléctrico       | Empresa autorizada |

[Este texto debe ser redactado por un consultor ambiental o regenerado con IA
 cuando la cuota de la API de Gemini se restablezca.]`,
  };

  return cabecera + (seccion[tipoReporte] ?? '') + `

================================================================================
FIN DEL DOCUMENTO — BORRADOR SIN REDACCIÓN IA
Para regenerar con contenido completo: activar facturación en https://aistudio.google.com
o esperar al restablecimiento de cuota gratuita (medianoche hora del Pacífico).
================================================================================`;
}

export async function extractGasolineraData(text: string) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Analiza el siguiente texto de un documento de una gasolinera en México y extrae los datos de identificación en formato JSON.
    Campos requeridos: razon_social, rfc, nra, permiso_cre, municipio, estado.
    Texto: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          razon_social: { type: Type.STRING },
          rfc: { type: Type.STRING },
          nra: { type: Type.STRING },
          permiso_cre: { type: Type.STRING },
          municipio: { type: Type.STRING },
          estado: { type: Type.STRING },
        },
      },
    },
  });
  return JSON.parse(response.text);
}

export async function calculateEmissions(volumeLiters: number, hasSRV: boolean, srvEfficiency: number = 90) {
  const srvText = hasSRV ? `Instalado con eficiencia del ${srvEfficiency}%` : 'No instalado';
  const prompt = `Calcula las emisiones de COV para una gasolinera en México que despachó ${volumeLiters} litros anuales.
  Sistemas de Recuperación de Vapores (SRV): ${srvText}.
  Utiliza factores EPA AP-42. Retorna un JSON con toneladas_cov, benceno_kg, tolueno_kg, xileno_kg y la metodología breve.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          toneladas_cov: { type: Type.NUMBER },
          benceno_kg: { type: Type.NUMBER },
          tolueno_kg: { type: Type.NUMBER },
          xileno_kg: { type: Type.NUMBER },
          metodologia: { type: Type.STRING },
        },
      },
    },
  });
  return JSON.parse(response.text);
}

export async function classifyResidue(name: string) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Clasifica el residuo "${name}" según la NOM-052-SEMARNAT-2005 (CRETIB).
    Retorna JSON con: codigo_cretib, manejo, descripcion.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          codigo_cretib: { type: Type.STRING },
          manejo: { type: Type.STRING },
          descripcion: { type: Type.STRING },
        },
      },
    },
  });
  return JSON.parse(response.text);
}

export async function generateCOANarrative(seccion: number, anio: number, data: any) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Genera una narrativa técnica formal para la Sección ${seccion} de la COA SEMARNAT ${anio} basada en estos datos: ${JSON.stringify(data)}.
    Debe seguir los lineamientos oficiales de SEMARNAT. Estilo técnico-administrativo, párrafos formales.`,
  });
  return response.text;
}

export const FALLBACK_MARKER = '__KENZLY_BORRADOR__';

export async function generateReporteAmbiental(
  tipoReporte: TipoReporte,
  gasolinera: Gasolinera,
): Promise<string> {
  const plantilla = plantillaParaReporte(tipoReporte);
  if (!plantilla) throw new Error(`Plantilla no encontrada: ${tipoReporte}`);

  const promptBase = interpolarPrompt(plantilla.prompt_generator, gasolinera);

  const sistemaPrompt = `Eres un consultor ambiental senior especializado en el sector hidrocarburos en México.
Generas contenido para reportes oficiales ingresados a SENER/ASEA/SEMARNAT.
Estilo obligatorio: técnico-administrativo formal, párrafos de 4-8 oraciones,
referencias normativas explícitas con número de artículo y fecha de publicación en el DOF.
REGLA CRÍTICA: NO inventes datos numéricos. Si una cifra no está en el contexto, escribe "[VERIFICAR]".
NO uses lenguaje promocional ni exagerado. NO uses bullet points excepto en tablas.`;

  const contextoProyecto = `
CONTEXTO DEL PROYECTO:
- Razón Social: ${gasolinera.razon_social}
- RFC: ${gasolinera.rfc}
- Representante Legal: ${gasolinera.representante_legal || '[VERIFICAR]'}
- Tipo de proyecto: ${gasolinera.tipo_proyecto || '[VERIFICAR]'}
- Capacidad almacenamiento: ${gasolinera.capacidad_almacenamiento_litros ? gasolinera.capacidad_almacenamiento_litros.toLocaleString() + ' L' : '[VERIFICAR]'}
- Ubicación: ${gasolinera.calle || ''} ${gasolinera.numero_exterior || ''}, ${gasolinera.colonia || ''}, ${gasolinera.municipio || ''}, ${gasolinera.estado || ''} CP ${gasolinera.cp || ''}
- Superficie total: ${gasolinera.superficie_total_m2 ? gasolinera.superficie_total_m2 + ' m²' : '[VERIFICAR]'}
- En ANP: ${gasolinera.esta_en_anp ? 'SÍ' : 'No'}
- En RAMSAR: ${gasolinera.esta_en_ramsar ? 'SÍ' : 'No'}
- Requiere remoción forestal: ${gasolinera.requiere_remocion_vegetacion ? 'SÍ' : 'No'}
- Trabajadores: ${gasolinera.num_trabajadores_total || '[VERIFICAR]'}

REPORTE: ${plantilla.nombre}
AUTORIDAD: ${plantilla.autoridad}
FUNDAMENTO LEGAL: ${plantilla.fundamento_legal}`;

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: MODEL,
        contents: `${sistemaPrompt}\n\n${contextoProyecto}\n\n${promptBase}`,
      })
    );
    return response.text;
  } catch (err: unknown) {
    const msg = (err as any)?.message ?? '';
    const is429 = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
    if (is429) {
      return FALLBACK_MARKER + generateReporteFallback(tipoReporte, gasolinera, plantilla);
    }
    throw err;
  }
}

export async function generateDocumentContent(plantilla: string, gasolinera: any, contextualData: any) {
  const prompt = `Actúa como un perito técnico experto en regulación ambiental de gasolineras en México (ASEA/SEMARNAT/CRE).
  Genera el contenido para el documento: "${plantilla}".

  DATOS DE LA ESTACIÓN:
  ${JSON.stringify(gasolinera, null, 2)}

  DATOS ADICIONALES/CONTEXTO:
  ${JSON.stringify(contextualData, null, 2)}

  INSTRUCCIONES:
  1. Utiliza lenguaje técnico formal y preciso.
  2. Cita las normas oficiales mexicanas aplicables (NOMs).
  3. Estructura el documento con secciones claras (Introducción, Desarrollo Técnico, Conclusiones).
  4. NO incluyas placeholders como [nombre aquí], utiliza la información proporcionada.
  5. Si falta información crucial, indica una advertencia técnica formal dentro del texto.

  Retorna el contenido en texto plano estructurado (Markdown ligero).`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });
  return response.text;
}
