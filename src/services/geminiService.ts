import { GoogleGenAI, Type } from "@google/genai";
import { Gasolinera, TipoReporte } from "../types";
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

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = (err as any)?.message ?? '';
      const is429 = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
      if (is429 && attempt < maxRetries) {
        const delay = extractRetryDelayMs(err) * (attempt + 1);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
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

// Genera el contenido principal de un reporte ambiental usando el prompt de la plantilla
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

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: `${sistemaPrompt}\n\n${contextoProyecto}\n\n${promptBase}`,
    })
  );

  return response.text;
}

// Función legacy para DocumentGenerator anterior (mantener compatibilidad)
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
