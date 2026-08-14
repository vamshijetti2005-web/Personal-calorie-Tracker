import { prisma } from "../lib/prisma.js";
import { exclusiveEnd, startOfUtcDay } from "../lib/dates.js";
import { ValidationError } from "../lib/errors.js";
import { round2, toNumber } from "../lib/serialize.js";

type Range = { from: Date; toExclusive: Date; fromKey: string; toKey: string };

function parseRange(from: string, to: string): Range {
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
  const toKeyDate = new Date(end.getTime() - 1);
  return {
    from: start,
    toExclusive: end,
    fromKey: start.toISOString().slice(0, 10),
    toKey: toKeyDate.toISOString().slice(0, 10),
  };
}

function dayKey(day: Date | string): string {
  if (typeof day === "string") return day.slice(0, 10);
  return day.toISOString().slice(0, 10);
}

type DailyRow = {
  day: Date | string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  vitamin_c: number;
  calcium: number;
  iron: number;
  vitamin_d: number;
  potassium: number;
};

async function dailyAggregates(userId: string, range: Range): Promise<DailyRow[]> {
  return prisma.$queryRaw<DailyRow[]>`
    SELECT
      (DATE_TRUNC('day', consumed_at AT TIME ZONE 'UTC'))::date AS day,
      COALESCE(SUM(calories), 0)::float AS calories,
      COALESCE(SUM(protein_grams), 0)::float AS protein,
      COALESCE(SUM(carbs_grams), 0)::float AS carbs,
      COALESCE(SUM(fat_grams), 0)::float AS fat,
      COALESCE(SUM(vitamin_c_mg), 0)::float AS vitamin_c,
      COALESCE(SUM(calcium_mg), 0)::float AS calcium,
      COALESCE(SUM(iron_mg), 0)::float AS iron,
      COALESCE(SUM(vitamin_d_iu), 0)::float AS vitamin_d,
      COALESCE(SUM(potassium_mg), 0)::float AS potassium
    FROM food_entries
    WHERE user_id = ${userId}::uuid
      AND consumed_at >= ${range.from}
      AND consumed_at < ${range.toExclusive}
    GROUP BY 1
    ORDER BY 1
  `;
}

