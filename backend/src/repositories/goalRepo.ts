import { prisma } from "../lib/prisma.js";

export const goalRepo = {
  list(userId: string, limit: number, offset: number) {
    return prisma.$transaction([
      prisma.goal.findMany({
        where: { userId },
        orderBy: { effectiveFrom: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.goal.count({ where: { userId } }),
    ]);
  },

  findById(id: string) {
    return prisma.goal.findUnique({ where: { id } });
  },

  findCurrent(userId: string, asOf: Date = new Date()) {
    return prisma.goal.findFirst({
      where: { userId, effectiveFrom: { lte: asOf } },
      orderBy: { effectiveFrom: "desc" },
    });
  },

  create(data: {
    userId: string;
    dailyCalorieTarget: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    weightGoalKg: number;
    effectiveFrom: Date;
  }) {
    return prisma.goal.create({ data });
  },

  delete(id: string) {
    return prisma.goal.delete({ where: { id } });
  },
};
