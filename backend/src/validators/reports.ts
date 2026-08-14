import { z } from "zod";

export const reportQuerySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  granularity: z.enum(["day", "week"]).optional().default("day"),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
