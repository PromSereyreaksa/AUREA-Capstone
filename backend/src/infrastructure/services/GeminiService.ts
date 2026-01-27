import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { ExternalServiceError, RateLimitError } from "../../shared/errors";

interface ApiKeyConfig {
  apiKey: string;
  models: string[];
}

export class GeminiService {
  private apiConfigs: ApiKeyConfig[] = [];
  private currentConfigIndex: number = 0;
  private currentModelIndex: number = 0;
  private clients: Map<string, GoogleGenAI> = new Map();

  constructor() {
    // Load all API keys from environment variables
    const apiKey1 = process.env.GEMINI_API_KEY_1;
    const apiKey2 = process.env.GEMINI_API_KEY_2;
    const apiKey3 = process.env.GEMINI_API_KEY_3;

    const rawApiKeys = [apiKey1, apiKey2, apiKey3].filter(
      (key): key is string => Boolean(key),
    );

    if (rawApiKeys.length === 0) {
      throw new ExternalServiceError(
        "Gemini",
        "No API keys configured in environment variables",
      );
    }

    // Configure API keys with their models
    this.apiConfigs = rawApiKeys.map((apiKey) => ({
      apiKey,
      models: ["gemini-2.5-flash-lite", "gemini-3-flash-preview"],
    }));

    // Initialize clients for each API key
    this.apiConfigs.forEach((config) => {
      this.clients.set(
        config.apiKey,
        new GoogleGenAI({ apiKey: config.apiKey }),
      );
    });

    console.log(
      `Initialized GeminiService with ${rawApiKeys.length} API key(s) and ${this.apiConfigs[0].models.length} model(s)`,
    );
  }

  private getCurrentConfig(): { apiKey: string; model: string } {
    const config = this.apiConfigs[this.currentConfigIndex];
    const model = config.models[this.currentModelIndex];

    return {
      apiKey: config.apiKey,
      model,
    };
  }

  private rotateToNextModel(): void {
    const config = this.apiConfigs[this.currentConfigIndex];
    this.currentModelIndex =
      (this.currentModelIndex + 1) % config.models.length;

    // If we've cycled through all models, move to next API key
    if (this.currentModelIndex === 0) {
      this.currentConfigIndex =
        (this.currentConfigIndex + 1) % this.apiConfigs.length;
    }

    console.log(
      `Rotated to API key ${this.currentConfigIndex + 1}, Model: ${config.models[this.currentModelIndex]}`,
    );
  }

  private isRateLimitError(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || "";
    return (
      errorMessage.includes("429") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("too many requests")
    );
  }

  async testConnection(): Promise<{ status: string; message: string }> {
    try {
      if (this.apiConfigs.length === 0) {
        throw new ExternalServiceError("Gemini", "No API keys configured");
      }

      const { apiKey, model } = this.getCurrentConfig();
      const client = this.clients.get(apiKey);

      if (!client) {
        throw new ExternalServiceError("Gemini", "Failed to initialize client");
      }

      const response = await client.models.generateContent({
        model,
        contents: "Hello, test connection",
      });

      return {
        status: "success",
        message: `Gemini AI connection successful (API Key ${this.currentConfigIndex + 1}, Model: ${model})`,
      };
    } catch (error: any) {
      if (this.isRateLimitError(error)) {
        this.rotateToNextModel();
        return {
          status: "warning",
          message: `Rate limit hit. Rotated to next API key/model. Error: ${error.message}`,
        };
      }
      return {
        status: "error",
        message: `Gemini AI connection failed: ${error.message}`,
      };
    }
  }

  async extractFromPdf(pdfBuffer: Buffer): Promise<{
    projectDetails: any;
    deliverables: any[];
  }> {
    if (this.apiConfigs.length === 0) {
      throw new ExternalServiceError("Gemini", "No API keys configured");
    }

    let lastError: any;
    let attemptCount = 0;
    const maxAttempts =
      this.apiConfigs.length * this.apiConfigs[0].models.length;

    // Try each API key and model combination
    while (attemptCount < maxAttempts) {
      try {
        const { apiKey, model } = this.getCurrentConfig();
        const client = this.clients.get(apiKey);

        if (!client) {
          throw new ExternalServiceError(
            "Gemini",
            "Failed to initialize client",
          );
        }

        const base64Pdf = pdfBuffer.toString("base64");

        const prompt = `Analyze the PDF document and extract project details and deliverables. Return a JSON object with this exact structure:
{
  "projectDetails": {
    "project_name": "The main project name or title",
    "title": "A subtitle or alternative title if available, otherwise same as project_name",
    "description": "A brief description of the project",
    "duration": "Duration as a number (e.g., 30 for 30 days), or null if not found",
    "difficulty": "Project difficulty level: 'Easy', 'Medium', 'Hard', 'Complex', or null",
    "licensing": "Licensing type (e.g., 'MIT', 'Apache 2.0', 'Commercial', 'One-Time Used') or null",
    "usage_rights": "Usage rights description or restrictions or null",
    "result": "Expected outcome or deliverables summary"
  },
  "deliverables": [
    {
      "deliverable_type": "Type of deliverable",
      "quantity": "Quantity as a number"
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no additional text or markdown
- All string values should be non-empty, use null for missing fields
- quantity must be a number, not a string
- If no deliverables are found, return an empty array
- The JSON must be parseable`;

        const response = await client.models.generateContent({
          model,
          contents: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Pdf,
              },
            },
          ],
        });

        let responseText =
          response.text ||
          response.candidates?.[0]?.content?.parts?.[0]?.text ||
          '{"projectDetails":{}, "deliverables":[]}';

        // Remove markdown code fences if present
        responseText = responseText
          .replace(/^```json\s*\n?/, "")
          .replace(/\n?```\s*$/, "")
          .trim();

        const data = JSON.parse(responseText);

        // Validate and normalize project details
        const projectDetails = {
          project_name:
            data.projectDetails?.project_name || "Extracted Project",
          title:
            data.projectDetails?.title ||
            data.projectDetails?.project_name ||
            "PDF Extracted Project",
          description: data.projectDetails?.description || null,
          duration: data.projectDetails?.duration || null,
          difficulty: data.projectDetails?.difficulty || null,
          licensing: data.projectDetails?.licensing || null,
          usage_rights: data.projectDetails?.usage_rights || null,
          result: data.projectDetails?.result || "Project extracted from PDF",
        };

        // Validate and normalize deliverables
        const deliverables = Array.isArray(data.deliverables)
          ? data.deliverables
              .map((item: any) => ({
                deliverable_type: item.deliverable_type || "Other",
                quantity: parseInt(item.quantity) || 1,
              }))
              .filter((item: any) => item.deliverable_type && item.quantity > 0)
          : [
              {
                deliverable_type: "Project Deliverable",
                quantity: 1,
              },
            ];

        return { projectDetails, deliverables };
      } catch (error: any) {
        lastError = error;

        if (this.isRateLimitError(error)) {
          console.warn(
            `Rate limit hit on API key ${this.currentConfigIndex + 1}. Rotating to next...`,
          );
          this.rotateToNextModel();
          attemptCount++;
          continue;
        }

        // If it's a parsing error, throw immediately
        if (error.message.includes("Failed to parse")) {
          throw error;
        }

        // For other errors, try next API key
        console.warn(
          `Error with current API key: ${error.message}. Trying next...`,
        );
        this.rotateToNextModel();
        attemptCount++;
      }
    }

    // If we've exhausted all attempts
    throw new ExternalServiceError(
      "Gemini",
      `Failed to extract PDF after ${maxAttempts} attempts. Last error: ${lastError.message}`,
    );
  }
}
