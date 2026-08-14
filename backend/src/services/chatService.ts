import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import { entryService } from "./entryService.js";
import { goalService } from "./goalService.js";
import { reportService } from "./reportService.js";

type ChatMessage = { role: "user" | "assistant"; content: string };

type ToolCall = { name: string; arguments: Record<string, unknown> };

const SYSTEM_PROMPT = `You are Nourish, a nutrition assistant for a personal calorie tracker.
You can log meals, inspect and create goals, list diary entries, and summarize weekly nutrition.
Use tools when the user asks you to read or change their data. Do not invent logged meals or goals.
When logging a meal, collect food name, meal type (BREAKFAST/LUNCH/DINNER/SNACKS), quantity, unit, calories, and macros. Micros are optional.
Dates are UTC. Prefer YYYY-MM-DD. If the user says "today" or "this week", compute dates from the current UTC date provided in context.
After a successful write, confirm what was saved. Keep answers concise.`;

const TOOLS = [
  {
    name: "log_meal",
    description: "Create a food diary entry for the authenticated user.",
    input_schema: {
      type: "object",
      properties: {
        mealType: { type: "string", enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"] },
        foodName: { type: "string" },
        quantity: { type: "number" },
        servingUnit: { type: "string" },
        calories: { type: "number" },
        proteinGrams: { type: "number" },
        carbsGrams: { type: "number" },
        fatGrams: { type: "number" },
        vitaminCMg: { type: "number" },
        calciumMg: { type: "number" },
        ironMg: { type: "number" },
        vitaminDIU: { type: "number" },
        potassiumMg: { type: "number" },
        consumedAt: { type: "string", description: "ISO date or datetime" },
      },
      required: [
        "mealType",
        "foodName",
        "quantity",
        "servingUnit",
        "calories",
        "proteinGrams",
        "carbsGrams",
        "fatGrams",
        "consumedAt",
      ],
    },
  },
  {
    name: "list_entries",
    description: "List food entries in a date range.",
    input_schema: {
      type: "object",
      properties: {
        from: { type: "string" },
        to: { type: "string" },
        mealType: { type: "string", enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"] },
        limit: { type: "number" },
        offset: { type: "number" },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "get_current_goal",
    description: "Get the currently effective nutrition goal.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "create_goal",
    description: "Create a new timestamped goal version.",
    input_schema: {
      type: "object",
      properties: {
        dailyCalorieTarget: { type: "number" },
        proteinGrams: { type: "number" },
        carbsGrams: { type: "number" },
        fatGrams: { type: "number" },
        weightGoalKg: { type: "number" },
        effectiveFrom: { type: "string" },
      },
      required: [
        "dailyCalorieTarget",
        "proteinGrams",
        "carbsGrams",
        "fatGrams",
        "weightGoalKg",
      ],
    },
  },
  {
    name: "get_calorie_trend",
    description: "Server-side calorie aggregates by day or week.",
    input_schema: {
      type: "object",
      properties: {
        from: { type: "string" },
        to: { type: "string" },
        granularity: { type: "string", enum: ["day", "week"] },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "get_macro_breakdown",
    description: "Server-side macro aggregates by day or week.",
    input_schema: {
      type: "object",
      properties: {
        from: { type: "string" },
        to: { type: "string" },
        granularity: { type: "string", enum: ["day", "week"] },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "get_micro_summary",
    description: "Micronutrient totals and daily averages for a range.",
    input_schema: {
      type: "object",
      properties: { from: { type: "string" }, to: { type: "string" } },
      required: ["from", "to"],
    },
  },
  {
    name: "get_goal_vs_actual",
    description: "Compare daily intake against the goal version that was active that day.",
    input_schema: {
      type: "object",
      properties: { from: { type: "string" }, to: { type: "string" } },
      required: ["from", "to"],
    },
  },
];

function resolveProvider(): "openai" | "anthropic" {
  if (env.aiProvider === "openai" && env.openaiApiKey) return "openai";
  if (env.aiProvider === "anthropic" && env.anthropicApiKey) return "anthropic";
  if (env.anthropicApiKey) return "anthropic";
  if (env.openaiApiKey) return "openai";
  throw new AppError(
    503,
    "No LLM API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.",
    "AI_UNAVAILABLE",
  );
}

async function runTool(userId: string, call: ToolCall): Promise<unknown> {
  const args = call.arguments;
  switch (call.name) {
    case "log_meal":
      return entryService.create(userId, {
        mealType: args.mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS",
        foodName: String(args.foodName),
        quantity: Number(args.quantity),
        servingUnit: String(args.servingUnit),
        calories: Number(args.calories),
        proteinGrams: Number(args.proteinGrams),
        carbsGrams: Number(args.carbsGrams),
        fatGrams: Number(args.fatGrams),
        vitaminCMg: Number(args.vitaminCMg ?? 0),
        calciumMg: Number(args.calciumMg ?? 0),
        ironMg: Number(args.ironMg ?? 0),
        vitaminDIU: Number(args.vitaminDIU ?? 0),
        potassiumMg: Number(args.potassiumMg ?? 0),
        consumedAt: String(args.consumedAt),
      });
    case "list_entries":
      return entryService.list(userId, {
        from: String(args.from),
        to: String(args.to),
        mealType: args.mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS" | undefined,
        limit: args.limit,
        offset: args.offset,
      });
    case "get_current_goal":
      return goalService.current(userId);
    case "create_goal":
      return goalService.create(userId, {
        dailyCalorieTarget: Number(args.dailyCalorieTarget),
        proteinGrams: Number(args.proteinGrams),
        carbsGrams: Number(args.carbsGrams),
        fatGrams: Number(args.fatGrams),
        weightGoalKg: Number(args.weightGoalKg),
        effectiveFrom: args.effectiveFrom ? String(args.effectiveFrom) : undefined,
      });
    case "get_calorie_trend":
      return reportService.calories(
        userId,
        String(args.from),
        String(args.to),
        (args.granularity as "day" | "week") ?? "day",
      );
    case "get_macro_breakdown":
      return reportService.macros(
        userId,
        String(args.from),
        String(args.to),
        (args.granularity as "day" | "week") ?? "day",
      );
    case "get_micro_summary":
      return reportService.micros(userId, String(args.from), String(args.to));
    case "get_goal_vs_actual":
      return reportService.goalVsActual(userId, String(args.from), String(args.to));
    default:
      return { error: `Unknown tool: ${call.name}` };
  }
}

async function anthropicTurn(
  messages: Array<Record<string, unknown>>,
): Promise<{ text: string | null; toolCalls: ToolCall[]; rawAssistant: unknown }> {
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
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new AppError(502, `Anthropic request failed (${response.status})`, "AI_PROVIDER_ERROR", body);
  }
  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string; name?: string; input?: Record<string, unknown>; id?: string }>;
  };
  const text = data.content.find((b) => b.type === "text")?.text ?? null;
  const toolCalls = data.content
    .filter((b) => b.type === "tool_use" && b.name)
    .map((b) => ({ name: b.name as string, arguments: b.input ?? {}, id: b.id }));
  return { text, toolCalls: toolCalls.map(({ name, arguments: a }) => ({ name, arguments: a })), rawAssistant: data };
}

async function openaiTurn(
  messages: Array<Record<string, unknown>>,
): Promise<{ text: string | null; toolCalls: ToolCall[]; rawAssistant: unknown }> {
  const tools = TOOLS.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.2,
      tools,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new AppError(502, `OpenAI request failed (${response.status})`, "AI_PROVIDER_ERROR", body);
  }
  const data = (await response.json()) as {
    choices: Array<{
      message: {
        content?: string | null;
        tool_calls?: Array<{ function: { name: string; arguments: string } }>;
      };
    }>;
  };
  const message = data.choices[0]?.message;
  const toolCalls = (message?.tool_calls ?? []).map((call) => {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
    } catch {
      parsed = {};
    }
    return { name: call.function.name, arguments: parsed };
  });
  return { text: message?.content ?? null, toolCalls, rawAssistant: message };
}

export const chatService = {
  async reply(userId: string, history: ChatMessage[]) {
    const provider = resolveProvider();
    const today = new Date().toISOString().slice(0, 10);
    const contextualized: ChatMessage[] = [
      ...history.slice(0, -1),
      {
        role: "user",
        content: `${history[history.length - 1].content}\n\n[Context: current UTC date is ${today}]`,
      },
    ];

    if (provider === "anthropic") {
      const messages: Array<Record<string, unknown>> = contextualized.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let turn = await anthropicTurn(messages);
      const toolResults: Array<{ name: string; result: unknown }> = [];

      if (turn.toolCalls.length > 0) {
        const assistantContent = (turn.rawAssistant as { content: unknown[] }).content;
        const toolBlocks = (
          assistantContent as Array<{ type: string; id?: string; name?: string; input?: Record<string, unknown> }>
        ).filter((b) => b.type === "tool_use");

        const toolResultContent = [];
        for (const block of toolBlocks) {
          const result = await runTool(userId, {
            name: block.name as string,
            arguments: block.input ?? {},
          }).catch((err: unknown) => ({
            error: err instanceof Error ? err.message : "Tool failed",
          }));
          toolResults.push({ name: block.name as string, result });
          toolResultContent.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }

        messages.push({ role: "assistant", content: assistantContent });
        messages.push({ role: "user", content: toolResultContent });
        turn = await anthropicTurn(messages);
      }

      return {
        reply: turn.text ?? "Done.",
        toolsUsed: toolResults.map((t) => t.name),
      };
    }

    const messages: Array<Record<string, unknown>> = contextualized.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    let turn = await openaiTurn(messages);
    const toolResults: Array<{ name: string; result: unknown }> = [];

    if (turn.toolCalls.length > 0) {
      const assistant = turn.rawAssistant as {
        content?: string | null;
        tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
      };
      messages.push(assistant as Record<string, unknown>);
      for (const call of assistant.tool_calls ?? []) {
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
        } catch {
          parsed = {};
        }
        const result = await runTool(userId, { name: call.function.name, arguments: parsed }).catch(
          (err: unknown) => ({ error: err instanceof Error ? err.message : "Tool failed" }),
        );
        toolResults.push({ name: call.function.name, result });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      turn = await openaiTurn(messages);
    }

    return {
      reply: turn.text ?? "Done.",
      toolsUsed: toolResults.map((t) => t.name),
    };
  },
};
