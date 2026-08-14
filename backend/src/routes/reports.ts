import { Router } from "express";
import { reportController } from "../controllers/reportController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { reportQuerySchema } from "../validators/reports.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);
reportsRouter.get("/calories", validate(reportQuerySchema, "query"), asyncHandler(reportController.calories));
reportsRouter.get("/macros", validate(reportQuerySchema, "query"), asyncHandler(reportController.macros));
reportsRouter.get("/micros", validate(reportQuerySchema, "query"), asyncHandler(reportController.micros));
reportsRouter.get("/goal-vs-actual", validate(reportQuerySchema, "query"), asyncHandler(reportController.goalVsActual));
