import { Decimal } from "@prisma/client/runtime/library";

export function toNumber(value: Decimal | number | string | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
