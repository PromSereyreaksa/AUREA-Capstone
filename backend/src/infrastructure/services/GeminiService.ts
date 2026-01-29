import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async testConnection(): Promise<{ status: string; message: string }> {
    try {
      if (!this.ai) {
        return { status: 'error', message: 'GEMINI_API_KEY not configured' };
      }

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Hello, test connection',
      });
      
      return { 
        status: 'success', 
        message: 'Gemini AI connection successful',
      };
    } catch (error: any) {
      return { 
        status: 'error', 
        message: `Gemini AI connection failed: ${error.message}` 
      };
    }
  }

  async extractTextFromPdf(text: string): Promise<string> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const prompt = `Extract and summarize the following PDF text:\n\n${text}`;
    
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // The response structure may have the text in different places
    const result = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return result;
  }
}
