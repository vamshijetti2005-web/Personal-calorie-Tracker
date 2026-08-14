import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listEntries } from "../api/entries";
import { currentGoal } from "../api/goals";
import { calorieReport } from "../api/reports";
import { RequestError } from "../api/client";
import { Card, EmptyState, ErrorBanner } from "../components/ui/Field";
import { useAuth } from "../context/AuthContext";
import { addUtcDays, formatDateTime, utcToday } from "../lib/dates";
import type { FoodEntry, Goal } from "../types";

const MEAL_ORDER = ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"] as const;

export function DashboardPage() {
  const { user } = useAuth();
  const today = utcToday();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [weekCalories, setWeekCalories] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const from = addUtcDays(today, -6);
    Promise.all([
      currentGoal(),
      listEntries({ from: today, to: today, limit: 100, offset: 0 }),
      calorieReport(from, today, "day"),
    ])
      .then(([goalRes, entryRes, calorieRes]) => {
        setGoal(goalRes.data);
        setEntries(entryRes.data);
        setWeekCalories(calorieRes.points.reduce((sum, p) => sum + p.calories, 0));
      })
      .catch((err) => setError(err instanceof RequestError ? err.message : "Failed to load today"));
  }, [today]);

  const totals = useMemo(
    () =>
      entries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          proteinGrams: acc.proteinGrams + e.proteinGrams,
          carbsGrams: acc.carbsGrams + e.carbsGrams,
          fatGrams: acc.fatGrams + e.fatGrams,
        }),
        { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 },
      ),
    [entries],
  );

  const caloriePct = goal ? Math.min(100, Math.round((totals.calories / goal.dailyCalorieTarget) * 100)) : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-ink/45">Today · {today}</p>
          <h1 className="font-display text-4xl text-forest">Hello, {user?.displayName.split(" ")[0]}</h1>
        </div>
        <Link
          to="/log"
          className="rounded-xl bg-clay px-4 py-2.5 text-sm font-medium text-white hover:bg-clay/90"
        >
          Log a meal
        </Link>
      </header>
      <ErrorBanner message={error} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <p className="text-sm text-ink/55">Calories</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="font-display text-5xl text-forest">{Math.round(totals.calories)}</p>
            <p className="text-sm text-ink/55">
              of {goal ? goal.dailyCalorieTarget : "—"} kcal
            </p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full bg-forest" style={{ width: `${caloriePct}%` }} />
          </div>
          <p className="mt-3 text-sm text-ink/55">Last 7 days total: {Math.round(weekCalories)} kcal</p>
        </Card>
        <Card>
          <p className="text-sm text-ink/55">Macros today</p>
          <MacroRow label="Protein" value={totals.proteinGrams} target={goal?.proteinGrams} unit="g" />
          <MacroRow label="Carbs" value={totals.carbsGrams} target={goal?.carbsGrams} unit="g" />
          <MacroRow label="Fat" value={totals.fatGrams} target={goal?.fatGrams} unit="g" />
        </Card>
      </div>

      {!goal && (
        <EmptyState
          title="No goal yet"
          body="Set a calorie and macro target so today and reports have something to compare against."
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {MEAL_ORDER.map((meal) => {
          const items = entries.filter((e) => e.mealType === meal);
          return (
            <Card key={meal}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl capitalize">{meal.toLowerCase()}</h2>
                <span className="text-sm text-ink/50">
                  {Math.round(items.reduce((s, e) => s + e.calories, 0))} kcal
                </span>
              </div>
              {items.length === 0 ? (
                <p className="mt-3 text-sm text-ink/45">Nothing logged yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium">{item.foodName}</p>
                        <p className="text-ink/50">
                          {item.quantity} {item.servingUnit} · {formatDateTime(item.consumedAt)}
                        </p>
                      </div>
                      <span>{Math.round(item.calories)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MacroRow({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target?: number;
  unit: string;
}) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>
          {Math.round(value)}
          {target != null ? ` / ${target}` : ""} {unit}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-mist">
        <div
          className="h-full rounded-full bg-sage"
          style={{ width: `${target ? Math.min(100, (value / target) * 100) : 0}%` }}
        />
      </div>
    </div>
  );
}
