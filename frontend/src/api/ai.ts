import type { NutritionExtraction } from "../types";
import { request } from "./client";

export function extractNutrition(file: File) {
  const body = new FormData();
  body.append("image", file);
  return request<{ status: "ok" | "partial" | "failed"; extraction: NutritionExtraction }>(
    "/api/ai/extract",
    { method: "POST", body },
  );
}

export function sendChat(messages: Array<{ role: "user" | "assistant"; content: string }>) {
  return request<{ reply: string; toolsUsed: string[] }>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}
