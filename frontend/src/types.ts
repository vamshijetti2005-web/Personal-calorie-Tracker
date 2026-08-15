export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS'

export type Goal = {
  id: string
  dailyCalorieTarget: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  weightGoalKg: number
  effectiveFrom: string
  createdAt: string
}

export type GoalInput = {
  dailyCalorieTarget: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  weightGoalKg: number
  effectiveFrom?: string
}

export type FoodEntry = {
  id: string
  mealType: MealType
  foodName: string
  quantity: number
  servingUnit: string
  calories: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  vitaminCMg: number
  calciumMg: number
  ironMg: number
  vitaminDIU: number
  potassiumMg: number
  consumedAt: string
  createdAt: string
  updatedAt: string
}

export type EntryInput = Omit<FoodEntry, 'id' | 'createdAt' | 'updatedAt'>

export type PageResponse<T> = {
  data: T[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

export type CalorieReport = {
  granularity: 'day' | 'week'
  from: string
  to: string
  points: Array<{ periodStart: string; calories: number }>
}

export type MacroReport = {
  granularity: 'day' | 'week'
  from: string
  to: string
  points: Array<{
    periodStart: string
    proteinGrams: number
    carbsGrams: number
    fatGrams: number
  }>
}

export type Micronutrients = {
  vitaminCMg: number
  calciumMg: number
  ironMg: number
  vitaminDIU: number
  potassiumMg: number
}

export type MicronutrientReport = {
  from: string
  to: string
  dayCount: number
  totals: Micronutrients
  dailyAverages: Micronutrients
  referenceDailyTargets: Micronutrients
}

export type NutritionValues = {
  calories: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
}

export type GoalVsActualReport = {
  from: string
  to: string
  points: Array<{
    date: string
    actual: NutritionValues
    goal: NutritionValues | null
  }>
}
