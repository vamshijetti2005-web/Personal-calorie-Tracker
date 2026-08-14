import { z } from "zod";

export const mealTypeSchema = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACKS"]);

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

const nonNeg = (max: number) => z.coerce.number().min(0).max(max);

export const nutritionFields = {
  calories: nonNeg(10_000),
  proteinGrams: nonNeg(1_000),
  carbsGrams: nonNeg(1_000),
  fatGrams: nonNeg(1_000),
  vitaminCMg: nonNeg(10_000).optional().default(0),
  calciumMg: nonNeg(10_000).optional().default(0),
  ironMg: nonNeg(1_000).optional().default(0),
  vitaminDIU: nonNeg(10_000).optional().default(0),
  potassiumMg: nonNeg(20_000).optional().default(0),
};
