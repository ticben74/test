
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
            recipeName: { // Note: property name doesn't matter much for internal logic if we map it correctly, but let's keep it standard
              type: Type.STRING,
            },
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

export const generateVideoWithVeo = async (prompt: string, onStatusUpdate?: (msg: string) => void) => {
  const ai = getAiClient();
  onStatusUpdate?.("Initialisation de la génération cinématographique...");
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Une reconstitution historique cinématographique de haute qualité : ${prompt}. Style documentaire patrimonial, éclairage naturel, 4k.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  const messages = [
    "L'IA analyse les archives historiques...",
    "Reconstitution des textures et de la lumière...",
    "Animation des séquences narratives...",
    "Finalisation du rendu cinématographique...",
    "Optimisation pour le streaming mobile..."
  ];

  let msgIdx = 0;
  while (!operation.done) {
    onStatusUpdate?.(messages[msgIdx % messages.length]);
    msgIdx++;
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Échec de la récupération de la vidéo.");
  
  // Return the link with the API key attached for direct access
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

/**
 * Recherche un lieu via Google Maps Grounding pour obtenir ses coordonnées et son contexte historique.
 */
export const searchLocationWithMaps = async (locationQuery: string) => {
  const ai = getAiClient();
  // Config rules when using googleMaps:
  // - Maps grounding is only supported in Gemini 2.5 series models.
  // - DO NOT set responseMimeType.
  // - DO NOT set responseSchema.
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Trouve les coordonnées géographiques précises (latitude et longitude) et des détails historiques pour le lieu suivant : "${locationQuery}". 
    Réponds au format JSON avec les propriétés : lat, lng, description, officialName.`,
    config: {
      tools: [{ googleMaps: {} }],
    },
  });
  
  // Extracting JSON manually as structured output is not allowed with Maps tool
  const text = response.text || '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const cleanJson = jsonMatch ? jsonMatch[0] : text;
  
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse location JSON", e);
    return {};
  }
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
