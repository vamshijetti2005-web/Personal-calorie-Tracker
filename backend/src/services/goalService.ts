import { ForbiddenError, NotFoundError, ValidationError } from "../lib/errors.js";
import { startOfUtcDay } from "../lib/dates.js";
import { mapGoal } from "../lib/mappers.js";
import { paginated, parsePagination } from "../lib/pagination.js";
import { goalRepo } from "../repositories/goalRepo.js";
import type { CreateGoalInput } from "../validators/goals.js";

function parseEffectiveFrom(value?: string): Date {
  if (!value) return new Date();
  try {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? startOfUtcDay(value) : new Date(value);
  } catch {
    throw new ValidationError("effectiveFrom must be an ISO date or datetime");
  }
}

export const goalService = {
  async list(userId: string, query: { limit?: unknown; offset?: unknown }) {
    const pagination = parsePagination(query);
    const [rows, total] = await goalRepo.list(userId, pagination.limit, pagination.offset);
    return paginated(rows.map(mapGoal), total, pagination);
  },

  async current(userId: string) {
    const goal = await goalRepo.findCurrent(userId);
    return goal ? mapGoal(goal) : null;
  },

  async getById(userId: string, id: string) {
    const goal = await goalRepo.findById(id);
    if (!goal || goal.userId !== userId) {
      throw new NotFoundError("Goal version not found");
    }
    return mapGoal(goal);
  },

  async create(userId: string, input: CreateGoalInput) {
    const goal = await goalRepo.create({
      userId,
      dailyCalorieTarget: input.dailyCalorieTarget,
      proteinGrams: input.proteinGrams,
      carbsGrams: input.carbsGrams,
      fatGrams: input.fatGrams,
      weightGoalKg: input.weightGoalKg,
      effectiveFrom: parseEffectiveFrom(input.effectiveFrom),
    });
    return mapGoal(goal);
  },

  async remove(userId: string, id: string) {
    const goal = await goalRepo.findById(id);
    if (!goal || goal.userId !== userId) {
      throw new NotFoundError("Goal version not found");
    }

    const current = await goalRepo.findCurrent(userId);
    if (current?.id === id) {
      throw new ForbiddenError(
        "Cannot delete the currently effective goal. Create a newer version first.",
      );
    }

    await goalRepo.delete(id);
  },
};
