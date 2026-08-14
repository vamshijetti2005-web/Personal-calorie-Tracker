import type { Request, Response } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { goalService } from "../services/goalService.js";
import type { CreateGoalInput } from "../validators/goals.js";

export const goalController = {
  async list(req: Request, res: Response) {
    const result = await goalService.list((req as AuthedRequest).user.userId, req.query);
    res.json(result);
  },

  async current(req: Request, res: Response) {
    const goal = await goalService.current((req as AuthedRequest).user.userId);
    res.json({ data: goal });
  },

  async getById(req: Request, res: Response) {
    const goal = await goalService.getById((req as AuthedRequest).user.userId, req.params.id);
    res.json({ data: goal });
  },

  async create(req: Request, res: Response) {
    const goal = await goalService.create(
      (req as AuthedRequest).user.userId,
      req.body as CreateGoalInput,
    );
    res.status(201).json({ data: goal });
  },

  async remove(req: Request, res: Response) {
    await goalService.remove((req as AuthedRequest).user.userId, req.params.id);
    res.status(204).send();
  },
};
