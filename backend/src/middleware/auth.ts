import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../lib/errors.js";

export type AuthPayload = {
  userId: string;
  email: string;
};

export type AuthedRequest = Request & { user: AuthPayload };

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing or invalid Authorization header"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    if (!payload.userId || !payload.email) {
      throw new Error("invalid payload");
    }
    (req as AuthedRequest).user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}
