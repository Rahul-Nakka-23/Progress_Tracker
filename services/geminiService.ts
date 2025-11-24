import { GoogleGenAI, Type } from "@google/genai";
import { FoodAnalysisResult } from "../types";

const getAiClient = () => {
  const apiKey = import.meta.env?.VITE_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === "REPLACE_WITH_YOUR_KEY_FOR_LOCAL_BUILD") {
    console.warn("API Key is missing. Please set VITE_API_KEY in your .env file for local development.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

const foodAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    dishName: { type: Type.STRING, description: "Name of the identified dish" },
    ingredients: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of main ingredients detected",
    },
    calories: { type: Type.NUMBER, description: "Estimated total calories for the serving shown" },
    macros: {
      type: Type.OBJECT,
      properties: {
        protein: { type: Type.NUMBER, description: "Protein in grams" },
        carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
        fat: { type: Type.NUMBER, description: "Fats in grams" },
      },
      required: ["protein", "carbs", "fat"],
    },
    micros: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          amount: { type: Type.STRING },
          unit: { type: Type.STRING },
        },
      },
      description: "Key micronutrients present (e.g., Vitamin C, Iron, Calcium)",
    },
  },
  required: ["dishName", "ingredients", "calories", "macros", "micros"],
};

export const analyzeFoodImage = async (base64Image: string): Promise<FoodAnalysisResult> => {
  const ai = getAiClient();

  // Using gemini-2.5-flash for multimodal speed and accuracy
  const model = "gemini-2.5-flash";

  const prompt = `
    Analyze this image of food (likely Indian cuisine).
    Identify the dish, its ingredients, and estimate the nutritional content for the serving size shown.
    Be conservative and realistic with calorie estimation.
    Provide micronutrients commonly associated with these ingredients.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: foodAnalysisSchema,
        systemInstruction: "You are an expert nutritionist specializing in Indian cuisine.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as FoodAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const recalculateNutrition = async (ingredientsText: string): Promise<FoodAnalysisResult> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash";

  const prompt = `
    Based on the following corrected description of a meal, calculate the nutritional values.
    User Description: "${ingredientsText}"
    
    Estimate calories, macros, and micros for a standard serving size of this description.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: foodAnalysisSchema,
        systemInstruction: "You are an expert nutritionist specializing in Indian cuisine.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as FoodAnalysisResult;
  } catch (error) {
    console.error("Gemini Recalculation Error:", error);
    throw error;
  }
};