import type { MealType } from "@prisma/client";
import { exclusiveEnd, startOfUtcDay } from "../lib/dates.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { mapEntry } from "../lib/mappers.js";
import { paginated, parsePagination } from "../lib/pagination.js";
import { entryRepo } from "../repositories/entryRepo.js";
import type { CreateEntryInput, UpdateEntryInput } from "../validators/entries.js";

function parseConsumedAt(value: string): Date {
  try {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? startOfUtcDay(value) : new Date(value);
  } catch {
    throw new ValidationError("consumedAt must be an ISO date or datetime");
  }
}

function parseRange(from: string, to: string): { from: Date; toExclusive: Date } {
  let start: Date;
  let end: Date;
  try {
    start = startOfUtcDay(from);
    end = exclusiveEnd(to);
  } catch {
    throw new ValidationError("from and to must be ISO dates or datetimes");
  }
  if (end <= start) {
    throw new ValidationError("`to` must be after `from`");
  }
  return { from: start, toExclusive: end };
}

export const entryService = {
  async list(
    userId: string,
    query: {
      from: string;
      to: string;
      mealType?: MealType;
      limit?: unknown;
      offset?: unknown;
    },
  ) {
    const pagination = parsePagination(query);
    const range = parseRange(query.from, query.to);
    const [rows, total] = await entryRepo.list(
      {
        userId,
        from: range.from,
        toExclusive: range.toExclusive,
        mealType: query.mealType,
      },
      pagination.limit,
      pagination.offset,
    );
    return paginated(rows.map(mapEntry), total, pagination);
  },

  async getById(userId: string, id: string) {
    const entry = await entryRepo.findById(id);
    if (!entry || entry.userId !== userId) {
      throw new NotFoundError("Food entry not found");
    }
    return mapEntry(entry);
  },

  async create(userId: string, input: CreateEntryInput) {
    const entry = await entryRepo.create({
      userId,
      mealType: input.mealType,
      foodName: input.foodName,
      quantity: input.quantity,
      servingUnit: input.servingUnit,
      calories: input.calories,
      proteinGrams: input.proteinGrams,
      carbsGrams: input.carbsGrams,
      fatGrams: input.fatGrams,
      vitaminCMg: input.vitaminCMg ?? 0,
      calciumMg: input.calciumMg ?? 0,
      ironMg: input.ironMg ?? 0,
      vitaminDIU: input.vitaminDIU ?? 0,
      potassiumMg: input.potassiumMg ?? 0,
      consumedAt: parseConsumedAt(input.consumedAt),
    });
    return mapEntry(entry);
  },

  async update(userId: string, id: string, input: UpdateEntryInput) {
    const existing = await entryRepo.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError("Food entry not found");
    }

    const entry = await entryRepo.update(id, {
      ...(input.mealType !== undefined ? { mealType: input.mealType } : {}),
      ...(input.foodName !== undefined ? { foodName: input.foodName } : {}),
      ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
      ...(input.servingUnit !== undefined ? { servingUnit: input.servingUnit } : {}),
      ...(input.calories !== undefined ? { calories: input.calories } : {}),
      ...(input.proteinGrams !== undefined ? { proteinGrams: input.proteinGrams } : {}),
      ...(input.carbsGrams !== undefined ? { carbsGrams: input.carbsGrams } : {}),
      ...(input.fatGrams !== undefined ? { fatGrams: input.fatGrams } : {}),
      ...(input.vitaminCMg !== undefined ? { vitaminCMg: input.vitaminCMg } : {}),
      ...(input.calciumMg !== undefined ? { calciumMg: input.calciumMg } : {}),
      ...(input.ironMg !== undefined ? { ironMg: input.ironMg } : {}),
      ...(input.vitaminDIU !== undefined ? { vitaminDIU: input.vitaminDIU } : {}),
      ...(input.potassiumMg !== undefined ? { potassiumMg: input.potassiumMg } : {}),
      ...(input.consumedAt !== undefined ? { consumedAt: parseConsumedAt(input.consumedAt) } : {}),
    });
    return mapEntry(entry);
  },

  async remove(userId: string, id: string) {
    const existing = await entryRepo.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError("Food entry not found");
    }
    await entryRepo.delete(id);
  },
};
