
import { GoogleGenAI, Type } from "@google/genai";

// Always use process.env.API_KEY directly for initialization as per SDK guidelines
export const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateNarrativeScript = async (poiName: string, siteContext: string, tone: 'academic' | 'storytelling' | 'hybrid') => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Génère un script de visite audioguide pour le point d'intérêt suivant : "${poiName}" situé à "${siteContext}". 
    Le ton doit être ${tone}. 
    Structure le contenu avec : une accroche émotionnelle, un fait historique majeur, et une question engageante pour le visiteur.
    Formatte la réponse en français.`,
    config: {
      temperature: 0.7,
    }
  });
  return response.text;
};

export const generatePoiQuiz = async (poiName: string, description: string) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Génère un quiz de 3 questions basé sur la description suivante pour le lieu "${poiName}": "${description}".
    Chaque question doit avoir 4 options et une seule bonne réponse.
    Réponds uniquement au format JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER }
          },
          required: ["question", "options", "correctAnswerIndex"]
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
};

/**
 * Recherche un lieu via Google Maps Grounding pour obtenir ses coordonnées et son contexte historique.
 */
export const searchLocationWithMaps = async (locationQuery: string) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Trouve les coordonnées géographiques précises (latitude et longitude) et des détails historiques pour le lieu suivant : "${locationQuery}". 
    Réponds au format JSON avec les propriétés : lat, lng, description, officialName.`,
    config: {
      tools: [{ googleMaps: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          lat: { type: Type.NUMBER },
          lng: { type: Type.NUMBER },
          description: { type: Type.STRING },
          officialName: { type: Type.STRING }
        },
        required: ["lat", "lng", "description", "officialName"]
      }
    },
  });
  
  return JSON.parse(response.text || '{}');
};

export const fetchMapsHistoricalContext = async (poiName: string, location: { lat: number, lng: number }) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Donne-moi des informations historiques précises et vérifiées sur "${poiName}" à cet emplacement (${location.lat}, ${location.lng}). Utilise Google Maps pour confirmer les détails.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: location.lat,
            longitude: location.lng
          }
        }
      }
    },
  });
  
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text,
    sources: sources.map((s: any) => s.maps?.uri).filter(Boolean)
  };
};
