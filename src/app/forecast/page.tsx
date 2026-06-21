import Nav from "@/components/Nav";
import { NetWorthAreaChart } from "@/components/Charts";
import RankBadge from "@/components/RankBadge";
import { createClient } from "@/lib/supabase/server";
import { getNetWorthData } from "@/lib/networth";
import { buildForecast, paycheckAmount, type PaySettings } from "@/lib/pay";
import { formatMoney, formatDate } from "@/lib/format";
import { savePaySettings } from "./actions";

const FREQUENCIES = [
  { days: 7, label: "Chaque semaine" },
  { days: 14, label: "Aux 2 semaines" },
  { days: 15, label: "2 fois par mois" },
  { days: 30, label: "Chaque mois" },
];

export default async function ForecastPage() {
  const supabase = await createClient();
  const nw = await getNetWorthData();

  // Dépense quotidienne moyenne sur les 30 derniers jours
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
          <h1 className="text-2xl font-bold">Prévisions 🔮</h1>
          <p className="text-sm text-muted">
            Estime ta valeur nette future à partir de ton salaire et de tes
            dépenses récentes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Paramètres de paie */}
          <section className="card p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Ton salaire</h2>
            <form action={savePaySettings} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  Taux horaire ($)
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
                  Heures par paie
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
                Fréquence de paie
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
                Prochaine paie (ex: prochain vendredi)
                <input
                  name="next_payday"
                  type="date"
                  defaultValue={pay.next_payday || ""}
                  className="input"
                />
              </label>
              <button className="btn-primary mt-1">Enregistrer</button>
            </form>
          </section>

          {/* Résumé */}
          <section className="card p-5 flex flex-col gap-4">
            <h2 className="font-semibold">Résumé</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">Par paie</span>
                <span className="text-xl font-bold tabular-nums text-positive">
                  +{formatMoney(paycheckAmount(pay))}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">Dépenses / jour</span>
                <span className="text-xl font-bold tabular-nums text-negative">
                  −{formatMoney(dailyExpense)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">Valeur nette actuelle</span>
                <span className="text-xl font-bold tabular-nums">
                  {formatMoney(nw.estimated)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">
                  Dans {periods} paies
                </span>
                <span className="text-xl font-bold tabular-nums text-primary">
                  {formatMoney(finalValue)}
                </span>
              </div>
            </div>
            {configured && (
              <div className="pt-2 border-t border-border">
                <span className="text-sm text-muted">Rang projeté :</span>
                <div className="mt-2">
                  <RankBadge amount={finalValue} />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Graphique de prévision */}
        <section className="card p-5">
          <h2 className="font-semibold mb-2">Projection de ta valeur nette</h2>
          {configured ? (
            <NetWorthAreaChart data={chartData} color="#10b981" />
          ) : (
            <p className="text-sm text-muted py-12 text-center">
              Renseigne ton taux horaire et tes heures par paie pour voir la
              projection.
            </p>
          )}
        </section>

        {/* Tableau des paies à venir */}
        {configured && (
          <section className="card p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Paies à venir</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date de paie</th>
                    <th className="px-3 py-2 font-medium text-right">
                      Valeur nette projetée
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
