export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS";

export type User = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
};

export type Goal = {
  id: string;
  userId: string;
  dailyCalorieTarget: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  weightGoalKg: number;
  effectiveFrom: string;
  createdAt: string;
};

export type FoodEntry = {
  id: string;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  data: T[];
  pagination: { limit: number; offset: number; total: number };
};

export type CalorieReport = {
  granularity: "day" | "week";
  from: string;
  to: string;
  points: Array<{ period: string; calories: number }>;
};

export type MacroReport = {
  granularity: "day" | "week";
  from: string;
  to: string;
  points: Array<{
    period: string;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  }>;
};

export type MicroReport = {
  from: string;
  to: string;
  dayCount: number;
  totals: MicroTotals;
  dailyAverages: MicroTotals;
  referenceDailyTargets: MicroTotals;
};

export type MicroTotals = {
  vitaminCMg: number;
  calciumMg: number;
  ironMg: number;
  vitaminDIU: number;
  potassiumMg: number;
};

export type GoalVsActualReport = {
  from: string;
  to: string;
  points: Array<{
    date: string;
    actual: { calories: number; proteinGrams: number; carbsGrams: number; fatGrams: number };
    goal: { calories: number; proteinGrams: number; carbsGrams: number; fatGrams: number } | null;
  }>;
};

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

export type ApiError = {
  error: { code: string; message: string; details?: unknown };
};
