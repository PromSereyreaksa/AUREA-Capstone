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

        // COSTAR Prompt: Context, Objective, Style, Tone, Audience, Response
        const prompt = `# CONTEXT
You are an expert document analyzer specializing in extracting structured project data from various document formats. You will receive a PDF document that may contain project proposals, design briefs, work orders, client requirements, or technical specifications. These documents vary in format, structure, and completeness.

# OBJECTIVE
Extract and structure project information into a JSON format for a project management system. Your goal is to:
1. Identify the core project information (name, title, description)
2. Extract quantifiable metrics (duration, difficulty level)
3. Capture legal/licensing information if present
4. List all deliverables with their quantities
5. Handle incomplete, unstructured, or ambiguous data gracefully

# STYLE
- Analytical and precise
- Infer reasonable values from context when explicit data is missing
- Normalize terminology to standard categories
- Extract concrete deliverables, not abstract concepts

# TONE
Professional, objective, and systematic

# AUDIENCE
Backend system expecting clean, validated JSON data for database insertion

# RESPONSE FORMAT
Return ONLY a valid JSON object (no markdown, no explanations) with this exact structure:

{
  "projectDetails": {
    "project_name": string (REQUIRED: Main project identifier - extract from title, heading, or document name),
    "title": string (REQUIRED: Project subtitle, tagline, or repeat project_name if no subtitle exists),
    "description": string | null (Brief summary of project scope, objectives, or purpose. Max 500 chars. null if not found),
    "duration": number | null (Project duration in DAYS only. Convert weeks/months to days: 1 week = 7 days, 1 month = 30 days. Extract from timeline, schedule, or deadline. null if not found),
    "difficulty": string | null (MUST be one of: "Easy", "Medium", "Hard", "Complex". Infer from scope, technical requirements, team size, or timeline. null if cannot determine),
    "licensing": string | null (License type: "One-Time Used", "Limited Used", "Exclusive License", "Commercial", "MIT", "Apache 2.0", or custom license name. null if not mentioned),
    "usage_rights": string | null (Usage restrictions, distribution rights, or copyright terms. Extract from legal section or terms. null if not specified),
    "result": string | null (Expected outcomes, final deliverables summary, or project goals. null if not described)
  },
  "deliverables": [
    {
      "deliverable_type": string (REQUIRED: Specific deliverable name like "Logo Design", "Mobile App", "Marketing Brochure", "API Documentation"),
      "quantity": number (REQUIRED: Positive integer. Default to 1 if quantity not specified but deliverable exists)
    }
  ]
}

# EXTRACTION RULES

## Project Name & Title
- Look for: Document title, "Project Name:", headers, bold text at top
- If only one name exists: use it for both project_name and title
- Prefer descriptive names over generic ones ("Website Redesign" > "Project A")

## Duration Conversion
- "2 weeks" → 14 (days)
- "3 months" → 90 (days)
- "1 week" → 7 (days)
- "1 year" → 365 (days)
- "Q1 delivery" → estimate based on quarter length (90 days)
- If range given ("4-6 weeks") → use average (35 days)

## Difficulty Inference
- "Easy": Simple tasks, 1-2 deliverables, < 2 weeks, junior-level
- "Medium": Moderate complexity, 3-5 deliverables, 2-8 weeks, requires experience
- "Hard": Complex requirements, 6-10 deliverables, 2-4 months, senior-level
- "Complex": Enterprise-scale, 10+ deliverables, > 4 months, expert team

## Deliverables Extraction
- Look for: "Deliverables:", "Scope:", bullet points, numbered lists, "What we'll create:"
- Be specific: "3x Logo Variations" → { "deliverable_type": "Logo Variations", "quantity": 3 }
- Separate similar items: "5 web pages + 2 landing pages" → create 2 deliverable objects
- Ignore vague items like "quality", "satisfaction", "support" unless they're concrete services
- Common deliverable patterns:
  * Design: "Logo", "UI/UX Design", "Brand Guidelines", "Mockups", "Wireframes"
  * Development: "Website", "Mobile App", "API", "Database Schema", "Backend Service"
  * Content: "Blog Posts", "Marketing Copy", "Documentation", "Video Scripts"
  * Marketing: "Social Media Posts", "Ad Campaigns", "Email Templates", "Presentations"

## Handling Edge Cases
- Missing project name: Use "Untitled Project" or derive from document metadata
- No deliverables found: Return empty array []
- Ambiguous duration: Use null rather than guessing
- Multiple license types: Concatenate with " / " separator
- Conflicting information: Prefer explicit statements over implied context

## Data Quality
- All string values must be trimmed (no leading/trailing whitespace)
- Numbers must be positive integers
- Use null (not empty strings) for missing optional fields
- Ensure JSON is valid and parseable
- No HTML tags or markdown formatting in text fields

# EXAMPLES OF HANDLING VARIOUS FORMATS

Example 1 - Formal Proposal:
Input: "PROJECT: E-commerce Platform | Duration: 12 weeks | Team Size: 8 | Deliverables: (1) Product catalog with 500 items, (2) Payment gateway integration, (3) Admin dashboard"
Output: duration: 84, difficulty: "Hard", deliverables: [{"deliverable_type": "Product Catalog", "quantity": 500}, {"deliverable_type": "Payment Gateway Integration", "quantity": 1}, {"deliverable_type": "Admin Dashboard", "quantity": 1}]

Example 2 - Informal Brief:
Input: "Need a simple logo + business card design. Quick turnaround - about a week"
Output: duration: 7, difficulty: "Easy", deliverables: [{"deliverable_type": "Logo Design", "quantity": 1}, {"deliverable_type": "Business Card Design", "quantity": 1}]

Example 3 - Incomplete Data:
Input: "Brand refresh project. Modern, minimalist aesthetic."
Output: duration: null, difficulty: null, description: "Brand refresh project with modern, minimalist aesthetic", deliverables: []

Now analyze the provided PDF document and extract the project information following these rules exactly.`;

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
