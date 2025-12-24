
import { GoogleGenAI } from "@google/genai";
import { Car } from "../types.ts";

export const generateDescription = async (car: Partial<Car>): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escribe una descripción de ventas irresistible para Texas Cars Approved:
        Vehículo: ${car.make} ${car.model} ${car.year}
        Ubicación: ${car.location}
        Enganche: $${car.enganche}
        
        Destaca que es "Inventario Approved" y que el enganche de $${car.enganche} es real. Máximo 60 palabras, tono profesional y entusiasta.`,
    });
    return response.text?.trim() || "Unidad certificada de nuestro Inventario Approved. Lista para entrega hoy mismo.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unidad premium certificada por Texas Cars Approved. Excelente estado y lista para su nuevo dueño.";
  }
};

export const generateCarImage = async (car: Partial<Car>): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Professional high-end dealership automotive photography of a ${car.year} ${car.make} ${car.model}. Cinematic lighting, sunset background in Texas, 4k, hyper-realistic.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } },
    });
    
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Sin datos de imagen");
  } catch (error) {
    console.error("Gemini Image Error:", error);
    return "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200";
  }
};
