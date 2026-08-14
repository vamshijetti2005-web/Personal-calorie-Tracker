import { Router } from "express";
import { chatController } from "../controllers/chatController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { chatRequestSchema } from "../validators/chat.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);
chatRouter.post("/", validate(chatRequestSchema), asyncHandler(chatController.reply));
