import { GoogleGenAI, Type } from "@google/genai";
import { ChallengeResponse, ScavengerItem, TriviaQuestion } from "../types";

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

export const generateCharadesWords = async (category: string, count: number = 12): Promise<string[]> => {
  try {
    const prompt = `Generate ${count} fun, distinct, and guessable charades words or short phrases for the category: "${category}". 
    Target audience: General party / family friendly.
    Complexity: Mix of easy and medium.
    Return ONLY a raw JSON array of strings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Gemini Charades Error:", error);
    const fallbacks = [
      "Elephant", "Pizza", "Superman", "Guitar", "Fishing", 
      "Zombie", "Ballet", "Harry Potter", "T-Rex", "Shower",
      "Tennis", "Monkey", "Vampire", "Ice Cream", "Robot",
      "Kangaroo", "Surfing", "Chef", "Pilot", "Ghost"
    ];
    return fallbacks.slice(0, count);
  }
};

export const generateScavengerHunt = async (location: string): Promise<ScavengerItem[]> => {
  try {
    const prompt = `Generate 10 distinct physical items to find in a Scavenger Hunt.
    Location Context: "${location}".
    Items should be safe to find, not destroyable, and appropriate for all ages.
    Assign a point value (1-3) based on difficulty.
    
    Return a valid JSON array of objects. Each object must have:
    - description (string)
    - emoji (string)
    - points (number)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // schema removed to prevent RPC errors with complex arrays
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const items = JSON.parse(text);
    return items.map((item: any, index: number) => ({
      ...item,
      id: `scav-${index}-${Date.now()}`,
      found: false
    }));

  } catch (error) {
    console.error("Gemini Scavenger Error:", error);
    return [
      { id: '1', description: 'A smooth round stone', emoji: '🪨', points: 1, found: false },
      { id: '2', description: 'Something red', emoji: '🔴', points: 1, found: false },
      { id: '3', description: 'A Y-shaped twig', emoji: '🌿', points: 2, found: false },
      { id: '4', description: 'A yellow flower', emoji: '🌼', points: 2, found: false },
      { id: '5', description: 'Three different leaves', emoji: '🍃', points: 3, found: false },
    ];
  }
};

export const generateTrivia = async (topic: string): Promise<TriviaQuestion[]> => {
  try {
    const prompt = `Generate 10 trivia questions about "${topic}".
    Format: Question and Answer.
    Tone: Fun, Party-style. Mix of easy and hard.
    
    Return a valid JSON array of objects. Each object must have:
    - question (string)
    - answer (string)
    - category (string)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // schema removed to prevent RPC errors with complex arrays
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as TriviaQuestion[];
  } catch (error) {
    console.error("Gemini Trivia Error:", error);
    return [
      { question: "What is the capital of France?", answer: "Paris", category: "Geography" },
      { question: "How many legs does a spider have?", answer: "Eight", category: "Nature" },
      { question: "Which planet is known as the Red Planet?", answer: "Mars", category: "Space" },
      { question: "Who lives in a pineapple under the sea?", answer: "SpongeBob", category: "Cartoons" },
      { question: "What is the largest mammal?", answer: "Blue Whale", category: "Nature" },
    ];
  }
};