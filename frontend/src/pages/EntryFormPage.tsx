import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { extractNutrition } from "../api/ai";
import { RequestError } from "../api/client";
import { createEntry, getEntry, updateEntry, type EntryPayload } from "../api/entries";
import { Button, Card, ErrorBanner, Input, Label, Select } from "../components/ui/Field";
import { fromDateTimeLocal, toDateTimeLocal } from "../lib/dates";
import type { MealType, NutritionExtraction } from "../types";

const emptyForm: EntryPayload = {
  mealType: "LUNCH",
  foodName: "",
  quantity: 1,
  servingUnit: "serving",
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
};

export function EntryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<EntryPayload>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getEntry(id)
      .then((res) => setForm({ ...res.data }))
      .catch((err) => setError(err instanceof RequestError ? err.message : "Failed to load entry"));
  }, [id]);

  function set<K extends keyof EntryPayload>(key: K, value: EntryPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyExtraction(extraction: NutritionExtraction) {
    setForm((current) => ({
      ...current,
      foodName: extraction.foodName ?? current.foodName,
      quantity: extraction.quantity ?? current.quantity,
      servingUnit: extraction.servingUnit ?? current.servingUnit,
      calories: extraction.calories ?? current.calories,
      proteinGrams: extraction.proteinGrams ?? current.proteinGrams,
      carbsGrams: extraction.carbsGrams ?? current.carbsGrams,
      fatGrams: extraction.fatGrams ?? current.fatGrams,
      vitaminCMg: extraction.vitaminCMg ?? current.vitaminCMg,
      calciumMg: extraction.calciumMg ?? current.calciumMg,
      ironMg: extraction.ironMg ?? current.ironMg,
      vitaminDIU: extraction.vitaminDIU ?? current.vitaminDIU,
      potassiumMg: extraction.potassiumMg ?? current.potassiumMg,
    }));
    setAiNote(extraction.notes || `AI confidence: ${extraction.confidence}`);
    setAiWarnings(extraction.warnings);
  }

  async function onImage(file: File | undefined) {
    if (!file) return;
    setExtracting(true);
    setError(null);
    setAiNote(null);
    setAiWarnings([]);
    try {
      const result = await extractNutrition(file);
      applyExtraction(result.extraction);
      if (result.status === "failed") {
        setError("The model could not confidently read calories or macros. Review the partial fields and fill the rest.");
      } else if (result.status === "partial") {
        setAiNote(
          `${result.extraction.notes || "Partial extraction."} Confidence: ${result.extraction.confidence}.`,
        );
      }
    } catch (err) {
      setError(err instanceof RequestError ? err.message : "Image analysis failed");
    } finally {
      setExtracting(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (id) await updateEntry(id, form);
      else await createEntry(form);
      navigate("/diary");
    } catch (err) {
      setError(err instanceof RequestError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <header>
        <h1 className="font-display text-4xl text-forest">{id ? "Edit meal" : "Log a meal"}</h1>
        <p className="text-sm text-ink/55">
          Enter values by hand or upload a nutrition label / plate photo to pre-fill the form.
        </p>
      </header>

      <Card>
        <Label>Photo (optional)</Label>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => void onImage(e.target.files?.[0])}
        />
        <p className="mt-2 text-xs text-ink/50">
          {extracting ? "Reading the image…" : "JPEG, PNG, WebP, or GIF up to 5 MB."}
        </p>
        {aiNote && <p className="mt-3 text-sm text-forest">{aiNote}</p>}
        {aiWarnings.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-clay">
            {aiWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Food name</Label>
          <Input value={form.foodName} onChange={(e) => set("foodName", e.target.value)} required />
        </div>
        <div>
          <Label>Meal</Label>
          <Select value={form.mealType} onChange={(e) => set("mealType", e.target.value as MealType)}>
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
            <option value="SNACKS">Snacks</option>
          </Select>
        </div>
        <div>
          <Label>Quantity</Label>
          <Input type="number" min={0.01} step="0.01" value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value))} required />
        </div>
        <div>
          <Label>Unit</Label>
          <Input value={form.servingUnit} onChange={(e) => set("servingUnit", e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <Label>Consumed at</Label>
          <Input
            type="datetime-local"
            value={toDateTimeLocal(form.consumedAt)}
            onChange={(e) => set("consumedAt", fromDateTimeLocal(e.target.value))}
            required
          />
        </div>
      </Card>

      <Card className="grid gap-4 md:grid-cols-4">
        <NumberField label="Calories" value={form.calories} onChange={(n) => set("calories", n)} />
        <NumberField label="Protein (g)" value={form.proteinGrams} onChange={(n) => set("proteinGrams", n)} />
        <NumberField label="Carbs (g)" value={form.carbsGrams} onChange={(n) => set("carbsGrams", n)} />
        <NumberField label="Fat (g)" value={form.fatGrams} onChange={(n) => set("fatGrams", n)} />
      </Card>

      <Card className="grid gap-4 md:grid-cols-5">
        <NumberField label="Vitamin C (mg)" value={form.vitaminCMg} onChange={(n) => set("vitaminCMg", n)} />
        <NumberField label="Calcium (mg)" value={form.calciumMg} onChange={(n) => set("calciumMg", n)} />
        <NumberField label="Iron (mg)" value={form.ironMg} onChange={(n) => set("ironMg", n)} />
        <NumberField label="Vitamin D (IU)" value={form.vitaminDIU} onChange={(n) => set("vitaminDIU", n)} />
        <NumberField label="Potassium (mg)" value={form.potassiumMg} onChange={(n) => set("potassiumMg", n)} />
      </Card>

      <ErrorBanner message={error} />
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : id ? "Save changes" : "Add entry"}
      </Button>
    </form>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" min={0} step="0.01" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
