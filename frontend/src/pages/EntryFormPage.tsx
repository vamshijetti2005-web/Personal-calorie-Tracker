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
import type {
  EntryInput,
  ExtractionResponse,
  MealType,
  NutritionExtraction,
} from '../types'

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
  const [loadFailed, setLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ExtractionResponse | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
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
      .catch((cause) => {
        setLoadFailed(true)
        setError(cause instanceof Error ? cause.message : 'Could not load entry')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

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

  function applyExtraction(extraction: NutritionExtraction) {
    setEntry((current) => ({
      ...current,
      ...(extraction.foodName != null
        ? { foodName: extraction.foodName }
        : {}),
      ...(extraction.quantity != null
        ? { quantity: Number(extraction.quantity) }
        : {}),
      ...(extraction.servingUnit != null
        ? { servingUnit: extraction.servingUnit }
        : {}),
      ...(extraction.calories != null
        ? { calories: Number(extraction.calories) }
        : {}),
      ...(extraction.proteinGrams != null
        ? { proteinGrams: Number(extraction.proteinGrams) }
        : {}),
      ...(extraction.carbsGrams != null
        ? { carbsGrams: Number(extraction.carbsGrams) }
        : {}),
      ...(extraction.fatGrams != null
        ? { fatGrams: Number(extraction.fatGrams) }
        : {}),
      ...(extraction.vitaminCMg != null
        ? { vitaminCMg: Number(extraction.vitaminCMg) }
        : {}),
      ...(extraction.calciumMg != null
        ? { calciumMg: Number(extraction.calciumMg) }
        : {}),
      ...(extraction.ironMg != null
        ? { ironMg: Number(extraction.ironMg) }
        : {}),
      ...(extraction.vitaminDIU != null
        ? { vitaminDIU: Number(extraction.vitaminDIU) }
        : {}),
      ...(extraction.potassiumMg != null
        ? { potassiumMg: Number(extraction.potassiumMg) }
        : {}),
    }))
  }

  async function analyzeImage(file?: File) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size cannot exceed 5 MB')
      return
    }

    setPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
    setAnalyzing(true)
    setAnalysis(null)
    setError(null)
    try {
      const result = await api.ai.extract(file)
      setAnalysis(result)
      if (result.status !== 'failed') {
        applyExtraction(result.extraction)
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not analyze the image',
      )
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) return <LoadingBlock />
  if (id && loadFailed) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Entry unavailable"
          title="This meal could not be loaded"
          description="It may have been deleted or the link may be invalid."
        />
        <ErrorBanner error={error} />
        <Button variant="secondary" onClick={() => navigate('/diary')}>
          Back to diary
        </Button>
      </div>
    )
  }

  return (
    <form className="space-y-6" onSubmit={(event) => void submit(event)}>
      <PageHeader
        eyebrow={id ? 'Update entry' : 'New entry'}
        title={id ? 'Edit this meal' : 'Log what you ate'}
        description="Capture serving details, macros, and a focused set of micronutrients."
      />

      <ErrorBanner error={error} />

      {!id && (
        <Card className="overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-amber-400 text-lg">
                  ✦
                </span>
                <h2 className="font-display text-2xl text-emerald-950">
                  Fill from a photo
                </h2>
              </div>
              <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                Upload a nutrition label or a plate of food. Gemini will suggest
                values; review every field before saving.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="inline-flex min-h-10 cursor-pointer items-center rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800">
                  {analyzing ? 'Analyzing…' : 'Choose image'}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={analyzing}
                    onChange={(event) =>
                      void analyzeImage(event.target.files?.[0])
                    }
                  />
                </label>
                <span className="text-xs text-stone-400">
                  JPEG, PNG, or WebP · max 5 MB
                </span>
              </div>
            </div>
            {preview && (
              <img
                src={preview}
                alt="Selected food"
                className="size-28 rounded-2xl border border-white object-cover shadow-lg"
              />
            )}
          </div>

          {analysis && (
            <div className="mt-5 rounded-2xl border border-amber-200/70 bg-white/80 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    analysis.status === 'ok'
                      ? 'bg-emerald-100 text-emerald-800'
                      : analysis.status === 'partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {analysis.status === 'ok'
                    ? 'Extraction complete'
                    : analysis.status === 'partial'
                      ? 'Partial result'
                      : 'Could not identify nutrition'}
                </span>
                <span className="text-xs capitalize text-stone-400">
                  {analysis.extraction.confidence} confidence
                </span>
              </div>
              {analysis.extraction.notes && (
                <p className="mt-2 text-sm text-stone-600">
                  {analysis.extraction.notes}
                </p>
              )}
              {analysis.extraction.warnings.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-800">
                  {analysis.extraction.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2 className="font-display text-2xl text-emerald-950">Meal details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field error={fieldErrors.foodName}>
            <Label htmlFor="food-name">Food name</Label>
            <Input
              id="food-name"
              value={entry.foodName}
              maxLength={160}
              placeholder="e.g. Rice and dal"
              onChange={(event) => update('foodName', event.target.value)}
              required
            />
          </Field>
          <Field error={fieldErrors.mealType}>
            <Label htmlFor="meal-type">Meal type</Label>
            <Select
              id="meal-type"
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
            <Label htmlFor="serving-unit">Serving unit</Label>
            <Input
              id="serving-unit"
              value={entry.servingUnit}
              maxLength={40}
              placeholder="plate, bowl, g, ml"
              onChange={(event) => update('servingUnit', event.target.value)}
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <Field error={fieldErrors.consumedAt}>
              <Label htmlFor="consumed-at">Consumed at</Label>
              <Input
                id="consumed-at"
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
  const id = `entry-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`
  return (
    <Field error={error}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
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
