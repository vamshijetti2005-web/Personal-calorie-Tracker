import type { Request, Response } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { reportService } from "../services/reportService.js";

export const reportController = {
  async calories(req: Request, res: Response) {
    const { from, to, granularity } = req.query as {
      from: string;
      to: string;
      granularity: "day" | "week";
    };
    const data = await reportService.calories(
      (req as AuthedRequest).user.userId,
      from,
      to,
      granularity,
    );
    res.json(data);
  },

  async macros(req: Request, res: Response) {
    const { from, to, granularity } = req.query as {
      from: string;
      to: string;
      granularity: "day" | "week";
    };
    const data = await reportService.macros(
      (req as AuthedRequest).user.userId,
      from,
      to,
      granularity,
    );
    res.json(data);
  },

  async micros(req: Request, res: Response) {
    const { from, to } = req.query as { from: string; to: string };
    const data = await reportService.micros((req as AuthedRequest).user.userId, from, to);
    res.json(data);
  },

  async goalVsActual(req: Request, res: Response) {
    const { from, to } = req.query as { from: string; to: string };
    const data = await reportService.goalVsActual((req as AuthedRequest).user.userId, from, to);
    res.json(data);
  },
};
