import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { ExternalServiceError, RateLimitError, ValidationError } from "../../shared/errors";
import { handleAndLogError, getSafeErrorMessage } from "../../shared/utils/errorUtils";
import { 
  sanitizeForAIPrompt, 
  sanitizeSkillsInput, 
  sanitizeRegionInput 
} from '../../shared/utils/sanitization';

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
      models: ["gemini-3-flash-preview", "gemini-2.5-flash"],
      // models:["gemini-2.5-flash"],
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
    metadata?: { model: string };
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
      "deliverable_type": string (REQUIRED: Category/group name like "Brand Identity System", "Website Development", "Marketing Collateral"),
      "quantity": number (REQUIRED: How many of this deliverable category. Usually 1 for a grouped deliverable),
      "items": string[] (REQUIRED: List of specific sub-items/components included in this deliverable. E.g., ["Primary logo", "Secondary logo", "Color palette", "Typography system"])
    }
  ]
}

# DELIVERABLE GROUPING STRATEGY (CRITICAL)
Group related items into DELIVERABLE CATEGORIES, not individual items:

## CORRECT Approach (Group by Category):
- "Brand Identity System" (quantity: 1) with items: ["Primary logo", "Secondary logo", "Logo icon/mark", "Color palette", "Typography system", "Visual elements"]
- "Brand Guidelines" (quantity: 1) with items: ["Logo usage rules", "Color usage guidelines", "Typography hierarchy", "Brand tone & personality", "Application examples"]
- "Marketing Collateral" (quantity: 1) with items: ["Business card design", "Email signature", "Letterhead"]
- "Social Media Kit" (quantity: 1) with items: ["Reusable post templates", "Editable story templates", "Profile images"]
- "Final Asset Delivery" (quantity: 1) with items: ["Source files (AI/Figma)", "Exported assets (PNG/SVG/PDF)", "Guidelines document"]

## WRONG Approach (Individual Items):
❌ Don't create separate deliverables for each item:
- "Primary logo" (quantity: 1)
- "Secondary logo" (quantity: 1)  
- "Color palette" (quantity: 1)

## AVOID THIN DELIVERABLES (IMPORTANT)
❌ Don't create deliverables with only 1-2 items. Either:
- Merge small deliverables into related categories
- Expand with implied/standard items that professionals would include

Example: "Favicon" alone is too thin → merge into "Brand Identity System" or expand "Digital Assets" to include: ["Favicon", "App icon", "Social preview image (OG image)"]

## Grouping Rules:
1. **Visual Identity items** → group under "Brand Identity"
   - Logos (primary, secondary, icon/mark), colors, typography, patterns, visual elements
   - Include favicon, app icons here if no separate digital assets category
2. **Guidelines/Documentation** → group under "/* The above code is a comment in TypeScript, indicating
that it is related to Brand Guidelines. It also
includes a question asking what the code is doing. */
Brand Guidelines" or "Style Guide"
   - Logo usage rules (sizing, spacing, do's & don'ts)
   - Color usage guidelines
   - Typography hierarchy (headings, body, captions)
   - Brand tone & personality
   - Application examples (social, print, digital previews)
   - Even if client doesn't explicitly list all these, INCLUDE them - they're implied for any brand guidelines
3. **Marketing materials** → group under "Marketing Collateral"
   - Business cards, letterhead, email signatures, presentations
4. **Social media** → group under "Social Media Kit" or "Social Media Assets"
   - Use "Reusable" or "Editable" prefix for templates (shows value)
   - Post templates, story templates, profile images, cover images
5. **Digital assets** → group under "Digital Assets" or "Web Assets"
   - Only create if 3+ items; otherwise merge into Brand Identity
   - Favicon, app icons, OG images, email headers
6. **Final files/exports** → ALWAYS include "Final Asset Delivery" deliverable
   - Source files (AI, PSD, Figma, etc.)
   - Exported assets (PNG, JPG, SVG, PDF)
   - Guidelines/documentation PDF
   - This protects freelancers and sets clear expectations

## Quantity Rules for Grouped Deliverables:
- If the category appears once → quantity: 1
- If explicitly multiple packages (e.g., "3 brand identity packages") → quantity: 3
- The items array captures WHAT is included, not HOW MANY

## SMART INFERENCE (Be a Helpful AI, Not Just Literal)
When client implies something but doesn't explicitly list it, INCLUDE it:
- "so we don't mess it up later" → implies they need Brand Guidelines with usage rules
- "something we can reuse easily" → templates should be labeled "Reusable" or "Editable"
- "clean and professional" → implies they want organized final file delivery
- Any branding project → ALWAYS include "Final Asset Delivery" even if not mentioned

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

