import type { Request, Response } from "express";
import { ValidationError } from "../lib/errors.js";
import { aiService } from "../services/aiService.js";

export const aiController = {
  async extract(req: Request, res: Response) {
    const file = req.file;
    if (!file) {
      throw new ValidationError("Upload an image file in the `image` field");
    }
    const result = await aiService.extractFromImage(file);
    res.status(200).json(result);
  },
};
