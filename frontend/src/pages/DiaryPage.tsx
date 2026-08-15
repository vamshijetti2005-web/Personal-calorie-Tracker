import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Input,
  Label,
  LoadingBlock,
  PageHeader,
  Select,
} from '../components/UI'
import { addDays, formatDateTime, todayUtc } from '../dates'
import type { FoodEntry, MealType } from '../types'

const PAGE_SIZE = 10

export function DiaryPage() {
  const today = todayUtc()
  const [from, setFrom] = useState(addDays(today, -6))
  const [to, setTo] = useState(today)
  const [mealType, setMealType] = useState<MealType | ''>('')
  const [offset, setOffset] = useState(0)
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.entries
      .list({ from, to, mealType, limit: PAGE_SIZE, offset })
      .then((page) => {
        setEntries(page.data)
        setTotal(page.pagination.total)
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Could not load diary'),
      )
      .finally(() => setLoading(false))
  }, [from, to, mealType, offset, revision])

  function resetFilter(update: () => void) {
    update()
    setOffset(0)
  }

  async function remove(entry: FoodEntry) {
    if (!window.confirm(`Delete “${entry.foodName}”?`)) return
    try {
      await api.entries.delete(entry.id)
      if (entries.length === 1 && offset > 0) setOffset(offset - PAGE_SIZE)
      else setRevision((value) => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete entry')
    }
  }

  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Food history"
        title="Your diary"
        description="Review meals over any UTC date range, narrow by meal type, and edit individual entries."
        action={
          <Link
            to="/log"
            className="inline-flex min-h-10 items-center rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            + Add entry
          </Link>
        }
      />

      <Card className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>From</Label>
          <Input
            type="date"
            value={from}
            onChange={(event) =>
              resetFilter(() => setFrom(event.target.value))
            }
          />
        </div>
        <div>
          <Label>To</Label>
          <Input
            type="date"
            value={to}
            onChange={(event) => resetFilter(() => setTo(event.target.value))}
          />
        </div>
        <div>
          <Label>Meal type</Label>
          <Select
            value={mealType}
            onChange={(event) =>
              resetFilter(() =>
                setMealType(event.target.value as MealType | ''),
              )
            }
          >
            <option value="">All meals</option>
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
            <option value="SNACKS">Snacks</option>
          </Select>
        </div>
      </Card>

      <ErrorBanner error={error} />

      {loading ? (
        <LoadingBlock />
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState
            title="No entries found"
            description="Try another date range or log a meal to begin your diary."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.12em] text-stone-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-5 py-3 font-semibold">Meal</th>
                  <th className="px-5 py-3 font-semibold">Food</th>
                  <th className="px-5 py-3 font-semibold">Quantity</th>
                  <th className="px-5 py-3 text-right font-semibold">Calories</th>
                  <th className="px-5 py-3 font-semibold">P / C / F</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="text-sm hover:bg-stone-50/70">
                    <td className="whitespace-nowrap px-5 py-4 text-stone-500">
                      {formatDateTime(entry.consumedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-800">
                        {entry.mealType.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-stone-800">
                      {entry.foodName}
                    </td>
                    <td className="px-5 py-4 text-stone-500">
                      {entry.quantity} {entry.servingUnit}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-stone-800">
                      {Math.round(Number(entry.calories))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-500">
                      {Number(entry.proteinGrams).toFixed(0)} /{' '}
                      {Number(entry.carbsGrams).toFixed(0)} /{' '}
                      {Number(entry.fatGrams).toFixed(0)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <Link
                        to={`/log/${entry.id}`}
                        className="mr-3 font-semibold text-emerald-800 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="font-semibold text-red-600 hover:underline"
                        onClick={() => void remove(entry)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
        >
          ← Previous
        </Button>
        <p className="text-sm text-stone-500">
          Page {pageNumber} of {pageCount} · {total} entries
        </p>
        <Button
          variant="secondary"
          disabled={offset + PAGE_SIZE >= total}
          onClick={() => setOffset(offset + PAGE_SIZE)}
        >
          Next →
        </Button>
      </div>
    </div>
  )
}
