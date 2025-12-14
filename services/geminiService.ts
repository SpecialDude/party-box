import { GoogleGenAI, Type } from "@google/genai";
import { ChallengeResponse } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a party game facilitator for a game called "Pass the Hat" (similar to Hot Potato).
Your goal is to generate fun, safe, and engaging "penalties" or "challenges" for the person holding the object when the music stops.
Keep challenges physical, social, or silly. Avoid anything dangerous or mean-spirited.
The challenges should be doable in an outdoor picnic setting.
Keep the text short and punchy (under 20 words).
`;

export const generateChallenge = async (theme: string, previousChallenges: string[] = []): Promise<ChallengeResponse> => {
  try {
    const exclusionContext = previousChallenges.length > 0 
      ? `\nIMPORTANT: Do NOT generate any of the following challenges again:\n- ${previousChallenges.join('\n- ')}` 
      : '';

    const prompt = `Generate a single challenge for the loser of the round. 
    Theme context: ${theme || 'General Fun'}.${exclusionContext}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            challenge: {
              type: Type.STRING,
            },
            category: {
              type: Type.STRING,
            }
          },
          required: ["challenge", "category"],
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as ChallengeResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback if AI fails or no key
    return {
      challenge: "Dance like a robot for 10 seconds!",
      category: "Fallback Fun"
    };
  }
};