
import { GoogleGenAI } from "@google/genai";

// El API Key se obtiene exclusivamente de process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateRecipeSuggestion = async (
  productName: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Crea una descripción culinaria breve y apetitosa y una lista simple de 3 ingredientes clave para un ítem del menú de restaurante llamado "${productName}". Mantenlo en menos de 50 palabras. Formato: Descripción | Ingredientes. Responde en Español.`,
    });

    return response.text ?? "No hay sugerencias disponibles.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generando sugerencia.";
  }
};

export const generateBusinessInsights = async (
  salesData: any
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza este resumen diario de ventas para un restaurante y da 2 consejos estratégicos breves (1 frase cada uno). Responde en Español. Datos: ${JSON.stringify(salesData)}`,
    });

    return response.text ?? "No hay insights disponibles.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analizando datos.";
  }
};
