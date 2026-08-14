import { env } from "../config/env.js";
import { AppError, ValidationError } from "../lib/errors.js";

export type NutritionExtraction = {
  foodName: string | null;
  quantity: number | null;
  servingUnit: string | null;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  vitaminCMg: number | null;
  calciumMg: number | null;
  ironMg: number | null;
  vitaminDIU: number | null;
  potassiumMg: number | null;
  confidence: "high" | "medium" | "low";
  notes: string;
  warnings: string[];
};

const EXTRACTION_PROMPT = `You analyze a photo of either a packaged-food nutrition label or a plate of food.
Return a JSON object with exactly these keys:
- foodName (string or null)
- quantity (number or null) — numeric amount the values apply to
- servingUnit (string or null) — e.g. g, ml, cup, serving, plate
- calories (number or null)
- proteinGrams (number or null)
- carbsGrams (number or null)
- fatGrams (number or null)
- vitaminCMg (number or null)
- calciumMg (number or null)
- ironMg (number or null)
- vitaminDIU (number or null)
- potassiumMg (number or null)
- confidence ("high" | "medium" | "low")
- notes (string) — short explanation of how you estimated values
- warnings (string[]) — missing fields, guesswork, or label ambiguities

Rules:
- Use null when a value is not visible and cannot be reasonably estimated.
- For a nutrition label, prefer printed values over guesses. Convert %DV only if the nutrient amount is also printed.
- For a plate of food, estimate a single combined serving for what is shown.
- Never invent brand-specific micronutrients you cannot see. Leave those null and list them in warnings.
- confidence must be "low" if the image is blurry, not food-related, or most macros are missing.
- Numbers must be non-negative.`;

function resolveProvider(): "openai" | "anthropic" {
  if (env.aiProvider === "openai") {
    if (!env.openaiApiKey) {
      throw new AppError(503, "OPENAI_API_KEY is not configured", "AI_UNAVAILABLE");
    }
    return "openai";
  }
  if (env.aiProvider === "anthropic") {
    if (!env.anthropicApiKey) {
      throw new AppError(503, "ANTHROPIC_API_KEY is not configured", "AI_UNAVAILABLE");
    }
    return "anthropic";
  }
  if (env.anthropicApiKey) return "anthropic";
  if (env.openaiApiKey) return "openai";
  throw new AppError(
    503,
    "No vision LLM API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.",
    "AI_UNAVAILABLE",
  );
}

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseExtraction(raw: unknown): NutritionExtraction {
  if (!raw || typeof raw !== "object") {
    throw new AppError(502, "AI returned an unreadable response", "AI_PARSE_ERROR");
  }
  const obj = raw as Record<string, unknown>;
  const confidenceRaw = String(obj.confidence ?? "low");
  const confidence =
    confidenceRaw === "high" || confidenceRaw === "medium" || confidenceRaw === "low"
      ? confidenceRaw
      : "low";

  return {
    foodName: typeof obj.foodName === "string" && obj.foodName.trim() ? obj.foodName.trim() : null,
    quantity: asNumber(obj.quantity),
    servingUnit: typeof obj.servingUnit === "string" ? obj.servingUnit : null,
    calories: asNumber(obj.calories),
    proteinGrams: asNumber(obj.proteinGrams),
    carbsGrams: asNumber(obj.carbsGrams),
    fatGrams: asNumber(obj.fatGrams),
    vitaminCMg: asNumber(obj.vitaminCMg),
    calciumMg: asNumber(obj.calciumMg),
    ironMg: asNumber(obj.ironMg),
    vitaminDIU: asNumber(obj.vitaminDIU),
    potassiumMg: asNumber(obj.potassiumMg),
    confidence,
    notes: typeof obj.notes === "string" ? obj.notes : "",
    warnings: Array.isArray(obj.warnings)
      ? obj.warnings.filter((w): w is string => typeof w === "string")
      : [],
  };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new AppError(502, "AI response was not valid JSON", "AI_PARSE_ERROR");
  }
}

async function extractWithOpenAI(mime: string, base64: string): Promise<NutritionExtraction> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError(502, `OpenAI request failed (${response.status})`, "AI_PROVIDER_ERROR", body);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new AppError(502, "OpenAI returned an empty response", "AI_PARSE_ERROR");
  }
  return parseExtraction(extractJson(content));
}

async function extractWithAnthropic(mime: string, base64: string): Promise<NutritionExtraction> {
  const mediaType = mime as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: EXTRACTION_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError(
      502,
      `Anthropic request failed (${response.status})`,
      "AI_PROVIDER_ERROR",
      body,
    );
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((block) => block.type === "text")?.text;
  if (!text) {
    throw new AppError(502, "Anthropic returned an empty response", "AI_PARSE_ERROR");
  }
  return parseExtraction(extractJson(text));
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const aiService = {
  async extractFromImage(file: Express.Multer.File): Promise<{
    status: "ok" | "partial" | "failed";
    extraction: NutritionExtraction;
  }> {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      throw new ValidationError("Image must be JPEG, PNG, WebP, or GIF");
    }

    const provider = resolveProvider();
    const base64 = file.buffer.toString("base64");
    const extraction =
      provider === "openai"
        ? await extractWithOpenAI(file.mimetype, base64)
        : await extractWithAnthropic(file.mimetype, base64);

    const coreMissing =
      extraction.calories == null &&
      extraction.proteinGrams == null &&
      extraction.carbsGrams == null &&
      extraction.fatGrams == null;

    if (coreMissing || extraction.confidence === "low") {
      return { status: coreMissing ? "failed" : "partial", extraction };
    }

    const anyNullCore =
      extraction.calories == null ||
      extraction.proteinGrams == null ||
      extraction.carbsGrams == null ||
      extraction.fatGrams == null;

    return { status: anyNullCore ? "partial" : "ok", extraction };
  },
};
