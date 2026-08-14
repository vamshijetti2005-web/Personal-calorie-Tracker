import type { MealType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export type EntryFilters = {
  userId: string;
  from: Date;
  toExclusive: Date;
  mealType?: MealType;
};

export const entryRepo = {
  list(filters: EntryFilters, limit: number, offset: number) {
    const where: Prisma.FoodEntryWhereInput = {
      userId: filters.userId,
      consumedAt: { gte: filters.from, lt: filters.toExclusive },
      ...(filters.mealType ? { mealType: filters.mealType } : {}),
    };

    return prisma.$transaction([
      prisma.foodEntry.findMany({
        where,
        orderBy: [{ consumedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.foodEntry.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.foodEntry.findUnique({ where: { id } });
  },

  create(data: Prisma.FoodEntryUncheckedCreateInput) {
    return prisma.foodEntry.create({ data });
  },

  update(id: string, data: Prisma.FoodEntryUncheckedUpdateInput) {
    return prisma.foodEntry.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.foodEntry.delete({ where: { id } });
  },
};
