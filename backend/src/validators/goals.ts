import { z } from "zod";
import { paginationSchema } from "./common.js";

export const createGoalSchema = z.object({
  dailyCalorieTarget: z.coerce.number().int().min(500).max(10_000),
  proteinGrams: z.coerce.number().min(0).max(1_000),
  carbsGrams: z.coerce.number().min(0).max(1_000),
  fatGrams: z.coerce.number().min(0).max(1_000),
  weightGoalKg: z.coerce.number().min(20).max(400),
  effectiveFrom: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
});

export const listGoalsQuerySchema = paginationSchema;

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
