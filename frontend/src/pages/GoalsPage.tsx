import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api'
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Input,
  Label,
  LoadingBlock,
  PageHeader,
} from '../components/UI'
import { formatDateTime, fromLocalInput } from '../dates'
import type { Goal, GoalInput } from '../types'

const PAGE_SIZE = 8
const defaultGoal: GoalInput = {
  dailyCalorieTarget: 2100,
  proteinGrams: 150,
  carbsGrams: 210,
  fatGrams: 70,
  weightGoalKg: 70,
}

export function GoalsPage() {
  const [goal, setGoal] = useState<GoalInput>(defaultGoal)
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [current, setCurrent] = useState<Goal | null>(null)
  const [history, setHistory] = useState<Goal[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const page = await api.goals.list(PAGE_SIZE, offset)
        setHistory(page.data)
        setTotal(page.pagination.total)

        try {
          const active = await api.goals.current()
          setCurrent(active)
          if (offset === 0 && revision === 0) {
            setGoal({
              dailyCalorieTarget: active.dailyCalorieTarget,
              proteinGrams: Number(active.proteinGrams),
              carbsGrams: Number(active.carbsGrams),
              fatGrams: Number(active.fatGrams),
              weightGoalKg: Number(active.weightGoalKg),
            })
          }
        } catch (cause) {
          if (cause instanceof ApiError && cause.status === 404) setCurrent(null)
          else throw cause
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not load goals')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [offset, revision])

  function update<K extends keyof GoalInput>(key: K, newValue: GoalInput[K]) {
    setGoal((value) => ({ ...value, [key]: newValue }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.goals.create({
        ...goal,
        effectiveFrom: effectiveFrom
          ? fromLocalInput(effectiveFrom)
          : undefined,
      })
      setEffectiveFrom('')
      setOffset(0)
      setRevision((value) => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save goal')
    } finally {
      setSaving(false)
    }
  }

  async function remove(version: Goal) {
    if (!window.confirm('Delete this historical goal version?')) return
    try {
      await api.goals.delete(version.id)
      setRevision((value) => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete goal')
    }
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Personal targets"
        title="Health goals"
        description="Each save creates a timestamped version, preserving accurate historical goal comparisons."
      />
      <ErrorBanner error={error} />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="font-display text-2xl text-emerald-950">
            {current ? 'Create a new version' : 'Set your first goal'}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Leave “effective from” empty to begin immediately.
          </p>
          <form
            className="mt-5 grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => void save(event)}
          >
            <GoalNumber
              label="Daily calories"
              value={goal.dailyCalorieTarget}
              min={500}
              max={10000}
              onChange={(value) => update('dailyCalorieTarget', value)}
            />
            <GoalNumber
              label="Weight goal (kg)"
              value={goal.weightGoalKg}
              min={20}
              max={400}
              onChange={(value) => update('weightGoalKg', value)}
            />
            <GoalNumber
              label="Protein (g)"
              value={goal.proteinGrams}
              onChange={(value) => update('proteinGrams', value)}
            />
            <GoalNumber
              label="Carbohydrates (g)"
              value={goal.carbsGrams}
              onChange={(value) => update('carbsGrams', value)}
            />
            <GoalNumber
              label="Fat (g)"
              value={goal.fatGrams}
              onChange={(value) => update('fatGrams', value)}
            />
            <div>
              <Label>Effective from (optional)</Label>
              <Input
                type="datetime-local"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? 'Saving…' : 'Save new goal version'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="bg-emerald-950 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/60">
            Currently effective
          </p>
          {current ? (
            <>
              <div className="mt-4 flex items-end justify-between">
                <p className="font-display text-5xl">
                  {current.dailyCalorieTarget.toLocaleString()}
                </p>
                <p className="pb-1 text-sm text-emerald-100/55">kcal / day</p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3">
                <Target value={current.proteinGrams} label="Protein" />
                <Target value={current.carbsGrams} label="Carbs" />
                <Target value={current.fatGrams} label="Fat" />
              </div>
              <div className="mt-6 border-t border-white/10 pt-4 text-sm text-emerald-100/60">
                <div className="flex justify-between">
                  <span>Weight goal</span>
                  <span className="font-semibold text-white">
                    {Number(current.weightGoalKg).toFixed(1)} kg
                  </span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>Effective since</span>
                  <span className="font-semibold text-white">
                    {formatDateTime(current.effectiveFrom)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-8 text-emerald-100/60">No goal saved yet.</div>
          )}
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl text-emerald-950">
              Version history
            </h2>
            <p className="text-sm text-stone-400">{total} saved versions</p>
          </div>
        </div>

        {loading ? (
          <LoadingBlock />
        ) : history.length === 0 ? (
          <Card>
            <EmptyState
              title="No goal history"
              description="Your saved goal versions will appear here."
            />
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.12em] text-stone-400">
                  <tr>
                    <th className="px-5 py-3">Effective</th>
                    <th className="px-5 py-3">Calories</th>
                    <th className="px-5 py-3">P / C / F</th>
                    <th className="px-5 py-3">Weight</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {history.map((version) => {
                    const isCurrent = current?.id === version.id
                    return (
                      <tr key={version.id}>
                        <td className="px-5 py-4 text-stone-600">
                          {formatDateTime(version.effectiveFrom)}
                          {isCurrent && (
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                              Current
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          {version.dailyCalorieTarget}
                        </td>
                        <td className="px-5 py-4 text-stone-500">
                          {Number(version.proteinGrams).toFixed(0)} /{' '}
                          {Number(version.carbsGrams).toFixed(0)} /{' '}
                          {Number(version.fatGrams).toFixed(0)}
                        </td>
                        <td className="px-5 py-4 text-stone-500">
                          {Number(version.weightGoalKg).toFixed(1)} kg
                        </td>
                        <td className="px-5 py-4 text-right">
                          {!isCurrent && (
                            <button
                              type="button"
                              className="font-semibold text-red-600 hover:underline"
                              onClick={() => void remove(version)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="secondary"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            ← Previous
          </Button>
          <span className="text-sm text-stone-500">
            Page {page} of {pages}
          </span>
          <Button
            variant="secondary"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  )
}

function GoalNumber({
  label,
  value,
  onChange,
  min = 0,
  max = 1000,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step="0.01"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        required
      />
    </div>
  )
}

function Target({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.08] p-3 text-center">
      <p className="font-display text-2xl">{Number(value).toFixed(0)}g</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-emerald-100/50">
        {label}
      </p>
    </div>
  )
}
