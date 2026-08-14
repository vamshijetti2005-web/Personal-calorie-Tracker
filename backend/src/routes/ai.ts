import { Router } from "express";
import multer from "multer";
import { aiController } from "../controllers/aiController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const aiRouter = Router();

aiRouter.use(requireAuth);
aiRouter.post("/extract", upload.single("image"), asyncHandler(aiController.extract));
