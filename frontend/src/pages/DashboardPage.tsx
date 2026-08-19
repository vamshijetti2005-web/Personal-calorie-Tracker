import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { api, ApiError } from '../api'
import { LinkButton } from '../components/AppShell'
import {
  Card,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
} from '../components/UI'
import { addDays, browserTimeZone, formatDateTime, todayLocal } from '../dates'
import type {
  CalorieReport,
  FoodEntry,
  Goal,
  MacroReport,
  MealType,
} from '../types'

const meals: Array<{ type: MealType; label: string }> = [
  { type: 'BREAKFAST', label: 'Breakfast' },
  { type: 'LUNCH', label: 'Lunch' },
  { type: 'DINNER', label: 'Dinner' },
  { type: 'SNACKS', label: 'Snacks' },
]

export function DashboardPage() {
  const today = todayLocal()
  const timeZone = browserTimeZone()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [calories, setCalories] = useState<CalorieReport | null>(null)
  const [macros, setMacros] = useState<MacroReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [entryPage, calorieData, macroData] = await Promise.all([
          api.entries.list({
            from: today,
            to: today,
            limit: 100,
            timeZone,
          }),
          api.reports.calories(addDays(today, -6), today, 'day', timeZone),
          api.reports.macros(today, today, 'day', timeZone),
        ])
        setEntries(entryPage.data)
        setCalories(calorieData)
        setMacros(macroData)
        try {
          setGoal(await api.goals.current())
        } catch (cause) {
          if (cause instanceof ApiError && cause.status === 404) setGoal(null)
          else throw cause
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not load today')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [timeZone, today])

  if (loading) return <LoadingBlock />

  const macroToday = macros?.points[0]
  const caloriesToday = Number(calories?.points.at(-1)?.calories ?? 0)
  const caloriePercent = goal
    ? Math.min(100, (caloriesToday / goal.dailyCalorieTarget) * 100)
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={new Intl.DateTimeFormat(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }).format(new Date(`${today}T00:00:00`))}
        title="Your day, in balance."
        description="A clear look at what you have eaten and where you stand against today's targets."
        action={<LinkButton to="/log">+ Log a meal</LinkButton>}
      />
      <ErrorBanner error={error} />

      {!goal && (
        <Card>
          <EmptyState
            title="Set your first goal"
            description="Add calorie and macro targets to unlock meaningful progress comparisons."
          />
          <div className="mt-4 text-center">
            <LinkButton to="/goals">Set goals</LinkButton>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden bg-emerald-950 text-black">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black-100/60">
                Calories today
              </p>
              <p className="mt-3 font-display text-5xl">
                {Math.round(caloriesToday).toLocaleString()}
                <span className="ml-2 text-lg text-black-100/50">kcal</span>
              </p>
            </div>
            <div className="text-right text-sm text-black-100/60">
              <p>{goal ? `${goal.dailyCalorieTarget} target` : 'No target'}</p>
              {goal && (
                <p className="mt-1 text-black">
                  {Math.max(0, goal.dailyCalorieTarget - caloriesToday).toFixed(0)}{' '}
                  remaining
                </p>
              )}
            </div>
          </div>
          <div
            role="progressbar"
            aria-label="Daily calorie goal progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(caloriePercent)}
            className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
          <div className="mt-7 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={calories?.points ?? []}>
                <defs>
                  <linearGradient id="calorieFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="periodStart"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#a7c8bc', fontSize: 10 }}
                  tickFormatter={(value: string) => value.slice(5)}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: 0,
                    color: '#173f35',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  fill="url(#calorieFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
            Macros today
          </p>
          <div className="mt-4 space-y-5">
            <MacroProgress
              label="Protein"
              value={Number(macroToday?.proteinGrams ?? 0)}
              target={goal?.proteinGrams}
              color="bg-emerald-700"
            />
            <MacroProgress
              label="Carbohydrates"
              value={Number(macroToday?.carbsGrams ?? 0)}
              target={goal?.carbsGrams}
              color="bg-amber-500"
            />
            <MacroProgress
              label="Fat"
              value={Number(macroToday?.fatGrams ?? 0)}
              target={goal?.fatGrams}
              color="bg-orange-500"
            />
          </div>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl text-emerald-950">Today's meals</h2>
          <span className="text-sm text-stone-400">{entries.length} entries</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {meals.map((meal) => {
            const items = entries.filter((entry) => entry.mealType === meal.type)
            const mealCalories = items.reduce(
              (sum, entry) => sum + Number(entry.calories),
              0,
            )
            return (
              <Card key={meal.type}>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl text-emerald-950">
                    {meal.label}
                  </h3>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500">
                    {Math.round(mealCalories)} kcal
                  </span>
                </div>
                {items.length === 0 ? (
                  <p className="mt-4 text-sm text-stone-400">Nothing logged yet.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {items.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-start justify-between gap-3 border-t border-stone-100 pt-3 first:border-0 first:pt-0"
                      >
                        <div>
                          <p className="text-sm font-semibold text-stone-800">
                            {entry.foodName}
                          </p>
                          <p className="mt-0.5 text-xs text-stone-400">
                            {entry.quantity} {entry.servingUnit} ·{' '}
                            {formatDateTime(entry.consumedAt)}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-stone-600">
                          {Math.round(Number(entry.calories))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MacroProgress({
  label,
  value,
  target,
  color,
}: {
  label: string
  value: number
  target?: number
  color: string
}) {
  const progress = target ? Math.min(100, (value / Number(target)) * 100) : 0
  return (
    <div>
      <div className="flex items-end justify-between">
        <p className="text-sm font-semibold text-stone-700">{label}</p>
        <p className="text-sm text-stone-500">
          <span className="font-semibold text-stone-800">{value.toFixed(0)}g</span>
          {target ? ` / ${Number(target).toFixed(0)}g` : ''}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} goal progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100"
      >
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
