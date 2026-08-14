/** Inclusive UTC day start for a YYYY-MM-DD or ISO datetime string. */
export function startOfUtcDay(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date;
}

/** Exclusive UTC end: next day 00:00 for a date-only string, otherwise the instant itself. */
export function exclusiveEnd(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const start = new Date(`${value}T00:00:00.000Z`);
    start.setUTCDate(start.getUTCDate() + 1);
    return start;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date;
}

export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