## Duration Inference for Vague Timelines (IMPORTANT)
When timeline is vague, INFER a reasonable duration based on context:
- "ASAP" or "urgent" → 7 days (minimum viable timeline)
- "soon" or "quickly" → 14 days
- "flexible" or "when ready" → 30 days (standard project)
- "a couple weeks" → 14 days
- "a few weeks" → 21 days
- "a couple months" → 60 days
- "depends on scope" → infer from deliverable count:
  * 1-2 deliverables → 14 days
  * 3-5 deliverables → 30 days
  * 6-10 deliverables → 60 days
  * 10+ deliverables → 90 days
- NO explicit timeline but has deliverables → estimate based on complexity and deliverable count
- Only use null if absolutely no timeline hints AND cannot infer from scope

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

## BUDGET & ITEMIZED LIST EXTRACTION (CRITICAL)
When the document contains budget tables, cost breakdowns, or itemized lists:

1. **Extract EVERY line item as a deliverable** - each row in a budget table is a deliverable
2. **Look for quantity indicators:**
   - "5x screens" → quantity: 5
   - "Set of 10 icons" → quantity: 10
   - "8 API endpoints" → quantity: 8
   - "Phase 1, Phase 2, Phase 3" → 3 separate deliverables OR one with quantity: 3
   - "Module A, Module B, Module C" → count each module

3. **Budget table patterns to extract:**
   - Each "Description" or "Item" column entry = 1 deliverable
   - "Qty" or "Quantity" column = quantity value
   - Sum up sub-items under each category

4. **Phase-based documents:**
   - Count deliverables in EACH phase separately
   - Phase 1 deliverables + Phase 2 deliverables + ... = total
   - Example: "Phase 1: 5 screens, Phase 2: 8 screens" → [{"deliverable_type": "Phase 1 Screens", "quantity": 5}, {"deliverable_type": "Phase 2 Screens", "quantity": 8}]

5. **Training & Documentation:**
   - "Training materials" = count individual items (manuals, videos, guides)
   - "User guides (3)" → quantity: 3
   - "Video tutorials x5" → quantity: 5

6. **Module/Component counting:**
   - "Inventory Module" = 1 deliverable
   - "Reporting Dashboard" = 1 deliverable
   - "Admin Panel" = 1 deliverable
   - Count EACH named module/component separately

7. **BE EXHAUSTIVE with budget documents:**
   - When in doubt, INCLUDE the item as a deliverable
   - Better to over-extract than under-extract for budget docs
   - If a document has 50+ line items, expect 30-50 deliverables

## CRITICAL: Handling Vague/Incomplete Documents
- DO NOT invent deliverables that aren't explicitly mentioned
- If the document only has vague descriptions like "something for our company" or "similar to competitor", return empty deliverables array []
- Generic phrases like "design", "development", "solution" are NOT deliverables unless they specify WHAT is being designed/developed
- If you cannot identify specific, concrete deliverables, return []
- Better to return fewer accurate deliverables than many guessed ones

## Handling Edge Cases
- Missing project name: Use "Untitled Project" or derive from document metadata
- No deliverables found: Return empty array []
- Ambiguous duration: Infer from scope/deliverables rather than using null (see Duration Inference section)
- Multiple license types: Concatenate with " / " separator
- Conflicting information: Prefer explicit statements over implied context

## Default Values (when not explicitly mentioned)
- licensing: If no license mentioned AND project is clearly commercial with defined scope → "Standard License". For vague/undefined projects → null
- usage_rights: If no usage rights mentioned, infer from context:
  * Business/commercial project with clear scope → "Commercial Use"
  * Personal project → "Personal Use"
  * Client work → "Client Ownership"
  * Vague/undefined projects → null
- difficulty: Try to infer from scope, but use null if document is too vague to determine
- duration: Try to infer from context, but use null if no timeline hints exist

