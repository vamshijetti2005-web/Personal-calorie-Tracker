import type { Goal, Paginated } from "../types";
import { qs, request } from "./client";

export function listGoals(limit = 20, offset = 0) {
  return request<Paginated<Goal>>(`/api/goals${qs({ limit, offset })}`);
}

export function currentGoal() {
  return request<{ data: Goal | null }>("/api/goals/current");
}

export function createGoal(body: {
  dailyCalorieTarget: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  weightGoalKg: number;
  effectiveFrom?: string;
}) {
  return request<{ data: Goal }>("/api/goals", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteGoal(id: string) {
  return request<void>(`/api/goals/${id}`, { method: "DELETE" });
}
