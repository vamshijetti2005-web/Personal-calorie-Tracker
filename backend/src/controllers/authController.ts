import type { Request, Response } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { authService } from "../services/authService.js";
import type { LoginInput, RegisterInput } from "../validators/auth.js";

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body as RegisterInput);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body as LoginInput);
    res.json(result);
  },

  async me(req: Request, res: Response) {
    const user = await authService.me((req as AuthedRequest).user.userId);
    res.json({ user });
  },
};
