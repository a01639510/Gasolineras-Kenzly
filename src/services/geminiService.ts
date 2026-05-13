import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function extractGasolineraData(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
    model: "gemini-3-flash-preview",
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
    model: "gemini-3-flash-preview",
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
    model: "gemini-3-flash-preview",
    contents: `Genera una narrativa técnica formal para la Sección ${seccion} de la COA SEMARNAT ${anio} basada en estos datos: ${JSON.stringify(data)}. 
    Debe seguir los lineamientos oficiales de SEMARNAT.`,
  });
  return response.text;
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
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
}
