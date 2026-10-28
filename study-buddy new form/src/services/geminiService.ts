
import { GoogleGenAI, Type } from "@google/genai";
import { StudyContent, ChatMessage } from "../types";

// Helper to convert file to Base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g., "data:audio/mp3;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Schema for structured output
// FIX: Removed Schema type annotation to let TypeScript infer it.
const studyContentSchema = {
  type: Type.OBJECT,
  properties: {
    metadata: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A concise, descriptive title for the lecture." },
        subject: { type: Type.STRING, description: "The broad academic subject (e.g., Computer Science, Biology)." },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 keywords for filtering." },
      },
      required: ["title", "subject", "tags"]
    },
    summary: {
      type: Type.STRING,
      description: "A comprehensive technical summary of the lecture content.",
    },
    keyPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 5-7 critical concepts and key takeaways from the lecture.",
    },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          front: { type: Type.STRING, description: "Concept, term, or question from the lecture" },
          back: { type: Type.STRING, description: "Detailed definition or answer" },
        },
        required: ["front", "back"],
      },
      description: "A set of 10 high-quality study flashcards.",
    },
    quiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID for question" },
          type: { type: Type.STRING, enum: ["multiple-choice", "true-false"], description: "Type of question" },
          question: { type: Type.STRING },
          options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "For Multiple Choice: 4 options. For True/False: 2 options ('True', 'False')."
          },
          correctAnswerIndex: { type: Type.INTEGER, description: "Index of the correct answer (0-3 or 0-1)" },
          explanation: { type: Type.STRING, description: "Detailed explanation of why the answer is correct based on the lecture" },
        },
        required: ["question", "options", "correctAnswerIndex", "explanation", "type", "id"],
      },
      description: "A mixed quiz with 5 questions (include at least 1 True/False question).",
    },
    // Optional mindMap string could be added here if generated initially, but we are doing on-demand.
  },
  required: ["metadata", "summary", "keyPoints", "flashcards", "quiz"],
};

export class GeminiService {
  // FIX: Changed client to be nullable for lazy initialization.
  private client: GoogleGenAI | null = null;
  // FIX: Changed apiKey to be nullable for lazy initialization.
  private apiKey: string | null = null;
  private modelName = "gemini-2.5-flash"; 

  // FIX: Implemented lazy initialization for the client to ensure API key is available.
  private getClient(): GoogleGenAI {
    const key = process.env.API_KEY || '';
    if (!key) {
      throw new Error("API Key not found. Please ensure the API_KEY environment variable is set.");
    }
    
    if (this.apiKey !== key || !this.client) {
      this.apiKey = key;
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
    
    return this.client;
  }

  constructor() {
    // Client is now lazy-loaded on first API call.
  }

  async processLecture(file: File): Promise<StudyContent> {
    const client = this.getClient();

    const filePart = await fileToGenerativePart(file);

    try {
      const response = await client.models.generateContent({
        model: this.modelName,
        contents: {
            parts: [
                filePart,
                { text: "System: You are an advanced RAG (Retrieval Augmented Generation) Study Assistant. Ingest this audio/video lecture. Generate a structured study knowledge base containing metadata (title, subject, tags), a detailed summary, key conceptual points, flashcards, and a mixed quiz (Multiple Choice & True/False). Output strictly in JSON." }
            ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: studyContentSchema,
        },
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
      
      const data = JSON.parse(text) as any;
      
      // Inject timestamp into metadata manually
      const processedData: StudyContent = {
        ...data,
        metadata: {
            ...data.metadata,
            date: Date.now()
        }
      };

      return processedData;
    } catch (error) {
      console.error("Error processing lecture:", error);
      throw error;
    }
  }

  async chatWithDocument(file: File, history: ChatMessage[], message: string): Promise<string> {
    const client = this.getClient();

    const filePart = await fileToGenerativePart(file);
    
    const systemInstruction = `You are Buddy, a helpful RAG (Retrieval Augmented Generation) tutor. 
    Your 'Knowledge Base' is the provided audio/video file. 
    1. Answer the user's question specifically using information found in the provided media.
    2. If the answer is not in the media, state that it is not covered in the lecture.
    3. Be concise and educational.`;

    try {
        const response = await client.models.generateContent({
            model: this.modelName,
            contents: {
                parts: [
                    filePart,
                    ...history.map(h => ({ text: `${h.role === 'user' ? 'User' : 'Model'}: ${h.text}` })),
                    { text: `User Question: ${message}` }
                ]
            },
            config: {
                systemInstruction: systemInstruction
            }
        });

        return response.text || "I couldn't retrieve an answer from the lecture context.";
    } catch (error) {
        console.error("Chat error:", error);
        return "System Error: Unable to access vector context.";
    }
  }

  async chatWithContext(context: string, history: ChatMessage[], message: string): Promise<string> {
    const client = this.getClient();

    const systemInstruction = `You are Buddy, an intelligent study assistant for a specific workspace.
    Your knowledge base consists of the following summaries, notes, and key points from the user's lectures and study materials in this workspace:
    
    ${context}
    
    1. Answer based on this context if possible.
    2. If the answer isn't in the context, use your general knowledge to help the student, but mention if the specific details weren't in their workspace notes.
    3. Be friendly, encouraging, and concise.`;

    try {
        const response = await client.models.generateContent({
            model: this.modelName,
            contents: {
                parts: [
                    ...history.map(h => ({ text: `${h.role === 'user' ? 'User' : 'Model'}: ${h.text}` })),
                    { text: `User Question: ${message}` }
                ]
            },
            config: {
                systemInstruction: systemInstruction
            }
        });

        return response.text || "I couldn't generate a response.";
    } catch (error) {
        console.error("Chat error:", error);
        return "System Error: Unable to chat.";
    }
  }

  async generateMindMap(summary: string, keyPoints: string[]): Promise<string> {
      const client = this.getClient();

      const prompt = `
      Based on the following lecture summary and key points, create a hierarchical Mind Map using Mermaid.js graph syntax.
      
      Summary: ${summary}
      Key Points: ${keyPoints.join(', ')}

      Requirements:
      1. Use 'graph TD' (Top Down) or 'graph LR' (Left Right).
      2. Start with a central node representing the main Topic.
      3. Branch out into subtopics and details.
      4. Keep node labels concise (1-4 words max).
      5. CRITICAL: Enclose ALL node labels in double quotes to prevent syntax errors with special characters. 
         Example: A["Main Topic"] --> B["Sub-topic (Detail)"].
      6. Do not use special characters like parentheses or brackets OUTSIDE of the quotes.
      7. Return ONLY the Mermaid code. No markdown code blocks, no JSON. Just the plain text graph definition.
      `;

      try {
          const response = await client.models.generateContent({
              model: this.modelName,
              contents: prompt
          });
          
          let text = response.text;
          // Clean up if model returns markdown block
          if (text) {
             text = text.replace(/```mermaid/g, '').replace(/```/g, '').trim();
          }
          
          return text || "";
      } catch (error) {
          console.error("Mind map generation error:", error);
          throw error;
      }
  }
}

export const geminiService = new GeminiService();