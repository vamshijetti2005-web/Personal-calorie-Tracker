import { Router } from "express";
import { goalController } from "../controllers/goalController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../validators/common.js";
import { createGoalSchema, listGoalsQuerySchema } from "../validators/goals.js";

export const goalsRouter = Router();

goalsRouter.use(requireAuth);
goalsRouter.get("/", validate(listGoalsQuerySchema, "query"), asyncHandler(goalController.list));
goalsRouter.get("/current", asyncHandler(goalController.current));
goalsRouter.get("/:id", validate(idParamSchema, "params"), asyncHandler(goalController.getById));
goalsRouter.post("/", validate(createGoalSchema), asyncHandler(goalController.create));
goalsRouter.delete("/:id", validate(idParamSchema, "params"), asyncHandler(goalController.remove));
