import type { FoodEntry, MealType, Paginated } from "../types";
import { qs, request } from "./client";

export type EntryPayload = {
  mealType: MealType;
  foodName: string;
  quantity: number;
  servingUnit: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  vitaminCMg: number;
  calciumMg: number;
  ironMg: number;
  vitaminDIU: number;
  potassiumMg: number;
  consumedAt: string;
};

export function listEntries(params: {
  from: string;
  to: string;
  mealType?: MealType | "";
  limit?: number;
  offset?: number;
}) {
  return request<Paginated<FoodEntry>>(
    `/api/entries${qs({
      from: params.from,
      to: params.to,
      mealType: params.mealType || undefined,
      limit: params.limit,
      offset: params.offset,
    })}`,
  );
}

export function getEntry(id: string) {
  return request<{ data: FoodEntry }>(`/api/entries/${id}`);
}

export function createEntry(body: EntryPayload) {
  return request<{ data: FoodEntry }>("/api/entries", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateEntry(id: string, body: Partial<EntryPayload>) {
  return request<{ data: FoodEntry }>(`/api/entries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteEntry(id: string) {
  return request<void>(`/api/entries/${id}`, { method: "DELETE" });
}