function eachUtcDate(fromKey: string, toKey: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${fromKey}T00:00:00.000Z`);
  const end = new Date(`${toKey}T00:00:00.000Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function isoWeekKey(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export const reportService = {
  async calories(userId: string, from: string, to: string, granularity: "day" | "week") {
    const range = parseRange(from, to);
    const rows = await dailyAggregates(userId, range);
    const byDay = new Map(rows.map((r) => [dayKey(r.day), r]));

    if (granularity === "day") {
      return {
        granularity,
        from: range.fromKey,
        to: range.toKey,
        points: eachUtcDate(range.fromKey, range.toKey).map((date) => ({
          period: date,
          calories: round2(byDay.get(date)?.calories ?? 0),
        })),
      };
    }

    const weeks = new Map<string, number>();
    for (const date of eachUtcDate(range.fromKey, range.toKey)) {
      const key = isoWeekKey(date);
      weeks.set(key, (weeks.get(key) ?? 0) + (byDay.get(date)?.calories ?? 0));
    }
    return {
      granularity,
      from: range.fromKey,
      to: range.toKey,
      points: [...weeks.entries()].map(([period, calories]) => ({
        period,
        calories: round2(calories),
      })),
    };
  },

  async macros(userId: string, from: string, to: string, granularity: "day" | "week") {
    const range = parseRange(from, to);
    const rows = await dailyAggregates(userId, range);
    const byDay = new Map(rows.map((r) => [dayKey(r.day), r]));

    const empty = { proteinGrams: 0, carbsGrams: 0, fatGrams: 0 };

    if (granularity === "day") {
      return {
        granularity,
        from: range.fromKey,
        to: range.toKey,
        points: eachUtcDate(range.fromKey, range.toKey).map((date) => {
          const row = byDay.get(date);
          return {
            period: date,
            proteinGrams: round2(row?.protein ?? 0),
            carbsGrams: round2(row?.carbs ?? 0),
            fatGrams: round2(row?.fat ?? 0),
          };
        }),
      };
    }

    const weeks = new Map<string, typeof empty>();
    for (const date of eachUtcDate(range.fromKey, range.toKey)) {
      const key = isoWeekKey(date);
      const acc = weeks.get(key) ?? { ...empty };
      const row = byDay.get(date);
      acc.proteinGrams += row?.protein ?? 0;
      acc.carbsGrams += row?.carbs ?? 0;
      acc.fatGrams += row?.fat ?? 0;
      weeks.set(key, acc);
    }
    return {
      granularity,
      from: range.fromKey,
      to: range.toKey,
      points: [...weeks.entries()].map(([period, macros]) => ({
        period,
        proteinGrams: round2(macros.proteinGrams),
        carbsGrams: round2(macros.carbsGrams),
        fatGrams: round2(macros.fatGrams),
      })),
    };
  },

  async micros(userId: string, from: string, to: string) {
    const range = parseRange(from, to);
    const rows = await dailyAggregates(userId, range);
    const totals = rows.reduce(
      (acc, row) => ({
        vitaminCMg: acc.vitaminCMg + row.vitamin_c,
        calciumMg: acc.calciumMg + row.calcium,
        ironMg: acc.ironMg + row.iron,
        vitaminDIU: acc.vitaminDIU + row.vitamin_d,
        potassiumMg: acc.potassiumMg + row.potassium,
      }),
      { vitaminCMg: 0, calciumMg: 0, ironMg: 0, vitaminDIU: 0, potassiumMg: 0 },
    );

    const dayCount = Math.max(eachUtcDate(range.fromKey, range.toKey).length, 1);
    const dailyTargets = {
      vitaminCMg: 90,
      calciumMg: 1000,
      ironMg: 18,
      vitaminDIU: 600,
      potassiumMg: 3400,
    };

    return {
      from: range.fromKey,
      to: range.toKey,
      dayCount,
      totals: {
        vitaminCMg: round2(totals.vitaminCMg),
        calciumMg: round2(totals.calciumMg),
        ironMg: round2(totals.ironMg),
        vitaminDIU: round2(totals.vitaminDIU),
        potassiumMg: round2(totals.potassiumMg),
      },
      dailyAverages: {
        vitaminCMg: round2(totals.vitaminCMg / dayCount),
        calciumMg: round2(totals.calciumMg / dayCount),
        ironMg: round2(totals.ironMg / dayCount),
        vitaminDIU: round2(totals.vitaminDIU / dayCount),
        potassiumMg: round2(totals.potassiumMg / dayCount),
      },
      // Adult RDAs used as a reference scale for the summary view, not medical advice.
      referenceDailyTargets: dailyTargets,
    };
  },

  async goalVsActual(userId: string, from: string, to: string) {
    const range = parseRange(from, to);
    const actuals = await dailyAggregates(userId, range);
    const byDay = new Map(actuals.map((r) => [dayKey(r.day), r]));

    type GoalRow = {
      effective_from: Date;
      daily_calorie_target: number;
      protein_grams: unknown;
      carbs_grams: unknown;
      fat_grams: unknown;
    };

    const goals = await prisma.$queryRaw<GoalRow[]>`
      SELECT effective_from, daily_calorie_target, protein_grams, carbs_grams, fat_grams
      FROM goals
      WHERE user_id = ${userId}::uuid
      ORDER BY effective_from ASC
    `;

    // For each calendar day, pick the latest goal whose effective_from is on or before that day.
    function goalForDay(dateKey: string): GoalRow | null {
      const dayEnd = new Date(`${dateKey}T23:59:59.999Z`);
      let chosen: GoalRow | null = null;
      for (const goal of goals) {
        if (goal.effective_from <= dayEnd) {
          chosen = goal;
        } else {
          break;
        }
      }
      return chosen;
    }

    const points = eachUtcDate(range.fromKey, range.toKey).map((date) => {
      const actual = byDay.get(date);
      const goal = goalForDay(date);
      return {
        date,
        actual: {
          calories: round2(actual?.calories ?? 0),
          proteinGrams: round2(actual?.protein ?? 0),
          carbsGrams: round2(actual?.carbs ?? 0),
          fatGrams: round2(actual?.fat ?? 0),
        },
        goal: goal
          ? {
              calories: goal.daily_calorie_target,
              proteinGrams: toNumber(goal.protein_grams as never),
              carbsGrams: toNumber(goal.carbs_grams as never),
              fatGrams: toNumber(goal.fat_grams as never),
            }
          : null,
      };
    });

    return {
      from: range.fromKey,
      to: range.toKey,
      points,
    };
  },
};
