import { GoogleGenAI, Type } from "@google/genai";
import { PromptOptions, OptimizedResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ImageInput {
  data: string; // Base64 raw string
  mimeType: string;
}

export const optimizePrompt = async (
  inputText: string, 
  images: ImageInput[],
  options: PromptOptions
): Promise<OptimizedResult> => {
  
  // Use gemini-2.5-flash for multimodal capabilities
  const modelName = 'gemini-2.5-flash';

  const systemInstruction = `
    Eres un Director de Cine Galardonado y experto en Ingeniería de Prompts para medios visuales.
    Tu objetivo es transformar ideas vagas (y referencias visuales si las hay) en instrucciones cinematográficas precisas y evocadoras.

    CONTEXTO DE SALIDA:
    1. **Si es VISUAL_PROMPT (Para IA de Video/Imagen):**
       - Si el usuario proporciona IMÁGENES DE REFERENCIA: Analiza su estilo, iluminación, paleta de colores y composición. Incorpora estos elementos visuales explícitamente en el prompt de texto generado.
       - Debes especificar: Sujeto, Acción, Entorno, Iluminación (ej. Golden Hour, Neon, Chiaroscuro), Estilo de Cámara (ej. Anamorphic lens, Dolly zoom, 35mm film grain), Paleta de Colores y Referencias a Directores si aplica.
       - **LENTE/ÓPTICA:** El usuario ha elegido explícitamente el lente: "${options.lens}". Asegúrate de describir cómo afecta esto a la imagen (profundidad de campo, distorsión, ángulo de visión).
       - El prompt debe ser denso, descriptivo y visualmente rico.
       - Si el idioma es Inglés, usa terminología técnica de cine en inglés (e.g., "Depth of field", "Bokeh", "Color Grading").

    2. **Si es SCREENPLAY_SCENE (Guion):**
       - Usa formato estricto de guion (Sluglines INT./EXT., Nombres de personajes en mayúsculas, Diálogos, Acotaciones).
       - Enfócate en "Show, Don't Tell".

    3. **Si es SYNOPSIS (Sinopsis):**
       - Escribe un resumen narrativo completo de la historia estructurado claramente (Inicio, Desarrollo/Nudo y Desenlace).
       - Usa tiempo PRESENTE y tercera persona.
       - Céntrate en el arco del protagonista, los obstáculos principales y la resolución.
       - No uses lenguaje de marketing (como "prepárate para ver..."), narra la historia objetivamente.

    4. **Si es LOGLINE/STORY:**
       - Sigue estructuras narrativas probadas (Inciting Incident, Climax).

    REGLAS:
    - Interpreta la intención artística del usuario basándote en su texto y sus imágenes de referencia.
    - Eleva el nivel de sofisticación del lenguaje cinematográfico.
    
    SALIDA JSON:
    - optimizedPrompt: El resultado final.
    - explanation: "Nota del Director". Explica brevemente las decisiones artísticas (iluminación, lentes, tono) que tomaste y cómo integraste las referencias visuales.
  `;

  const textPrompt = `
    Idea del Usuario: "${inputText}"
    
    ${images.length > 0 ? `[NOTA: El usuario ha adjuntado ${images.length} imágenes de referencia visual. Úsalas para definir la estética, iluminación y composición del resultado.]` : ''}

    Configuración de Producción:
    - Estilo/Género: ${options.tone}
    - Formato de Salida: ${options.structure}
    - Lente / Óptica: ${options.lens}
    - Idioma del Prompt: ${options.language}
    - Incluir Referencias Visuales (Few-Shot): ${options.includeExamples ? "Sí" : "No"}
    
    ¡Acción! Genera el contenido cinematográfico optimizado.
  `;

  // Construct parts for multimodal request
  const parts: any[] = [{ text: textPrompt }];
  
  // Add images to parts if they exist
  images.forEach(img => {
    parts.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data
      }
    });
  });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: parts }, // Correct structure for multimodal
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimizedPrompt: {
              type: Type.STRING,
              description: "El prompt visual o guion final."
            },
            explanation: {
              type: Type.STRING,
              description: "Notas del director sobre la técnica y estilo aplicados."
            }
          },
          required: ["optimizedPrompt", "explanation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Corte. No hubo respuesta de la IA.");

    const jsonResponse = JSON.parse(text);

    return {
      originalText: inputText,
      optimizedPrompt: jsonResponse.optimizedPrompt,
      explanation: jsonResponse.explanation
    };

  } catch (error) {
    console.error("Error en producción:", error);
    throw new Error("Error en el set. Por favor intenta otra toma.");
  }
};