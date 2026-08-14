import { useEffect, useState, type FormEvent } from "react";
import { createGoal, deleteGoal, listGoals } from "../api/goals";
import { RequestError } from "../api/client";
import { Button, Card, EmptyState, ErrorBanner, Input, Label } from "../components/ui/Field";
import { formatDateTime } from "../lib/dates";
import type { Goal } from "../types";

type GoalForm = {
  dailyCalorieTarget: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  weightGoalKg: number;
};

const defaults: GoalForm = {
  dailyCalorieTarget: 2100,
  proteinGrams: 150,
  carbsGrams: 210,
  fatGrams: 70,
  weightGoalKg: 70,
};

export function GoalsPage() {
  const [form, setForm] = useState<GoalForm>(defaults);
  const [versions, setVersions] = useState<Goal[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const limit = 8;

  function load(nextOffset = offset) {
    listGoals(limit, nextOffset)
      .then((res) => {
        setVersions(res.data);
        setTotal(res.pagination.total);
        if (res.data[0] && nextOffset === 0) {
          const current = res.data[0];
          setForm({
            dailyCalorieTarget: current.dailyCalorieTarget,
            proteinGrams: current.proteinGrams,
            carbsGrams: current.carbsGrams,
            fatGrams: current.fatGrams,
            weightGoalKg: current.weightGoalKg,
          });
        }
      })
      .catch((err) => setError(err instanceof RequestError ? err.message : "Failed to load goals"));
  }

  useEffect(() => {
    load(offset);
  }, [offset]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createGoal(form);
      setOffset(0);
      load(0);
    } catch (err) {
      setError(err instanceof RequestError ? err.message : "Could not save goal");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteGoal(id);
      load(offset);
    } catch (err) {
      setError(err instanceof RequestError ? err.message : "Could not delete goal");
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-4xl text-forest">Goals</h1>
        <p className="text-sm text-ink/55">
          Saving creates a new timestamped version. Older versions stay so reports compare against the goal that was
          active that day.
        </p>
      </header>

      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div>
            <Label>Daily calories</Label>
            <Input type="number" min={500} max={10000} value={form.dailyCalorieTarget} onChange={(e) => setForm({ ...form, dailyCalorieTarget: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Weight goal (kg)</Label>
            <Input type="number" min={20} max={400} step="0.1" value={form.weightGoalKg} onChange={(e) => setForm({ ...form, weightGoalKg: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Protein (g)</Label>
            <Input type="number" min={0} max={1000} value={form.proteinGrams} onChange={(e) => setForm({ ...form, proteinGrams: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Carbs (g)</Label>
            <Input type="number" min={0} max={1000} value={form.carbsGrams} onChange={(e) => setForm({ ...form, carbsGrams: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Fat (g)</Label>
            <Input type="number" min={0} max={1000} value={form.fatGrams} onChange={(e) => setForm({ ...form, fatGrams: Number(e.target.value) })} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save new version"}</Button>
          </div>
        </form>
      </Card>

      <ErrorBanner message={error} />

      {versions.length === 0 ? (
        <EmptyState title="No goal versions yet" body="Save your first target to unlock goal-vs-actual reports." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-mist bg-paper shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream/80 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">Effective from</th>
                <th className="px-4 py-3">kcal</th>
                <th className="px-4 py-3">P / C / F</th>
                <th className="px-4 py-3">Weight</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {versions.map((goal, index) => (
                <tr key={goal.id} className="border-t border-mist">
                  <td className="px-4 py-3">
                    {formatDateTime(goal.effectiveFrom)}
                    {offset === 0 && index === 0 && (
                      <span className="ml-2 rounded-full bg-sage/30 px-2 py-0.5 text-xs text-forest">current</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{goal.dailyCalorieTarget}</td>
                  <td className="px-4 py-3">
                    {goal.proteinGrams} / {goal.carbsGrams} / {goal.fatGrams}
                  </td>
                  <td className="px-4 py-3">{goal.weightGoalKg} kg</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-clay" onClick={() => void onDelete(goal.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
          Previous
        </Button>
        <p className="text-sm text-ink/55">
          {total} versions
        </p>
        <Button variant="ghost" disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>
          Next
        </Button>
      </div>
    </div>
  );
}
