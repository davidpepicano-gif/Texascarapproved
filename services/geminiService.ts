
import { GoogleGenAI, Type } from "@google/genai";
import { Car } from "../types";

export const generateDescription = async (car: Partial<Car>): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Crea una descripción de ventas profesional para Texas Cars Approved en ESPAÑOL:
        Marca: ${car.make}
        Modelo: ${car.model}
        Tipo: ${car.type}
        Año: ${car.year}
        Ubicación: ${car.location}
        Enganche: $${car.enganche}
        Kilometraje: ${car.mileage}
        
        ES OBLIGATORIO mencionar que este vehículo es parte de nuestro "Inventario Certificado Approved". 
        ENFÓCATE en que se lo llevan con solo $${car.enganche} de enganche. Estilo directo, confiable y muy persuasivo. Máximo 80 palabras.`,
    });
    return response.text?.trim() || "Este vehículo pertenece a nuestro Inventario Certificado Approved. Listo para entrega inmediata en nuestras sedes de Texas.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "Este vehículo pertenece a nuestro Inventario Certificado Approved. Listo para entrega inmediata.";
  }
};

export const generateCarImage = async (car: Partial<Car>): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Professional high-end dealership photography of a ${car.make} ${car.model} ${car.year}. Clean studio lighting, 4k, realistic car commercial style.`;
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
    throw new Error("No image data found");
  } catch (error) {
    console.error("Error generating car image:", error);
    // Fallback image en caso de error de IA
    return "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200";
  }
};