## IMPORTANT: Conservative Extraction for Vague Documents
If a document lacks specific details, prefer returning null/empty over guessing:
- No clear project name → use document title or "Untitled Project"
- No specific deliverables listed → return empty array []
- No timeline mentioned → null (don't guess)
- Vague scope description → null for difficulty
- No licensing terms → null

## Data Quality
- All string values must be trimmed (no leading/trailing whitespace)
- Numbers must be positive integers
- Use null (not empty strings) for missing optional fields
- Ensure JSON is valid and parseable
- No HTML tags or markdown formatting in text fields
- IMPORTANT: deliverable_type MUST be 100 characters or less - use concise names
  * Bad: "Complete Brand Identity Package Including Logo, Business Cards, and Letterhead Design"
  * Good: "Brand Identity Package"
  * Bad: "Custom E-commerce Website with Shopping Cart and Payment Integration"
  * Good: "E-commerce Website"

# EXAMPLES OF HANDLING VARIOUS FORMATS

Example 1 - Formal Proposal:
Input: "PROJECT: E-commerce Platform | Duration: 12 weeks | Team Size: 8 | Deliverables: (1) Product catalog with 500 items, (2) Payment gateway integration, (3) Admin dashboard"
Output: duration: 84, difficulty: "Hard", deliverables: [{"deliverable_type": "Product Catalog", "quantity": 500}, {"deliverable_type": "Payment Gateway Integration", "quantity": 1}, {"deliverable_type": "Admin Dashboard", "quantity": 1}]

Example 2 - Informal Brief:
Input: "Need a simple logo + business card design. Quick turnaround - about a week"
Output: duration: 7, difficulty: "Easy", deliverables: [{"deliverable_type": "Logo Design", "quantity": 1}, {"deliverable_type": "Business Card Design", "quantity": 1}]

Example 3 - Incomplete/Vague Data (BE CONSERVATIVE):
Input: "We need something for our company. It should be modern and professional. Similar to what our competitor has but better."
Output: project_name: "Company Project", title: "Project Proposal", duration: null, difficulty: null, licensing: null, usage_rights: null, deliverables: []
Note: No specific deliverables mentioned, so return empty array. Don't invent "Website" or "Design" from vague descriptions.

Example 4 - Partially Defined:
Input: "Brand refresh project. Modern, minimalist aesthetic. Need new logo and business cards."
Output: duration: null, difficulty: "Easy", deliverables: [{"deliverable_type": "Logo Design", "quantity": 1}, {"deliverable_type": "Business Cards", "quantity": 1}]
Note: Only extract explicitly mentioned deliverables (logo, business cards), not inferred ones.

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
                items: Array.isArray(item.items) ? item.items.filter((i: any) => i && typeof i === 'string') : []
              }))
              .filter((item: any) => item.deliverable_type && item.quantity > 0)
          : [
              {
                deliverable_type: "Project Deliverable",
                quantity: 1,
                items: []
              },
            ];

        return { 
          projectDetails, 
          deliverables,
          metadata: { model }
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
   * Analyze a portfolio and infer structured signals only (no pricing).
   * Supports three input modes:
   *   1. portfolio_url  → uses Google Search grounding to look up the page
   *   2. portfolio_pdf  → sends PDF buffer as inline data to Gemini
   *   3. portfolio_text → plain text analysis (original mode)
   */
  async analyzePortfolioSignals(input: {
    portfolioUrl?: string;
    portfolioText?: string;
    portfolioPdf?: Buffer;
  }): Promise<any> {
    if (this.apiConfigs.length === 0) {
      throw new ExternalServiceError("Gemini", "No API keys configured");
    }

    // Validate URL format if provided (must start with http(s)://)
    let sanitizedUrl: string | undefined;
    if (input.portfolioUrl) {
      const trimmedUrl = input.portfolioUrl.trim();
      if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
        throw new ExternalServiceError("Gemini", "portfolio_url must be a valid HTTP(S) URL");
      }
      sanitizedUrl = sanitizeForAIPrompt(trimmedUrl, 300);
    }

    // Strip HTML tags and limit text before sanitization
    let sanitizedText: string | undefined;
    if (input.portfolioText) {
      const stripped = input.portfolioText
        .replace(/<[^>]*>/g, ' ')          // Strip HTML tags
        .replace(/&[a-zA-Z]+;/g, ' ')      // Strip HTML entities
        .replace(/\n{4,}/g, '\n\n\n')      // Collapse excessive newlines
        .replace(/[ \t]{3,}/g, '  ');       // Collapse excessive whitespace
      sanitizedText = sanitizeForAIPrompt(stripped, 2000);
    }

    // Determine analysis mode
    const hasPdf = input.portfolioPdf && input.portfolioPdf.length > 0;
    const hasUrl = !!sanitizedUrl;
    const hasText = !!sanitizedText;

    // Build the common prompt (without the input section — that varies per mode)
    const basePrompt = `# CONTEXT
You are analyzing a designer's portfolio to generate structured signals for a pricing/recommendation system.
Ignore any existing user data (pricing profile, previous projects, reviews, etc.).
Use ONLY the portfolio content provided (PDF, text, or URL).

# OBJECTIVE
Examine the portfolio and extract the following structured signals.
Be conservative if the evidence is weak, and avoid assumptions beyond the portfolio content.

Signals to extract:
1. seniority_level: junior | mid | senior — based on quality, complexity, variety, and completeness of work
2. skill_areas: 3-8 specific design skills (e.g., logo design, banner design, UI/UX, illustration, branding)
3. specialization: a single short phrase describing main focus (null if unclear)
4. portfolio_quality_tier: low | medium | high — based on design consistency, professionalism, and polish
5. client_readiness: startup | sme | corporate | ngo | government — estimate type of clients the designer can serve
6. confidence: low | medium | high — your confidence in the above assessments
7. market_benchmark_category: short category name (e.g., "Graphic Design – Logo", "UI/UX Design")
8. summary: a concise narrative summarizing portfolio strengths and weaknesses
9. evidence: list 2-4 portfolio examples that support your conclusions
10. limitations: list 1-3 factors limiting your confidence (missing data, unclear skills, weak samples)
11. follow_up_questions: 1-2 questions to clarify low-confidence areas (empty if confidence is medium/high)

# LOW-CONFIDENCE HANDLING
- If you cannot confidently determine any of the signals (confidence = low), ask 1-2 clarifying questions, such as:
    - "How many years of experience do you have?"
    - "What is your primary type of design work (logo, banner, UI, etc.)?"
- Do NOT fabricate data — if information is missing, set fields to null.
- If confidence is medium or high, leave follow_up_questions as an empty array.

# RULES
- Do NOT include any prices, rates, or financial advice.
- Do NOT apply multipliers, scoring formulas, or business logic.
- Use only the portfolio content provided.
- If portfolio content is weak or missing, set confidence to "low".
- Only return valid JSON with the exact structure below.

# RESPONSE FORMAT
Return ONLY valid JSON in this structure:

{
  "seniority_level": "junior" | "mid" | "senior",
  "skill_areas": ["string", "string", "..."],
  "specialization": "string" | null,
  "portfolio_quality_tier": "low" | "medium" | "high" | null,
  "client_readiness": "startup" | "sme" | "corporate" | "ngo" | "government" | null,
  "confidence": "low" | "medium" | "high",
  "market_benchmark_category": "string" | null,
  "summary": "string",
  "evidence": ["string", "string", "..."],
  "limitations": ["string", "string", "..."],
  "follow_up_questions": ["string", "..."] | []
}
`;

    // ── Mode A: URL → Google Search grounding ──────────────
    if (hasUrl && !hasPdf && !hasText) {
      return this.analyzePortfolioViaGrounding(sanitizedUrl!, basePrompt);
    }

    // ── Mode B: PDF → inline data ──────────────────────────
    if (hasPdf) {
      return this.analyzePortfolioViaPdf(input.portfolioPdf!, basePrompt, sanitizedUrl);
    }

    // ── Mode C: Text (+ optional URL as context) ───────────
    return this.analyzePortfolioViaText(
      sanitizedText || 'N/A',
      sanitizedUrl || 'N/A',
      basePrompt
    );
  }

  /**
   * Mode A: Use Google Search grounding so Gemini can look up the portfolio URL.
   */
  private async analyzePortfolioViaGrounding(url: string, basePrompt: string): Promise<any> {
    const groundedPrompt = `${basePrompt}

# PORTFOLIO INPUT
Visit and analyze the portfolio at this URL: ${url}
Use Google Search to find information about the designer/creator and their work at this URL.
If the page cannot be reached, set confidence to "low" and note the limitation.`;

    console.log(`[PortfolioAnalysis] Using Google Search grounding for URL: ${url}`);

    const result = await this.generateContentWithGrounding(groundedPrompt, 0.1);

    let responseText = result.text
      .replace(/^```json\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .trim();

    const parsed = JSON.parse(responseText);

    // Attach grounding sources as extra evidence
    if (result.groundingMetadata?.webSearchSources?.length) {
      parsed._grounding_sources = result.groundingMetadata.webSearchSources;
    }

    return parsed;
  }

  /**
   * Mode B: Send PDF buffer as inline data alongside the analysis prompt.
   */
  private async analyzePortfolioViaPdf(pdfBuffer: Buffer, basePrompt: string, url?: string): Promise<any> {
    const base64Pdf = pdfBuffer.toString('base64');
    const urlContext = url ? `\nPortfolio URL (for reference): ${url}` : '';

    const prompt = `${basePrompt}

# PORTFOLIO INPUT
Analyze the attached PDF portfolio document.${urlContext}
Extract signals from the visual design work, project descriptions, and any "About" sections.`;

    console.log(`[PortfolioAnalysis] Analyzing PDF (${(pdfBuffer.length / 1024).toFixed(0)} KB)`);

    let lastError: any;
    let attemptCount = 0;
    const maxAttempts = Math.min(3, this.apiConfigs.length * this.apiConfigs[0].models.length);

    while (attemptCount < maxAttempts) {
      try {
        const { apiKey, model } = this.getCurrentConfig();
        const client = this.clients.get(apiKey);
        if (!client) throw new ExternalServiceError("Gemini", "Failed to initialize client");

        const response = await client.models.generateContent({
          model,
          contents: [
            { text: prompt },
            { inlineData: { mimeType: 'application/pdf', data: base64Pdf } }
          ],
        });

        let responseText = response.text
          || response.candidates?.[0]?.content?.parts?.[0]?.text
          || '{}';

        responseText = responseText.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
        return JSON.parse(responseText);
      } catch (error: any) {
        lastError = error;
        if (this.isRateLimitError(error)) {
          this.rotateToNextModel();
          attemptCount++;
          continue;
        }
        this.rotateToNextModel();
        attemptCount++;
      }
    }

    const safeMessage = handleAndLogError(lastError, 'Portfolio PDF analysis', '[GeminiService]');
    throw new ExternalServiceError("Gemini", safeMessage);
  }

  /**
   * Mode C: Plain text analysis with optional URL as context string.
   */
  private async analyzePortfolioViaText(text: string, url: string, basePrompt: string): Promise<any> {
    const prompt = `${basePrompt}

# PORTFOLIO INPUT
Portfolio URL: ${url}
Portfolio Content:
${text}`;

    let lastError: any;
    let attemptCount = 0;
    const maxAttempts = Math.min(3, this.apiConfigs.length * this.apiConfigs[0].models.length);

    while (attemptCount < maxAttempts) {
      try {
        const { apiKey, model } = this.getCurrentConfig();
        const client = this.clients.get(apiKey);
        if (!client) throw new ExternalServiceError("Gemini", "Failed to initialize client");

        const response = await client.models.generateContent({
          model,
          contents: prompt,
        });

        let responseText = response.text
          || response.candidates?.[0]?.content?.parts?.[0]?.text
          || '{}';

        responseText = responseText.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
        return JSON.parse(responseText);
      } catch (error: any) {
        lastError = error;
        if (this.isRateLimitError(error)) {
          this.rotateToNextModel();
          attemptCount++;
          continue;
        }
        this.rotateToNextModel();
        attemptCount++;
      }
    }

    const safeMessage = handleAndLogError(lastError, 'Portfolio analysis', '[GeminiService]');
    throw new ExternalServiceError("Gemini", safeMessage);
  }

  /**
   * Analyze portfolio and recommend a rate using Gemini AI with UREA formula
   * This is an enhanced version that not only extracts portfolio signals but also
   * researches costs, market rates, and calculates a recommended hourly rate.
   * 
   * @param input - Portfolio content (URL/PDF/text) + optional structured user context
   * @returns Portfolio signals + rate recommendation with reasoning and cost breakdown
   */
  async analyzePortfolioAndRecommendRate(input: {
    portfolioUrl?: string;
    portfolioText?: string;
    portfolioPdf?: Buffer;
    experienceYears?: number;
    skills?: string;
    hoursPerWeek?: number;
    clientType?: string;
    region?: string;
  }): Promise<any> {
    // Sanitize inputs
    const sanitizedUrl = input.portfolioUrl
      ? sanitizeForAIPrompt(input.portfolioUrl.trim().substring(0, 500))
      : undefined;
    const sanitizedText = input.portfolioText
      ? sanitizeForAIPrompt(input.portfolioText.trim().substring(0, 10000))
      : undefined;
    const sanitizedSkills = input.skills
      ? sanitizeSkillsInput(input.skills)
      : undefined;
    const sanitizedRegion = input.region
      ? sanitizeRegionInput(input.region)
      : 'Cambodia';

    const hasUrl = !!sanitizedUrl;
    const hasPdf = !!input.portfolioPdf;
    const hasText = !!sanitizedText;

    if (!hasUrl && !hasPdf && !hasText) {
      throw new ValidationError('At least one portfolio input (URL, PDF, or text) is required');
    }

    // Build comprehensive COSTAR prompt for rate recommendation
    const contextSection = `# CONTEXT
You are an AI pricing advisor for freelance designers in Cambodia. You help calculate sustainable hourly rates using the UREA (Universal Rate Estimation Algorithm) framework.

You have access to:
1. The designer's portfolio (PDF, URL, or text description)
2. Optional user-provided context: experience years, skills, work hours, client type
3. Google Search for researching real Cambodia market data

Your job is to analyze the portfolio, research missing information, and recommend a sustainable hourly rate.`;

    const objectiveSection = `# OBJECTIVE
1. Analyze the portfolio to extract designer signals (seniority, skills, quality, specialization)
2. Research realistic costs for a freelancer in Cambodia (workspace, software, equipment, utilities)
3. Research appropriate income expectations for this skill/seniority level in Cambodia
4. Research current market rates for similar designers in Cambodia
5. Apply the UREA formula to calculate a sustainable base rate
6. Apply seniority and client context multipliers
7. Provide a recommended hourly rate with reasoning

If information is missing or unclear, ask 1-2 follow-up questions.`;

    const ureaSectionFormula = `# UREA PRICING FORMULA

**Step 1: Calculate Total Monthly Expenses**
- Workspace Costs: Rent for coworking space or home office (research typical Phnom Penh rates)
- Software/Tools: Design software subscriptions (Adobe Creative Cloud, Figma, etc.)
- Equipment: Computer, tablet, peripherals (amortized monthly cost)
- Utilities: Internet, electricity, phone
- Insurance & Taxes: If applicable
- Materials: Stock photos, fonts, mockups, etc.

**Step 2: Determine Desired Monthly Income**
Research appropriate take-home income for a ${sanitizedRegion} designer at this skill level.
Consider cost of living, industry standards, and experience level.

**Step 3: Calculate Monthly Billable Hours**
${input.hoursPerWeek ? `User works ${input.hoursPerWeek} hours/week` : 'Assume 20-30 hours/week for freelancers'}
Billable hours ≈ (Weekly hours × 4 weeks) × 0.7 (accounting for non-billable time)

**Step 4: Apply UREA Formula**
Base Hourly Rate = (Total Monthly Expenses + Desired Monthly Income) / Monthly Billable Hours

**Step 5: Apply Multipliers**
- Seniority multiplier: junior (0.8), mid (1.0), senior (1.3), expert (1.5)
- Client context multiplier: ${input.clientType || 'sme'} (startup: 0.9, sme: 1.0, corporate: 1.2, ngo: 0.85, government: 1.1)

Final Rate = Base Hourly Rate × Seniority Multiplier × Client Context Multiplier`;

    const rulesSection = `# RULES
1. Use Google Search to find REAL Cambodia market data (don't rely on assumptions)
2. Research actual coworking space costs in Phnom Penh (e.g., Impact Hub, SmallWorld, etc.)
3. Research actual software costs for designers (Adobe CC ≈ $55/mo, Figma ≈ $15/mo)
4. Be conservative with income expectations - use Cambodia local market rates, not Western rates
5. If portfolio quality is low or confidence is low, ask follow-up questions
6. Provide specific reasoning for every number you use
7. Include sources for your research (URLs when available)
8. Return rates in USD (Cambodia standard for freelance work)`;

    const userContextSection = input.experienceYears || input.skills || input.hoursPerWeek
      ? `# USER-PROVIDED CONTEXT
${input.experienceYears ? `- Experience: ${input.experienceYears} years` : ''}
${input.skills ? `- Skills: ${input.skills}` : ''}
${input.hoursPerWeek ? `- Available hours per week: ${input.hoursPerWeek}` : ''}
${input.clientType ? `- Target client type: ${input.clientType}` : ''}

Use this context to supplement your portfolio analysis. If experience/skills conflict with portfolio evidence, prefer portfolio evidence and note the discrepancy.`
      : '';

    const responseFormatSection = `# RESPONSE FORMAT
Return ONLY valid JSON with this exact structure:

{
  "seniority_level": "junior" | "mid" | "senior" | "expert",
  "skill_areas": ["string", ...],
  "specialization": "string" | null,
  "portfolio_quality_tier": "low" | "medium" | "high" | null,
  "confidence": "low" | "medium" | "high",
  "market_benchmark_category": "string" | null,
  "summary": "Brief portfolio analysis summary",
  "evidence": ["Portfolio example 1", "Portfolio example 2", ...],
  "limitations": ["Limitation 1", "Limitation 2", ...],
  "follow_up_questions": ["Question 1", "Question 2"] | [],
  "recommended_rate": {
    "hourly_rate": number,
    "rate_range": {
      "low": number,
      "high": number
    },
    "reasoning": "Detailed explanation of how you arrived at this rate"
  },
  "researched_costs": {
    "workspace": number,
    "software": number,
    "equipment": number,
    "utilities": number,
    "materials": number,
    "total_monthly": number,
    "sources": ["URL or source 1", ...]
  },
  "income_research": {
    "median_income": number,
    "income_range": {
      "low": number,
      "high": number
    },
    "sources": ["URL or source 1", ...]
  },
  "market_research": {
    "market_rate_range": {
      "low": number,
      "high": number
    },
    "sources": ["URL or source 1", ...]
  },
  "calculation_breakdown": {
    "monthly_expenses": number,
    "desired_income": number,
    "billable_hours": number,
    "base_rate": number,
    "seniority_multiplier": number,
    "client_multiplier": number,
    "final_rate": number
  }
}`;

    const basePrompt = [
      contextSection,
      objectiveSection,
      ureaSectionFormula,
      rulesSection,
      userContextSection,
      responseFormatSection
    ].filter(Boolean).join('\n\n');

    // Route to appropriate analysis mode with grounding
    if (hasUrl && !hasPdf && !hasText) {
      return this.analyzePortfolioAndRecommendRateViaGrounding(sanitizedUrl!, basePrompt);
    }
    if (hasPdf) {
      return this.analyzePortfolioAndRecommendRateViaPdf(
        input.portfolioPdf!,
        basePrompt,
        sanitizedUrl,
        sanitizedText
      );
    }
    return this.analyzePortfolioAndRecommendRateViaText(
      sanitizedText || 'N/A',
      sanitizedUrl || 'N/A',
      basePrompt
    );
  }

  /**
   * Portfolio + rate recommendation via Google Search grounding (URL mode)
   */
  private async analyzePortfolioAndRecommendRateViaGrounding(
    url: string,
    basePrompt: string
  ): Promise<any> {
    const groundedPrompt = `${basePrompt}

# PORTFOLIO INPUT
Visit and analyze the portfolio at this URL: ${url}
Use Google Search to:
1. Find information about this designer and their work
2. Research Cambodia market rates for similar designers
3. Research coworking space costs in Phnom Penh
4. Research software/tool costs for designers
5. Research appropriate income levels for designers in Cambodia

If the portfolio URL cannot be accessed, set confidence to "low" and ask for more information.`;

    const result = await this.generateContentWithGrounding(groundedPrompt, 0.1);
    let responseText = result.text.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
    const parsed = JSON.parse(responseText);
    
    // Include grounding sources in the response
    if (result.groundingMetadata?.webSearchSources?.length) {
      parsed._grounding_sources = result.groundingMetadata.webSearchSources;
      
      // Merge grounding sources into researched data sources
      if (parsed.researched_costs && !parsed.researched_costs.sources) {
        parsed.researched_costs.sources = result.groundingMetadata.webSearchSources.map(
          (s: any) => `${s.title}: ${s.uri}`
        );
      }
    }
    
    return parsed;
  }

  /**
   * Portfolio + rate recommendation via PDF with optional grounding
   */
  private async analyzePortfolioAndRecommendRateViaPdf(
    pdfBuffer: Buffer,
    basePrompt: string,
    url?: string,
    text?: string
  ): Promise<any> {
    const base64Pdf = pdfBuffer.toString('base64');
    const urlContext = url ? `\nPortfolio URL (for reference): ${url}` : '';
    const textContext = text ? `\nAdditional context: ${text.substring(0, 500)}` : '';
    
    const prompt = `${basePrompt}

# PORTFOLIO INPUT
Analyze the attached PDF portfolio document.${urlContext}${textContext}

Use Google Search to research Cambodia market data:
1. Typical coworking space costs in Phnom Penh
2. Design software subscription costs
3. Market rates for similar designers in Cambodia
4. Appropriate income levels for this skill/experience level

Extract signals from the portfolio's visual design work, project descriptions, and any "About" sections.`;

    // Try with grounding first, fallback to simple generation
    try {
      const result = await this.generateContentWithGrounding(prompt, 0.2);
      let responseText = result.text.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
      const parsed = JSON.parse(responseText);
      
      if (result.groundingMetadata?.webSearchSources?.length) {
        parsed._grounding_sources = result.groundingMetadata.webSearchSources;
      }
      
      return parsed;
    } catch (groundingError: any) {
      // Fallback to PDF inline data without grounding
      return this.analyzePortfolioViaPdfWithRateCalc(pdfBuffer, prompt);
    }
  }

  /**
   * Portfolio + rate recommendation via text with grounding
   */
  private async analyzePortfolioAndRecommendRateViaText(
    text: string,
    url: string,
    basePrompt: string
  ): Promise<any> {
    const prompt = `${basePrompt}

# PORTFOLIO INPUT
Portfolio URL: ${url}
Portfolio Content:
${text}

Use Google Search to research Cambodia market data:
1. Coworking space costs in Phnom Penh
2. Design software costs
3. Market rates for similar designers
4. Income expectations for this skill level`;

    const result = await this.generateContentWithGrounding(prompt, 0.1);
    let responseText = result.text.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
    const parsed = JSON.parse(responseText);
    
    if (result.groundingMetadata?.webSearchSources?.length) {
      parsed._grounding_sources = result.groundingMetadata.webSearchSources;
    }
    
    return parsed;
  }

  /**
   * Fallback method for PDF analysis with rate calculation (no grounding)
   */
  private async analyzePortfolioViaPdfWithRateCalc(
    pdfBuffer: Buffer,
    prompt: string
  ): Promise<any> {
    const base64Pdf = pdfBuffer.toString('base64');
    let lastError: any;
    let attemptCount = 0;
    const maxAttempts = Math.min(3, this.apiConfigs.length * this.apiConfigs[0].models.length);

    while (attemptCount < maxAttempts) {
      try {
        const { apiKey, model } = this.getCurrentConfig();
        const client = this.clients.get(apiKey);
        if (!client) throw new ExternalServiceError("Gemini", "Failed to initialize client");

        const response = await client.models.generateContent({
          model,
          contents: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Pdf
              }
            }
          ]
        });

        let responseText = response.text
          || response.candidates?.[0]?.content?.parts?.[0]?.text
          || '{}';

        responseText = responseText.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
        return JSON.parse(responseText);
      } catch (error: any) {
        lastError = error;
        if (this.isRateLimitError(error)) {
          this.rotateToNextModel();
          attemptCount++;
          continue;
        }
        this.rotateToNextModel();
        attemptCount++;
      }
    }

    const safeMessage = handleAndLogError(lastError, 'Portfolio analysis with rate calculation', '[GeminiService]');
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

  /**
   * Summarize extracted data when it's too large for database constraints.
   * Use this when:
   * - Too many deliverables (consolidate similar items)
   * - Field values exceed character limits
   * - Need to condense complex extractions
   */
  async summarizeExtraction(data: {
    projectDetails: any;
    deliverables: any[];
  }): Promise<{
    projectDetails: any;
    deliverables: any[];
    metadata?: { model: string; summarized: boolean };
  }> {
    const { apiKey, model } = this.getCurrentConfig();
    const client = this.clients.get(apiKey);

    if (!client) {
      throw new ExternalServiceError("Gemini", "Failed to initialize client");
    }

    const summarizePrompt = `# TASK: Summarize and Condense Project Data

You are given extracted project data that may be too large or detailed for database storage.
Your job is to SUMMARIZE and CONDENSE this data while preserving the essential information.

# INPUT DATA
${JSON.stringify(data, null, 2)}

# CONSTRAINTS (MUST FOLLOW)
- project_name: MAX 100 characters
- title: MAX 100 characters  
- description: MAX 500 characters
- licensing: MAX 100 characters
- usage_rights: MAX 100 characters
- result: MAX 255 characters
- deliverable_type: MAX 100 characters each
- items: MAX 100 characters each item
- deliverables array: MAX 25 categories (consolidate if more)

# SUMMARIZATION RULES

## CRITICAL: Preserve Sub-Items in "items" Array
When consolidating deliverables, ALWAYS preserve the detailed sub-items:
- The "items" array stores WHAT is included in each deliverable category
- When merging similar deliverables, MERGE their items arrays
- Never lose track of specific components/sub-items

## For Long Text Fields
- Truncate intelligently at sentence/phrase boundaries
- Keep the most important information at the beginning
- Remove redundant words and filler content

## For Too Many Deliverables (>25 categories)
Consolidate into grouped categories WITH their items:

Example Input:
- "Logo Design" (qty: 1)
- "Color Palette" (qty: 1)
- "Typography" (qty: 1)
- "Business Card" (qty: 1)

Example Output:
- "Brand Identity System" (qty: 1, items: ["Logo Design", "Color Palette", "Typography"])
- "Marketing Collateral" (qty: 1, items: ["Business Card"])

## Consolidation Priority
1. Group visual identity items → "Brand Identity System"
2. Group marketing materials → "Marketing Collateral"  
3. Group digital/web assets → "Digital Assets"
4. Group documentation → "Documentation Package"
5. Keep unique items separate if they don't fit a category

# OUTPUT FORMAT
Return ONLY valid JSON (no markdown):
{
  "projectDetails": {
    "project_name": string (max 100 chars),
    "title": string (max 100 chars),
    "description": string | null (max 500 chars),
    "duration": number | null,
    "difficulty": "Easy" | "Medium" | "Hard" | "Complex" | null,
    "licensing": string | null (max 100 chars),
    "usage_rights": string | null (max 100 chars),
    "result": string | null (max 255 chars)
  },
  "deliverables": [
    {"deliverable_type": string (max 100 chars), "quantity": number, "items": string[] (sub-components included)}
  ],
  "summary": {
    "original_deliverable_count": number,
    "condensed_deliverable_count": number,
    "consolidation_notes": string
  }
}`;

    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ text: summarizePrompt }],
      });

      let responseText =
        response.text ||
        response.candidates?.[0]?.content?.parts?.[0]?.text ||
        '{}';

      responseText = responseText
        .replace(/^```json\s*\n?/, "")
        .replace(/\n?```\s*$/, "")
        .trim();

      const summarized = JSON.parse(responseText);

      console.log(`Summarization: ${data.deliverables.length} → ${summarized.deliverables?.length || 0} deliverables`);
      if (summarized.summary?.consolidation_notes) {
        console.log(`Notes: ${summarized.summary.consolidation_notes}`);
      }

      return {
        projectDetails: summarized.projectDetails || data.projectDetails,
        deliverables: summarized.deliverables || data.deliverables,
        metadata: { model, summarized: true }
      };
    } catch (error: any) {
      console.warn(`Summarization failed: ${error.message}. Returning original data.`);
      return {
        projectDetails: data.projectDetails,
        deliverables: data.deliverables,
        metadata: { model, summarized: false }
      };
    }
  }

  /**
   * Extract from PDF with automatic summarization if needed.
   * Automatically triggers summarization when:
   * - More than 30 deliverables extracted
   * - Any field exceeds database limits
   */
  async extractFromPdfWithSummarization(pdfBuffer: Buffer): Promise<{
    projectDetails: any;
    deliverables: any[];
    metadata?: { model: string; summarized?: boolean };
  }> {
    const result = await this.extractFromPdf(pdfBuffer);
    
    // Check if summarization is needed
    const needsSummarization = 
      result.deliverables.length > 30 ||
      (result.projectDetails.project_name?.length || 0) > 100 ||
      (result.projectDetails.title?.length || 0) > 100 ||
      (result.projectDetails.description?.length || 0) > 500 ||
      (result.projectDetails.licensing?.length || 0) > 100 ||
      (result.projectDetails.usage_rights?.length || 0) > 100 ||
      result.deliverables.some((d: any) => (d.deliverable_type?.length || 0) > 100);

    if (needsSummarization) {
      console.log(`Large extraction detected (${result.deliverables.length} deliverables). Summarizing...`);
      return this.summarizeExtraction(result);
    }

    return result;
  }
}
