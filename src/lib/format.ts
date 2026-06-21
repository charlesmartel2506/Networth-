// Formate un montant en devise canadienne.
export function formatMoney(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n as number) ? (n as number) : 0);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  // Une date "AAAA-MM-JJ" est interprétée en UTC par `new Date`, ce qui
  // décale d'un jour selon le fuseau. On force une date locale.
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  const date =
    y && m && d ? new Date(y, m - 1, d) : new Date(value);
  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
