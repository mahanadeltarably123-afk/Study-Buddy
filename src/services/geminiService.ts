import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StudyContent, ChatMessage, Language } from "../types";

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

// Helper to send file to backend ingest endpoint
export const sendFileToBackend = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('http://localhost:8000/ingest', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('Failed to upload file to backend');
  }
  return await response.json();
};

// Schema for structured output
const studyContentSchema: Schema = {
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
      description: "A comprehensive technical summary of the lecture content, formatted with clear paragraphs. MUST be detailed.",
    },
    transcript: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING, description: "Time format MM:SS. For PDFs, use page numbers (e.g., 'Page 5') or '00:00' if not applicable." },
          text: { type: Type.STRING, description: "The spoken sentence or text segment." },
          isKeyPoint: { type: Type.BOOLEAN, description: "True if this segment contains a core concept from the Key Points." }
        },
        required: ["timestamp", "text"]
      },
      description: "A structured transcript broken down by sentences or logical segments, with timestamps. Only generate for audio/video.",
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
  },
  required: ["metadata", "summary", "transcript", "keyPoints", "flashcards", "quiz"],
};

export class GeminiService {
  private client: GoogleGenAI;
  private apiKey: string;
  private modelName = "gemini-2.5-flash"; 

  constructor() {
    // Vite exposes env vars via import.meta.env with VITE_ prefix
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      console.error('⚠️ VITE_GEMINI_API_KEY not found in environment variables');
    }
    
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async processLecture(file: File, language: Language = 'en'): Promise<StudyContent> {
    if (!this.apiKey) {
      throw new Error("❌ Gemini API key not found. Please set VITE_GEMINI_API_KEY in .env.local");
    }

    console.log("🚀 Processing lecture directly with Gemini AI (bypassing backend)...");
    console.log("📁 File:", file.name, "| Size:", (file.size / 1024 / 1024).toFixed(2), "MB");

    const langInstruction = language === 'ar' 
      ? "Generate ALL content in Arabic." 
      : "Generate content in English.";

    try {
      // Convert file to base64 for Gemini
      const filePart = await fileToGenerativePart(file);
      
      console.log("📤 Sending file to Gemini for processing...");

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: {
          parts: [
            filePart,
            { 
              text: `You are an advanced AI Study Assistant. Analyze this lecture file (audio, video, or PDF) and extract comprehensive study materials.

${langInstruction}

Generate a structured study knowledge base with:
1. **Metadata**: Infer a descriptive title, subject area, and 3-5 relevant tags
2. **Summary**: Write a VERY DETAILED summary (at least 3 paragraphs) covering all major concepts
3. **Transcript**: Create a structured transcript with timestamps (MM:SS format) and mark key points
4. **Key Points**: Extract 5-7 critical concepts and takeaways
5. **Flashcards**: Generate 10 high-quality study flashcards (front: question/term, back: answer/definition)
6. **Quiz**: Create 5 mixed questions (include at least 1 True/False and multiple Multiple Choice questions)

For each quiz question, provide:
- A unique ID
- Question type (multiple-choice or true-false)
- The question text
- Options array (4 for multiple-choice, 2 for true-false: ["True", "False"])
- Correct answer index (0-based)
- Detailed explanation

Output ONLY valid JSON. No markdown, no code blocks, just pure JSON.` 
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: studyContentSchema,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response from Gemini API");
      }

      console.log("✅ Gemini processing complete!");

      const data = JSON.parse(text) as any;
      
      // Inject timestamp into metadata
      const processedData: StudyContent = {
        ...data,
        metadata: {
          ...data.metadata,
          date: Date.now()
        }
      };

      console.log("📚 Generated:", processedData.metadata.title);
      console.log("📝", processedData.keyPoints.length, "key points");
      console.log("🎴", processedData.flashcards.length, "flashcards");
      console.log("❓", processedData.quiz.length, "quiz questions");

      return processedData;

    } catch (error: any) {
      console.error("❌ Error processing lecture with Gemini:", error);
      
      // Provide helpful error messages
      if (error.message?.includes('API key')) {
        throw new Error("Invalid Gemini API key. Please check your .env.local file.");
      } else if (error.message?.includes('quota')) {
        throw new Error("Gemini API quota exceeded. Please check your billing.");
      } else if (error.message?.includes('File too large')) {
        throw new Error("File is too large. Gemini supports files up to 20MB.");
      }
      
      throw new Error(`Failed to process lecture: ${error.message || 'Unknown error'}`);
    }
  }

  async chatWithDocument(file: File, history: ChatMessage[], message: string, language: Language = 'en'): Promise<string> {
    if (!this.apiKey) throw new Error("API Key not found");

    const filePart = await fileToGenerativePart(file);
    const langInstruction = language === 'ar' ? "Respond in Arabic." : "Respond in English.";
    
    const systemInstruction = `You are Buddy, a helpful RAG (Retrieval Augmented Generation) tutor. 
    Your 'Knowledge Base' is the provided audio/video file. 
    1. Answer the user's question specifically using information found in the provided media.
    2. If the answer is not in the media, state that it is not covered in the lecture.
    3. Be concise and educational.
    4. ${langInstruction}`;

    try {
        const response = await this.client.models.generateContent({
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

  async chatWithContext(context: string, history: ChatMessage[], message: string, language: Language = 'en'): Promise<string> {
    if (!this.apiKey) throw new Error("API Key not found");
    
    const langInstruction = language === 'ar' ? "Respond in Arabic." : "Respond in English.";

    const systemInstruction = `You are Buddy, an intelligent study assistant for a specific workspace.
    Your knowledge base consists of the following summaries, notes, and key points from the user's lectures and study materials in this workspace:
    
    ${context}
    
    1. Answer based on this context if possible.
    2. If the answer isn't in the context, use your general knowledge to help the student, but mention if the specific details weren't in their workspace notes.
    3. Be friendly, encouraging, and concise.
    4. ${langInstruction}`;

    try {
        const response = await this.client.models.generateContent({
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

  async translateText(text: string, targetLanguage: string = 'Arabic'): Promise<string> {
    if (!this.apiKey) throw new Error("API Key not found");
    
    const prompt = `Translate the following text to ${targetLanguage}. Maintain the formatting, tone, and technical details. Do not add any preamble or markdown.\n\nText:\n${text}`;

    try {
        const response = await this.client.models.generateContent({
            model: this.modelName,
            contents: prompt
        });

        return response.text || text;
    } catch (error) {
        console.error("Translation error:", error);
        throw error;
    }
  }

  async translateStudyContent(content: StudyContent, targetLanguage: string = 'Arabic'): Promise<StudyContent> {
      if (!this.apiKey) throw new Error("API Key not found");

      // We translate the core components: Metadata, Summary, Transcript, KeyPoints, Flashcards, Quiz.
      // We also attempt to translate the Mind Map labels if present.
      
      const prompt = `
      You are a specialized educational translator. Translate the following JSON content into ${targetLanguage}.
      
      Rules:
      1. Translate 'summary', 'keyPoints', 'metadata' (title, subject, tags).
      2. Translate 'transcript'. If it is a string, translate the text but keep timestamps. If it is an array of objects, translate the 'text' property ONLY.
      3. Translate 'flashcards' (front and back).
      4. Translate 'quiz' (question, options, explanation).
      5. If 'mindMap' is present (MermaidJS syntax), strictly translate ONLY the text labels inside the quotes (e.g., A["Text"] -> A["Translated Text"]). Do NOT change the graph structure or IDs.
      6. Output valid JSON matching the structure.
      
      Input Data:
      ${JSON.stringify({
          metadata: content.metadata,
          summary: content.summary,
          transcript: content.transcript,
          keyPoints: content.keyPoints,
          flashcards: content.flashcards,
          quiz: content.quiz,
          mindMap: content.mindMap
      })}
      `;

      try {
          const response = await this.client.models.generateContent({
              model: this.modelName,
              contents: prompt,
              config: { responseMimeType: "application/json" }
          });
          
          const translatedData = JSON.parse(response.text || "{}");
          
          return {
              ...content,
              ...translatedData,
          };
      } catch (error) {
          console.error("Study Content Translation error:", error);
          throw error;
      }
  }

  async generateMindMap(summary: string, keyPoints: string[]): Promise<string> {
      if (!this.apiKey) throw new Error("API Key not found");

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
          const response = await this.client.models.generateContent({
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