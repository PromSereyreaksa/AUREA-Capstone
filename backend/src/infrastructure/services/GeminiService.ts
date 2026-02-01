import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { ExternalServiceError, RateLimitError } from "../../shared/errors";
import { handleAndLogError, getSafeErrorMessage } from "../../shared/utils/errorUtils";

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
    const safeMessage = handleAndLogError(lastError, 'PDF extraction', '[GeminiService]');
    throw new ExternalServiceError("Gemini", safeMessage);
  }

  /**
   * Generic content generation method for custom prompts
   * Used by QuickEstimateRate and other use cases that need AI-generated content
   */
  async generateContent(prompt: string): Promise<string> {
    if (this.apiConfigs.length === 0) {
      throw new ExternalServiceError("Gemini", "No API keys configured");
    }

    let lastError: any;
    let attemptCount = 0;
    const maxAttempts = Math.min(
      3,
      this.apiConfigs.length * this.apiConfigs[0].models.length
    );

    while (attemptCount < maxAttempts) {
      try {
        const { apiKey, model } = this.getCurrentConfig();
        const client = this.clients.get(apiKey);

        if (!client) {
          throw new ExternalServiceError(
            "Gemini",
            "Failed to initialize client"
          );
        }

        const response = await client.models.generateContent({
          model,
          contents: prompt,
        });

        const responseText =
          response.text ||
          response.candidates?.[0]?.content?.parts?.[0]?.text ||
          '';

        if (!responseText) {
          throw new Error('Empty response from Gemini');
        }

        return responseText;
      } catch (error: any) {
        lastError = error;

        if (this.isRateLimitError(error)) {
          console.warn(
            `Rate limit hit on API key ${this.currentConfigIndex + 1}. Rotating to next...`
          );
          this.rotateToNextModel();
          attemptCount++;
          continue;
        }

        console.warn(
          `Error generating content: ${error.message}. Trying next...`
        );
        this.rotateToNextModel();
        attemptCount++;
      }
    }

    const safeMessage = handleAndLogError(lastError, 'Content generation', '[GeminiService]');
    throw new ExternalServiceError("Gemini", safeMessage);
  }

  /**
   * Generate content with Google Search grounding enabled
   * This allows the AI to search the internet for real-time, up-to-date information
   * 
   * @param prompt - The prompt to send to Gemini
   * @param dynamicRetrievalThreshold - Threshold for dynamic retrieval (0.0 to 1.0)
   *   Lower values = more likely to use search, higher = only when very needed
   *   Default: 0.3 (moderate - will search when helpful)
   * @returns Object with response text and grounding metadata (sources)
   */
  async generateContentWithGrounding(
    prompt: string,
    dynamicRetrievalThreshold: number = 0.3
  ): Promise<{
    text: string;
    groundingMetadata?: {
      searchQueries?: string[];
      webSearchSources?: Array<{
        uri: string;
        title: string;
      }>;
    };
  }> {
    if (this.apiConfigs.length === 0) {
      throw new ExternalServiceError("Gemini", "No API keys configured");
    }

    let lastError: any;
    let attemptCount = 0;
    const maxAttempts = Math.min(
      3,
      this.apiConfigs.length * this.apiConfigs[0].models.length
    );

    while (attemptCount < maxAttempts) {
      try {
        const { apiKey, model } = this.getCurrentConfig();
        const client = this.clients.get(apiKey);

        if (!client) {
          throw new ExternalServiceError(
            "Gemini",
            "Failed to initialize client"
          );
        }

        // Use Google Search grounding tool
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            tools: [
              {
                googleSearch: {}
              }
            ],
            // Dynamic retrieval config - determines when to use search
            // Lower threshold = more aggressive searching
          }
        });

        const responseText =
          response.text ||
          response.candidates?.[0]?.content?.parts?.[0]?.text ||
          '';

        if (!responseText) {
          throw new Error('Empty response from Gemini with grounding');
        }

        // Extract grounding metadata from response
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        
        // Parse search sources if available
        let webSearchSources: Array<{ uri: string; title: string }> = [];
        let searchQueries: string[] = [];

        if (groundingMetadata) {
          // Extract web search queries used
          if (groundingMetadata.webSearchQueries) {
            searchQueries = groundingMetadata.webSearchQueries;
          }

          // Extract grounding chunks (sources)
          if (groundingMetadata.groundingChunks) {
            webSearchSources = groundingMetadata.groundingChunks
              .filter((chunk: any) => chunk.web)
              .map((chunk: any) => ({
                uri: chunk.web.uri || '',
                title: chunk.web.title || ''
              }));
          }
        }

        console.log(`[Gemini Grounding] Searched: ${searchQueries.length} queries, Found: ${webSearchSources.length} sources`);

        return {
          text: responseText,
          groundingMetadata: {
            searchQueries,
            webSearchSources
          }
        };
      } catch (error: any) {
        lastError = error;

        // Check if grounding is not supported for this model/region
        if (error.message?.includes('grounding') || error.message?.includes('google_search')) {
          console.warn(`Google Search grounding not available: ${error.message}. Falling back to regular generation.`);
          // Fallback to regular generation without grounding
          const fallbackResult = await this.generateContent(prompt);
          return {
            text: fallbackResult,
            groundingMetadata: {
              searchQueries: [],
              webSearchSources: [{ uri: 'AI Training Data', title: 'Gemini Knowledge Base (No live search available)' }]
            }
          };
        }

        if (this.isRateLimitError(error)) {
          console.warn(
            `Rate limit hit on API key ${this.currentConfigIndex + 1} (grounding). Rotating to next...`
          );
          this.rotateToNextModel();
          attemptCount++;
          continue;
        }

        console.warn(
          `Error generating content with grounding: ${error.message}. Trying next...`
        );
        this.rotateToNextModel();
        attemptCount++;
      }
    }

    const safeMessage = handleAndLogError(lastError, 'Grounded content generation', '[GeminiService]');
    throw new ExternalServiceError("Gemini", safeMessage);
  }

  /**
   * Validate onboarding answer using AI with retry logic
   * Returns structured validation result with feedback
   */
  async validateOnboardingAnswer(
    question: string,
    answer: string,
    expectedType: string,
    validationRules?: {
      min?: number;
      max?: number;
      pattern?: string;
      required?: boolean;
    }
  ): Promise<{
    is_valid: boolean;
    normalized_value: any;
    feedback?: string;
  }> {
    if (this.apiConfigs.length === 0) {
      throw new ExternalServiceError("Gemini", "No API keys configured");
    }

    let lastError: any;
    let attemptCount = 0;
    const maxAttempts = Math.min(
      3,
      this.apiConfigs.length * this.apiConfigs[0].models.length
    );

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

        // COSTAR Prompt for answer validation
        const prompt = `# CONTEXT
You are validating a user's answer to an onboarding question for a freelance pricing calculator. The system collects cost data, income goals, and work preferences to calculate sustainable hourly rates using the UREA framework (Utility, Rent, Equipment, Administration).

# OBJECTIVE
Validate if the user's answer is:
1. Appropriate for the question asked
2. Matches the expected data type
3. Falls within acceptable ranges (if specified)
4. Can be normalized to a usable format

# QUESTION
${question}

# USER'S ANSWER
"${answer}"

# EXPECTED DATA TYPE
${expectedType}

# VALIDATION RULES
${validationRules ? JSON.stringify(validationRules, null, 2) : "No specific constraints"}

# RESPONSE FORMAT
Return ONLY a valid JSON object (no markdown, no explanations):

{
  "is_valid": boolean (true if answer is acceptable, false otherwise),
  "normalized_value": any (cleaned/parsed value matching expected type, or null if invalid),
  "feedback": string | null (helpful message if invalid, null if valid)
}

# VALIDATION LOGIC

## Number Extraction
- "200" → 200
- "$200" → 200
- "200 USD" → 200
- "two hundred" → 200 (parse common number words)
- "around 200" → 200
- "200-300" → 250 (use midpoint for ranges)

## Boolean Recognition
- "yes", "y", "true", "1", "sure", "of course" → true
- "no", "n", "false", "0", "nope" → false

## String Cleanup
- Trim whitespace
- Convert to lowercase for enum matching
- Remove special characters if needed

## Range Validation
- If min/max specified, check: min <= normalized_value <= max
- Provide feedback if out of range: "Value must be between {min} and {max}"

## Required Field Check
- If required=true and answer is empty/null → invalid
- Feedback: "This field is required"

## Pattern Matching (if pattern provided)
- Validate against regex pattern
- Common patterns: email, phone, URL
- Feedback: "Please provide a valid {type}"

## Edge Cases
- Ambiguous answers: Ask for clarification
- Multiple values: Use first one or average
- Non-sensical answers: Mark invalid with helpful feedback
- Negative numbers when expecting positive: Mark invalid

# EXAMPLES

Example 1 - Valid Number:
Question: "What are your monthly rent/office costs?"
Answer: "$400"
Expected: "number"
Rules: { min: 0, max: 10000 }
Output: { "is_valid": true, "normalized_value": 400, "feedback": null }

Example 2 - Out of Range:
Question: "How many billable hours per month?"
Answer: "300"
Expected: "number"
Rules: { min: 40, max: 200 }
Output: { "is_valid": false, "normalized_value": null, "feedback": "Billable hours must be between 40 and 200 per month. 300 hours would mean 75 hours/week, which is unsustainable." }

Example 3 - Invalid Type:
Question: "What is your desired monthly income?"
Answer: "a lot"
Expected: "number"
Output: { "is_valid": false, "normalized_value": null, "feedback": "Please provide a specific number in USD (e.g., 1500)" }

Example 4 - Valid Enum:
Question: "What is your seniority level?"
Answer: "I'm pretty experienced, been doing this for 5 years"
Expected: "string"
Rules: { pattern: "junior|mid|senior|expert" }
Output: { "is_valid": true, "normalized_value": "senior", "feedback": null }

Now validate the user's answer and return the JSON response.`;

        const response = await client.models.generateContent({
          model,
          contents: prompt,
        });

        let responseText =
          response.text ||
          response.candidates?.[0]?.content?.parts?.[0]?.text ||
          '{"is_valid": false, "normalized_value": null, "feedback": "Failed to validate"}';

        // Remove markdown code fences if present
        responseText = responseText
          .replace(/^```json\s*\n?/, "")
          .replace(/\n?```\s*$/, "")
          .trim();

        const validationResult = JSON.parse(responseText);

        return {
          is_valid: validationResult.is_valid === true,
          normalized_value: validationResult.normalized_value,
          feedback: validationResult.feedback || undefined
        };
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

        // For parsing errors or other errors, try next API key
        console.warn(
          `Error validating answer: ${error.message}. Trying next...`,
        );
        this.rotateToNextModel();
        attemptCount++;
      }
    }

    // If all attempts failed, throw error to trigger fallback
    const safeMessage = handleAndLogError(lastError, 'Answer validation', '[GeminiService]');
    throw new ExternalServiceError("Gemini", safeMessage);
  }
}
