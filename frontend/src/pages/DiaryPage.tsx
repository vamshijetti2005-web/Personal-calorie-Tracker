import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteEntry, listEntries } from "../api/entries";
import { RequestError } from "../api/client";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, Select } from "../components/ui/Field";
import { addUtcDays, formatDateTime, utcToday } from "../lib/dates";
import type { FoodEntry, MealType } from "../types";

export function DiaryPage() {
  const today = utcToday();
  const [from, setFrom] = useState(addUtcDays(today, -6));
  const [to, setTo] = useState(today);
  const [mealType, setMealType] = useState<MealType | "">("");
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listEntries({ from, to, mealType, limit, offset })
      .then((res) => {
        setEntries(res.data);
        setTotal(res.pagination.total);
      })
      .catch((err) => setError(err instanceof RequestError ? err.message : "Failed to load diary"))
      .finally(() => setLoading(false));
  }, [from, to, mealType, limit, offset]);

  async function onDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteEntry(id);
      setEntries((current) => current.filter((e) => e.id !== id));
      setTotal((n) => n - 1);
    } catch (err) {
      setError(err instanceof RequestError ? err.message : "Delete failed");
    }
  }

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-4xl text-forest">Diary</h1>
        <p className="text-sm text-ink/55">Filter by UTC date range and meal type. Results are paginated.</p>
      </header>

      <Card className="grid gap-4 md:grid-cols-4">
        <div>
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setOffset(0); }} />
        </div>
        <div>
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setOffset(0); }} />
        </div>
        <div>
          <Label>Meal</Label>
          <Select value={mealType} onChange={(e) => { setMealType(e.target.value as MealType | ""); setOffset(0); }}>
            <option value="">All meals</option>
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
            <option value="SNACKS">Snacks</option>
          </Select>
        </div>
        <div className="flex items-end">
          <p className="text-sm text-ink/55">{total} matching entries</p>
        </div>
      </Card>

      <ErrorBanner message={error} />

      {loading ? (
        <p className="text-ink/50">Loading…</p>
      ) : entries.length === 0 ? (
        <EmptyState title="No entries in this range" body="Widen the dates or log a meal to populate the diary." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-mist bg-paper shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream/80 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Meal</th>
                <th className="px-4 py-3">Food</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">kcal</th>
                <th className="px-4 py-3">P / C / F</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-mist">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(entry.consumedAt)}</td>
                  <td className="px-4 py-3 capitalize">{entry.mealType.toLowerCase()}</td>
                  <td className="px-4 py-3">{entry.foodName}</td>
                  <td className="px-4 py-3">
                    {entry.quantity} {entry.servingUnit}
                  </td>
                  <td className="px-4 py-3">{Math.round(entry.calories)}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {Math.round(entry.proteinGrams)} / {Math.round(entry.carbsGrams)} / {Math.round(entry.fatGrams)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link className="mr-3 text-forest underline" to={`/log/${entry.id}`}>
                      Edit
                    </Link>
                    <button className="text-clay" onClick={() => void onDelete(entry.id)}>
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
          Page {page} of {pages}
        </p>
        <Button variant="ghost" disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>
          Next
        </Button>
      </div>
    </div>
  );
}
