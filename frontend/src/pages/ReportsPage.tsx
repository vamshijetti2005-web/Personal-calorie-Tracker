import { useEffect, useState } from "react";
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
} from "recharts";
import { calorieReport, goalVsActualReport, macroReport, microReport } from "../api/reports";
import { RequestError } from "../api/client";
import { Card, ErrorBanner, Input, Label, Select } from "../components/ui/Field";
import { addUtcDays, utcToday } from "../lib/dates";
import type { CalorieReport, GoalVsActualReport, MacroReport, MicroReport } from "../types";

export function ReportsPage() {
  const today = utcToday();
  const [from, setFrom] = useState(addUtcDays(today, -13));
  const [to, setTo] = useState(today);
  const [granularity, setGranularity] = useState<"day" | "week">("day");
  const [calories, setCalories] = useState<CalorieReport | null>(null);
  const [macros, setMacros] = useState<MacroReport | null>(null);
  const [micros, setMicros] = useState<MicroReport | null>(null);
  const [compare, setCompare] = useState<GoalVsActualReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      calorieReport(from, to, granularity),
      macroReport(from, to, granularity),
      microReport(from, to),
      goalVsActualReport(from, to),
    ])
      .then(([c, m, mi, g]) => {
        setCalories(c);
        setMacros(m);
        setMicros(mi);
        setCompare(g);
      })
      .catch((err) => setError(err instanceof RequestError ? err.message : "Failed to load reports"));
  }, [from, to, granularity]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-4xl text-forest">Reports</h1>
        <p className="text-sm text-ink/55">
          Charts are backed by aggregation endpoints — the browser never sums raw diary rows.
        </p>
      </header>

      <Card className="grid gap-4 md:grid-cols-3">
        <div>
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <Label>Granularity</Label>
          <Select value={granularity} onChange={(e) => setGranularity(e.target.value as "day" | "week")}>
            <option value="day">By day</option>
            <option value="week">By week</option>
          </Select>
        </div>
      </Card>

      <ErrorBanner message={error} />

      <Card>
        <h2 className="font-display text-2xl">Calorie trend</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={calories?.points ?? []}>
              <CartesianGrid stroke="#E5DCC8" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="calories" stroke="#2D5A3D" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-2xl">Macronutrient breakdown</h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={macros?.points ?? []}>
              <CartesianGrid stroke="#E5DCC8" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="proteinGrams" name="Protein" stackId="m" fill="#2D5A3D" />
              <Bar dataKey="carbsGrams" name="Carbs" stackId="m" fill="#C9A227" />
              <Bar dataKey="fatGrams" name="Fat" stackId="m" fill="#C4622D" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-2xl">Goal vs actual calories</h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={(compare?.points ?? []).map((p) => ({
                date: p.date,
                actual: p.actual.calories,
                goal: p.goal?.calories ?? null,
              }))}
            >
              <CartesianGrid stroke="#E5DCC8" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#C4622D" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="goal" stroke="#2D5A3D" strokeWidth={2} strokeDasharray="6 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {micros && (
        <Card>
          <h2 className="font-display text-2xl">Micronutrient summary</h2>
          <p className="mt-1 text-sm text-ink/55">
            Daily averages vs adult reference targets (not medical advice). Range covers {micros.dayCount} days.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <MicroTile label="Vitamin C" unit="mg" avg={micros.dailyAverages.vitaminCMg} target={micros.referenceDailyTargets.vitaminCMg} total={micros.totals.vitaminCMg} />
            <MicroTile label="Calcium" unit="mg" avg={micros.dailyAverages.calciumMg} target={micros.referenceDailyTargets.calciumMg} total={micros.totals.calciumMg} />
            <MicroTile label="Iron" unit="mg" avg={micros.dailyAverages.ironMg} target={micros.referenceDailyTargets.ironMg} total={micros.totals.ironMg} />
            <MicroTile label="Vitamin D" unit="IU" avg={micros.dailyAverages.vitaminDIU} target={micros.referenceDailyTargets.vitaminDIU} total={micros.totals.vitaminDIU} />
            <MicroTile label="Potassium" unit="mg" avg={micros.dailyAverages.potassiumMg} target={micros.referenceDailyTargets.potassiumMg} total={micros.totals.potassiumMg} />
          </div>
        </Card>
      )}
    </div>
  );
}

function MicroTile({
  label,
  unit,
  avg,
  target,
  total,
}: {
  label: string;
  unit: string;
  avg: number;
  target: number;
  total: number;
}) {
  const pct = Math.min(100, Math.round((avg / target) * 100));
  return (
    <div className="rounded-xl bg-cream px-3 py-4">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 font-display text-2xl text-forest">
        {avg}
        <span className="text-sm text-ink/50"> {unit}/d</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist">
        <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink/50">
        Target {target} {unit} · period total {total}
      </p>
    </div>
  );
}
