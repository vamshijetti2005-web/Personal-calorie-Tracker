import type { CalorieReport, GoalVsActualReport, MacroReport, MicroReport } from "../types";
import { qs, request } from "./client";

export function calorieReport(from: string, to: string, granularity: "day" | "week") {
  return request<CalorieReport>(`/api/reports/calories${qs({ from, to, granularity })}`);
}

export function macroReport(from: string, to: string, granularity: "day" | "week") {
  return request<MacroReport>(`/api/reports/macros${qs({ from, to, granularity })}`);
}

export function microReport(from: string, to: string) {
  return request<MicroReport>(`/api/reports/micros${qs({ from, to })}`);
}

export function goalVsActualReport(from: string, to: string) {
  return request<GoalVsActualReport>(`/api/reports/goal-vs-actual${qs({ from, to })}`);
}
