import type { Request, Response } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { chatService } from "../services/chatService.js";
import type { ChatRequest } from "../validators/chat.js";

export const chatController = {
  async reply(req: Request, res: Response) {
    const body = req.body as ChatRequest;
    const result = await chatService.reply((req as AuthedRequest).user.userId, body.messages);
    res.json(result);
  },
};
