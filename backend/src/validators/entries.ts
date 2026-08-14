import { z } from "zod";
import { mealTypeSchema, nutritionFields, paginationSchema } from "./common.js";

export const createEntrySchema = z.object({
  mealType: mealTypeSchema,
  foodName: z.string().trim().min(1).max(160),
  quantity: z.coerce.number().positive().max(10_000),
  servingUnit: z.string().trim().min(1).max(40),
  ...nutritionFields,
  consumedAt: z.string().datetime({ offset: true }).or(z.string().date()),
});

export const updateEntrySchema = createEntrySchema.partial();

export const listEntriesQuerySchema = paginationSchema.extend({
  from: z.string().min(1),
  to: z.string().min(1),
  mealType: mealTypeSchema.optional(),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
