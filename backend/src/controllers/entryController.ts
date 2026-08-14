import type { Request, Response } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { entryService } from "../services/entryService.js";
import type { CreateEntryInput, UpdateEntryInput } from "../validators/entries.js";

export const entryController = {
  async list(req: Request, res: Response) {
    const query = req.query as {
      from: string;
      to: string;
      mealType?: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS";
      limit?: unknown;
      offset?: unknown;
    };
    const result = await entryService.list((req as AuthedRequest).user.userId, query);
    res.json(result);
  },

  async getById(req: Request, res: Response) {
    const entry = await entryService.getById((req as AuthedRequest).user.userId, req.params.id);
    res.json({ data: entry });
  },

  async create(req: Request, res: Response) {
    const entry = await entryService.create(
      (req as AuthedRequest).user.userId,
      req.body as CreateEntryInput,
    );
    res.status(201).json({ data: entry });
  },

  async update(req: Request, res: Response) {
    const entry = await entryService.update(
      (req as AuthedRequest).user.userId,
      req.params.id,
      req.body as UpdateEntryInput,
    );
    res.json({ data: entry });
  },

  async remove(req: Request, res: Response) {
    await entryService.remove((req as AuthedRequest).user.userId, req.params.id);
    res.status(204).send();
  },
};
