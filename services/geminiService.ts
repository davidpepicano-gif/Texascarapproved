
import { GoogleGenAI, Type } from "@google/genai";
import { Car } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDescription = async (car: Partial<Car>): Promise<string> => {
  try {
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
    return "Error al generar la descripción con IA.";
  }
};

export const generateFleetSummary = async (cars: Car[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escribe un mensaje corto de bienvenida en ESPAÑOL para el catálogo de Texas Cars Approved. Menciona nuestro "Inventario Certificado Approved" disponible en Houston y Dallas. Usa emojis de la bandera de Texas y estrellas.`,
    });
    return response.text?.trim() || "¡Bienvenidos a Texas Cars Approved! Descubre nuestro Inventario Certificado Approved en Houston y Dallas.";
  } catch (error) {
    return "Selección exclusiva de Inventario Certificado Approved en Texas.";
  }
};

export const generateCarImage = async (car: Partial<Car>): Promise<string> => {
  try {
    const prompt = `Professional dealership photography of a ${car.make} ${car.model} ${car.year}. High-end commercial look, bright lighting, Texas dealership style background.`;
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
    throw new Error("No se encontraron datos de imagen.");
  } catch (error) {
    console.error("Error generating car image:", error);
    throw error;
  }
};
