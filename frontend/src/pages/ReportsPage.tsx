import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api'
import {
  Card,
  ErrorBanner,
  Input,
  Label,
  LoadingBlock,
  PageHeader,
  Select,
} from '../components/UI'
import { addDays, todayUtc } from '../dates'
import type {
  CalorieReport,
  GoalVsActualReport,
  MacroReport,
  MicronutrientReport,
} from '../types'

export function ReportsPage() {
  const today = todayUtc()
  const [from, setFrom] = useState(addDays(today, -13))
  const [to, setTo] = useState(today)
  const [granularity, setGranularity] = useState<'day' | 'week'>('day')
  const [calories, setCalories] = useState<CalorieReport | null>(null)
  const [macros, setMacros] = useState<MacroReport | null>(null)
  const [micros, setMicros] = useState<MicronutrientReport | null>(null)
  const [comparison, setComparison] = useState<GoalVsActualReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.reports.calories(from, to, granularity),
      api.reports.macros(from, to, granularity),
      api.reports.micros(from, to),
      api.reports.goalVsActual(from, to),
    ])
      .then(([calorieData, macroData, microData, goalData]) => {
        setCalories(calorieData)
        setMacros(macroData)
        setMicros(microData)
        setComparison(goalData)
      })
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : 'Could not load reports',
        ),
      )
      .finally(() => setLoading(false))
  }, [from, to, granularity])

  const goalData = (comparison?.points ?? []).map((point) => ({
    date: point.date,
    actual: Number(point.actual.calories),
    goal: point.goal ? Number(point.goal.calories) : null,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nutrition insights"
        title="Reports"
        description="Server-aggregated trends reveal patterns without depending on paginated diary rows."
      />

      <Card className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>From</Label>
          <Input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>
        <div>
          <Label>To</Label>
          <Input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
        <div>
          <Label>Group charts by</Label>
          <Select
            value={granularity}
            onChange={(event) =>
              setGranularity(event.target.value as 'day' | 'week')
            }
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
          </Select>
        </div>
      </Card>

      <ErrorBanner error={error} />
      {loading ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard
              title="Calorie trend"
              description={`Total intake by ${granularity}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calories?.points ?? []}>
                  <CartesianGrid vertical={false} stroke="#ebe7de" />
                  <XAxis
                    dataKey="periodStart"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    tickFormatter={(value: string) => value.slice(5)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#78716c' }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="calories"
                    fill="#17624f"
                    radius={[7, 7, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Macronutrient breakdown"
              description="Protein, carbohydrates, and fat in grams"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={macros?.points ?? []}>
                  <CartesianGrid vertical={false} stroke="#ebe7de" />
                  <XAxis
                    dataKey="periodStart"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    tickFormatter={(value: string) => value.slice(5)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#78716c' }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar
                    dataKey="proteinGrams"
                    name="Protein"
                    stackId="macros"
                    fill="#17624f"
                  />
                  <Bar
                    dataKey="carbsGrams"
                    name="Carbs"
                    stackId="macros"
                    fill="#e6a934"
                  />
                  <Bar
                    dataKey="fatGrams"
                    name="Fat"
                    stackId="macros"
                    fill="#df6b3b"
                    radius={[7, 7, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard
            title="Goal vs actual calories"
            description="Each day uses the goal version that was effective on that date"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={goalData}>
                <CartesianGrid vertical={false} stroke="#ebe7de" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickFormatter={(value: string) => value.slice(5)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#78716c' }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#df6b3b"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="stepAfter"
                  dataKey="goal"
                  name="Goal"
                  stroke="#17624f"
                  strokeWidth={2}
                  strokeDasharray="7 5"
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {micros && (
            <Card>
              <div>
                <h2 className="font-display text-2xl text-emerald-950">
                  Micronutrient summary
                </h2>
                <p className="mt-1 text-sm text-stone-400">
                  Daily averages over {micros.dayCount} days against adult
                  reference targets
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <MicroTile
                  label="Vitamin C"
                  unit="mg"
                  value={micros.dailyAverages.vitaminCMg}
                  target={micros.referenceDailyTargets.vitaminCMg}
                />
                <MicroTile
                  label="Calcium"
                  unit="mg"
                  value={micros.dailyAverages.calciumMg}
                  target={micros.referenceDailyTargets.calciumMg}
                />
                <MicroTile
                  label="Iron"
                  unit="mg"
                  value={micros.dailyAverages.ironMg}
                  target={micros.referenceDailyTargets.ironMg}
                />
                <MicroTile
                  label="Vitamin D"
                  unit="IU"
                  value={micros.dailyAverages.vitaminDIU}
                  target={micros.referenceDailyTargets.vitaminDIU}
                />
                <MicroTile
                  label="Potassium"
                  unit="mg"
                  value={micros.dailyAverages.potassiumMg}
                  target={micros.referenceDailyTargets.potassiumMg}
                />
              </div>
              <p className="mt-4 text-xs text-stone-400">
                Reference values provide visual context and are not medical
                advice.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

const tooltipStyle = {
  borderRadius: 14,
  border: '1px solid #e7e5e4',
  boxShadow: '0 12px 30px -20px rgba(0,0,0,.35)',
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <h2 className="font-display text-2xl text-emerald-950">{title}</h2>
      <p className="mt-1 text-sm text-stone-400">{description}</p>
      <div className="mt-5 h-72 sm:h-80">{children}</div>
    </Card>
  )
}

function MicroTile({
  label,
  unit,
  value,
  target,
}: {
  label: string
  unit: string
  value: number
  target: number
}) {
  const percent = Math.min(100, (Number(value) / Number(target)) * 100)
  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-emerald-950">
        {Number(value).toFixed(1)}
        <span className="ml-1 font-sans text-xs text-stone-400">{unit}/day</span>
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-amber-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-stone-400">
        {percent.toFixed(0)}% of {Number(target).toFixed(0)} {unit}
      </p>
    </div>
  )
}
