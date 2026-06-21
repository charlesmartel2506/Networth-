export type PaySettings = {
  hourly_rate: number;
  hours_per_paycheck: number;
  frequency_days: number;
  next_payday: string | null;
};

export function paycheckAmount(s: PaySettings): number {
  return (s.hourly_rate || 0) * (s.hours_per_paycheck || 0);
}

export type ForecastPoint = {
  date: string; // AAAA-MM-JJ
  label: string;
  value: number;
  paycheck: boolean;
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Projette la valeur nette sur `periods` paies à venir.
// dailyExpense = dépense moyenne par jour (soustraite en continu).
export function buildForecast(
  startValue: number,
  settings: PaySettings,
  dailyExpense: number,
  periods: number,
): ForecastPoint[] {
  const pay = paycheckAmount(settings);
  const freq = Math.max(1, settings.frequency_days || 14);
  const today = new Date(new Date().toISOString().slice(0, 10));

  // Première paie à venir : on part de next_payday (ou aujourd'hui + freq).
  let payday = settings.next_payday
    ? new Date(settings.next_payday)
    : addDays(today, freq);
  while (payday < today) payday = addDays(payday, freq);

  const points: ForecastPoint[] = [
    {
      date: iso(today),
      label: "Today",
      value: Math.round(startValue),
      paycheck: false,
    },
  ];

  let value = startValue;
  let prevDate = today;

  for (let i = 0; i < periods; i++) {
    const daysSpan = Math.round(
      (payday.getTime() - prevDate.getTime()) / 86400000,
    );
    value += pay - dailyExpense * Math.max(0, daysSpan);
    points.push({
      date: iso(payday),
      label: new Intl.DateTimeFormat("en-CA", {
        month: "short",
        day: "numeric",
      }).format(payday),
      value: Math.round(value),
      paycheck: true,
    });
    prevDate = payday;
    payday = addDays(payday, freq);
  }

  return points;
}
