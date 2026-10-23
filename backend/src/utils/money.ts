export function asMoney(value: unknown): string {
  const raw = String(value ?? '0').trim();
  const numberValue = Number(raw);
  if (!Number.isFinite(numberValue)) {
    return '0.00';
  }
  return numberValue.toFixed(2);
}

export function asCount(value: unknown): number {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) {
    return 0;
  }
  return Math.trunc(numberValue);
}
