import Nav from "@/components/Nav";
import { NetWorthAreaChart } from "@/components/Charts";
import RankBadge from "@/components/RankBadge";
import { createClient } from "@/lib/supabase/server";
import { getNetWorthData } from "@/lib/networth";
import { buildForecast, paycheckAmount, type PaySettings } from "@/lib/pay";
import { formatMoney, formatDate } from "@/lib/format";
import { savePaySettings } from "./actions";

const FREQUENCIES = [
  { days: 7, label: "Every week" },
  { days: 14, label: "Every 2 weeks" },
  { days: 15, label: "Twice a month" },
  { days: 30, label: "Every month" },
];

export default async function ForecastPage() {
  const supabase = await createClient();
  const nw = await getNetWorthData();

  // Average daily spending over the last 30 days
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const { data: recentExp } = await supabase
    .from("expenses")
    .select("amount")
    .gte("spent_at", since);
  const totalRecent = (recentExp ?? []).reduce(
    (s, e) => s + parseFloat(e.amount as unknown as string),
    0,
  );
  const dailyExpense = totalRecent / 30;

  const pay: PaySettings = nw.pay ?? {
    hourly_rate: 0,
    hours_per_paycheck: 0,
    frequency_days: 14,
    next_payday: null,
  };

  const configured = paycheckAmount(pay) > 0;
  const periods = 8;
  const forecast = configured
    ? buildForecast(nw.estimated, pay, dailyExpense, periods)
    : [];
  const chartData = forecast.map((p) => ({ label: p.label, value: p.value }));
  const finalValue = forecast.length
    ? forecast[forecast.length - 1].value
    : nw.estimated;

  return (
    <>
      <Nav displayName={nw.displayName} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Forecast 🔮</h1>
          <p className="text-sm text-muted">
            Estimate your future net worth based on your salary and recent
            spending.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pay settings */}
          <section className="card p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Your salary</h2>
            <form action={savePaySettings} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  Hourly rate ($)
                  <input
                    name="hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={pay.hourly_rate || ""}
                    placeholder="20.00"
                    className="input"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Hours per paycheck
                  <input
                    name="hours_per_paycheck"
                    type="number"
                    step="0.5"
                    min="0"
                    defaultValue={pay.hours_per_paycheck || ""}
                    placeholder="80"
                    className="input"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Pay frequency
                <select
                  name="frequency_days"
                  className="input"
                  defaultValue={String(pay.frequency_days || 14)}
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.days} value={f.days}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Next payday (e.g. next Friday)
                <input
                  name="next_payday"
                  type="date"
                  defaultValue={pay.next_payday || ""}
                  className="input"
                />
              </label>
              <button className="btn-primary mt-1">Save</button>
            </form>
          </section>

          {/* Summary */}
          <section className="card p-5 flex flex-col gap-4">
            <h2 className="font-semibold">Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">Per paycheck</span>
                <span className="text-xl font-bold tabular-nums text-positive">
                  +{formatMoney(paycheckAmount(pay))}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">Spending / day</span>
                <span className="text-xl font-bold tabular-nums text-negative">
                  −{formatMoney(dailyExpense)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">Current net worth</span>
                <span className="text-xl font-bold tabular-nums">
                  {formatMoney(nw.estimated)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">In {periods} paychecks</span>
                <span className="text-xl font-bold tabular-nums text-primary">
                  {formatMoney(finalValue)}
                </span>
              </div>
            </div>
            {configured && (
              <div className="pt-2 border-t border-border">
                <span className="text-sm text-muted">Projected rank:</span>
                <div className="mt-2">
                  <RankBadge amount={finalValue} />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Forecast chart */}
        <section className="card p-5">
          <h2 className="font-semibold mb-2">Net worth projection</h2>
          {configured ? (
            <NetWorthAreaChart data={chartData} color="#10b981" />
          ) : (
            <p className="text-sm text-muted py-12 text-center">
              Enter your hourly rate and hours per paycheck to see the
              projection.
            </p>
          )}
        </section>

        {/* Upcoming paydays table */}
        {configured && (
          <section className="card p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Upcoming paydays</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Payday</th>
                    <th className="px-3 py-2 font-medium text-right">
                      Projected net worth
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {forecast
                    .filter((p) => p.paycheck)
                    .map((p, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2">{formatDate(p.date)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-primary">
                          {formatMoney(p.value)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
