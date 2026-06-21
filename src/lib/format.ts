// Formats an amount in Canadian dollars.
export function formatMoney(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n as number) ? (n as number) : 0);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  // A "YYYY-MM-DD" date is parsed as UTC by `new Date`, which can shift by a
  // day depending on the timezone. Force a local date instead.
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  const date = y && m && d ? new Date(y, m - 1, d) : new Date(value);
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
