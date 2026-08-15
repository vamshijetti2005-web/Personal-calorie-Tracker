import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import {
  Button,
  Card,
  ErrorBanner,
  Input,
  Label,
  LoadingBlock,
  PageHeader,
  Select,
} from '../components/UI'
import { fromLocalInput, toLocalInput } from '../dates'
import type { EntryInput, MealType } from '../types'

const initialEntry: EntryInput = {
  mealType: 'LUNCH',
  foodName: '',
  quantity: 1,
  servingUnit: 'serving',
  calories: 0,
  proteinGrams: 0,
  carbsGrams: 0,
  fatGrams: 0,
  vitaminCMg: 0,
  calciumMg: 0,
  ironMg: 0,
  vitaminDIU: 0,
  potassiumMg: 0,
  consumedAt: new Date().toISOString(),
}

export function EntryFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState<EntryInput>(initialEntry)
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return
    api.entries
      .get(id)
      .then((value) =>
        setEntry({
          mealType: value.mealType,
          foodName: value.foodName,
          quantity: Number(value.quantity),
          servingUnit: value.servingUnit,
          calories: Number(value.calories),
          proteinGrams: Number(value.proteinGrams),
          carbsGrams: Number(value.carbsGrams),
          fatGrams: Number(value.fatGrams),
          vitaminCMg: Number(value.vitaminCMg),
          calciumMg: Number(value.calciumMg),
          ironMg: Number(value.ironMg),
          vitaminDIU: Number(value.vitaminDIU),
          potassiumMg: Number(value.potassiumMg),
          consumedAt: value.consumedAt,
        }),
      )
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Could not load entry'),
      )
      .finally(() => setLoading(false))
  }, [id])

  function update<K extends keyof EntryInput>(key: K, value: EntryInput[K]) {
    setEntry((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setFieldErrors({})
    try {
      if (id) await api.entries.update(id, entry)
      else await api.entries.create(entry)
      navigate('/diary')
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.message)
        setFieldErrors(cause.fieldErrors)
      } else {
        setError('Could not save this meal')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <form className="space-y-6" onSubmit={(event) => void submit(event)}>
      <PageHeader
        eyebrow={id ? 'Update entry' : 'New entry'}
        title={id ? 'Edit this meal' : 'Log what you ate'}
        description="Capture serving details, macros, and a focused set of micronutrients."
      />

      <ErrorBanner error={error} />

      <Card>
        <h2 className="font-display text-2xl text-emerald-950">Meal details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field error={fieldErrors.foodName}>
            <Label>Food name</Label>
            <Input
              value={entry.foodName}
              maxLength={160}
              placeholder="e.g. Rice and dal"
              onChange={(event) => update('foodName', event.target.value)}
              required
            />
          </Field>
          <Field error={fieldErrors.mealType}>
            <Label>Meal type</Label>
            <Select
              value={entry.mealType}
              onChange={(event) =>
                update('mealType', event.target.value as MealType)
              }
            >
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
              <option value="SNACKS">Snacks</option>
            </Select>
          </Field>
          <NumberField
            label="Quantity"
            value={entry.quantity}
            min={0.01}
            error={fieldErrors.quantity}
            onChange={(value) => update('quantity', value)}
          />
          <Field error={fieldErrors.servingUnit}>
            <Label>Serving unit</Label>
            <Input
              value={entry.servingUnit}
              maxLength={40}
              placeholder="plate, bowl, g, ml"
              onChange={(event) => update('servingUnit', event.target.value)}
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <Field error={fieldErrors.consumedAt}>
              <Label>Consumed at</Label>
              <Input
                type="datetime-local"
                value={toLocalInput(entry.consumedAt)}
                onChange={(event) =>
                  update('consumedAt', fromLocalInput(event.target.value))
                }
                required
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-2xl text-emerald-950">Energy & macros</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField
            label="Calories (kcal)"
            value={entry.calories}
            error={fieldErrors.calories}
            onChange={(value) => update('calories', value)}
          />
          <NumberField
            label="Protein (g)"
            value={entry.proteinGrams}
            error={fieldErrors.proteinGrams}
            onChange={(value) => update('proteinGrams', value)}
          />
          <NumberField
            label="Carbohydrates (g)"
            value={entry.carbsGrams}
            error={fieldErrors.carbsGrams}
            onChange={(value) => update('carbsGrams', value)}
          />
          <NumberField
            label="Fat (g)"
            value={entry.fatGrams}
            error={fieldErrors.fatGrams}
            onChange={(value) => update('fatGrams', value)}
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl text-emerald-950">
            Micronutrients
          </h2>
          <p className="text-xs text-stone-400">Optional — enter 0 if unknown</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <NumberField
            label="Vitamin C (mg)"
            value={entry.vitaminCMg}
            error={fieldErrors.vitaminCMg}
            onChange={(value) => update('vitaminCMg', value)}
          />
          <NumberField
            label="Calcium (mg)"
            value={entry.calciumMg}
            error={fieldErrors.calciumMg}
            onChange={(value) => update('calciumMg', value)}
          />
          <NumberField
            label="Iron (mg)"
            value={entry.ironMg}
            error={fieldErrors.ironMg}
            onChange={(value) => update('ironMg', value)}
          />
          <NumberField
            label="Vitamin D (IU)"
            value={entry.vitaminDIU}
            error={fieldErrors.vitaminDIU}
            onChange={(value) => update('vitaminDIU', value)}
          />
          <NumberField
            label="Potassium (mg)"
            value={entry.potassiumMg}
            error={fieldErrors.potassiumMg}
            onChange={(value) => update('potassiumMg', value)}
          />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : id ? 'Save changes' : 'Add to diary'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  children,
  error,
}: {
  children: React.ReactNode
  error?: string
}) {
  return (
    <div>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  error,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  error?: string
}) {
  return (
    <Field error={error}>
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        step="0.01"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        required
      />
    </Field>
  )
}
