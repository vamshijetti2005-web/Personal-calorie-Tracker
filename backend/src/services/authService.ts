import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ConflictError, UnauthorizedError } from "../lib/errors.js";
import { mapUser } from "../lib/mappers.js";
import { userRepo } from "../repositories/userRepo.js";
import type { LoginInput, RegisterInput } from "../validators/auth.js";

const SALT_ROUNDS = 12;

function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepo.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await userRepo.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    });

    return {
      user: mapUser(user),
      token: signToken(user.id, user.email),
    };
  },

  async login(input: LoginInput) {
    const user = await userRepo.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return {
      user: mapUser(user),
      token: signToken(user.id, user.email),
    };
  },

  async me(userId: string) {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedError("Account no longer exists");
    }
    return mapUser(user);
  },
};
