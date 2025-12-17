import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateRecipeSuggestion = async (productName: string): Promise<string> => {
  if (!apiKey) return "API Key no configurada.";
  
  try {
    const model = "gemini-2.5-flash";
    const prompt = `Crea una descripción culinaria breve y apetitosa y una lista simple de 3 ingredientes clave para un ítem del menú de restaurante llamado "${productName}". Mantenlo en menos de 50 palabras. Formato: Descripción | Ingredientes. Responde en Español.`;
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    return response.text || "No hay sugerencias disponibles.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generando sugerencia.";
  }
};

export const generateBusinessInsights = async (salesData: any): Promise<string> => {
  if (!apiKey) return "API Key no configurada.";

  try {
    const model = "gemini-2.5-flash";
    const prompt = `Analiza este resumen diario de ventas para un restaurante y da 2 consejos estratégicos breves (1 frase cada uno). Responde en Español. Datos: ${JSON.stringify(salesData)}`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "No hay insights disponibles.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analizando datos.";
  }
};