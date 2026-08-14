import type { FoodEntry, Goal, User } from "@prisma/client";
import { toNumber } from "./serialize.js";

export function mapUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
  };
}

export function mapGoal(goal: Goal) {
  return {
    id: goal.id,
    userId: goal.userId,
    dailyCalorieTarget: goal.dailyCalorieTarget,
    proteinGrams: toNumber(goal.proteinGrams),
    carbsGrams: toNumber(goal.carbsGrams),
    fatGrams: toNumber(goal.fatGrams),
    weightGoalKg: toNumber(goal.weightGoalKg),
    effectiveFrom: goal.effectiveFrom.toISOString(),
    createdAt: goal.createdAt.toISOString(),
  };
}

export function mapEntry(entry: FoodEntry) {
  return {
    id: entry.id,
    userId: entry.userId,
    mealType: entry.mealType,
    foodName: entry.foodName,
    quantity: toNumber(entry.quantity),
    servingUnit: entry.servingUnit,
    calories: toNumber(entry.calories),
    proteinGrams: toNumber(entry.proteinGrams),
    carbsGrams: toNumber(entry.carbsGrams),
    fatGrams: toNumber(entry.fatGrams),
    vitaminCMg: toNumber(entry.vitaminCMg),
    calciumMg: toNumber(entry.calciumMg),
    ironMg: toNumber(entry.ironMg),
    vitaminDIU: toNumber(entry.vitaminDIU),
    potassiumMg: toNumber(entry.potassiumMg),
    consumedAt: entry.consumedAt.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}
