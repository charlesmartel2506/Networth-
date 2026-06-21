import Link from "next/link";
import Nav from "@/components/Nav";
import RankBadge from "@/components/RankBadge";
import { NetWorthAreaChart } from "@/components/Charts";
import { createClient } from "@/lib/supabase/server";
import { getNetWorthData, type Entry } from "@/lib/networth";
import { getRank } from "@/lib/ranks";
import { formatMoney, formatDate } from "@/lib/format";
import { addEntry, createGroup, joinGroup } from "./actions";

type Group = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
};

function buildTips(entries: Entry[], estimated: number, expensesSince: number): string[] {
  const tips: string[] = [];
  if (entries.length === 0) {
    return ["Ajoute ta première valeur nette pour démarrer le suivi !"];
  }
  if (expensesSince > 0) {
    tips.push(
      `Tu as dépensé ${formatMoney(expensesSince)} depuis ta dernière mise à jour. Pense à mettre à jour ta valeur nette.`,
    );
  }
  if (estimated < 0) {
    tips.push(
      "Ta valeur nette est négative. Concentre-toi sur la réduction des dettes et un petit fonds d'urgence.",
    );
  }
  if (entries.length >= 2) {
    const prev = parseFloat(entries[1].amount);
    const cur = parseFloat(entries[0].amount);
    if (cur > prev)
      tips.push(
        `Bravo ! +${formatMoney(cur - prev)} depuis ta saisie précédente. Continue !`,
      );
  }
  tips.push(
    "Épargne/investis au moins 20 % de tes revenus pour faire croître ta valeur nette.",
  );
  return tips;
}

export default async function DashboardPage() {
  const data = await getNetWorthData();
  const supabase = await createClient();
  const { data: groupsData } = await supabase
    .from("groups")
    .select("id, name, invite_code, owner_id");
  const groups = (groupsData ?? []) as Group[];

  const rank = getRank(data.estimated);
  const tips = buildTips(data.entries, data.estimated, data.expensesSince);
  const today = new Date().toISOString().slice(0, 10);

  const chartData = [
    ...data.entries
      .slice()
      .reverse()
      .map((e) => ({
        label: formatDate(e.recorded_at).replace(/ \d{4}$/, ""),
        value: parseFloat(e.amount),
      })),
  ];
  if (data.expensesSince > 0) {
    chartData.push({ label: "Estimé", value: data.estimated });
  }

  return (
    <>
      <Nav displayName={data.displayName} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* En-tête : valeur nette + rang */}
        <section className="grid md:grid-cols-3 gap-4">
          <div
            className="card p-6 md:col-span-2 flex flex-col gap-1 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${rank.color}, var(--primary-2))`,
            }}
          >
            <span className="text-sm opacity-90">Ta valeur nette estimée</span>
            <span className="text-4xl sm:text-5xl font-bold tabular-nums">
              {formatMoney(data.estimated)}
            </span>
            <span className="text-sm opacity-90">
              {data.snapshotDate
                ? `Dernière saisie : ${formatMoney(data.snapshot)} au ${formatDate(data.snapshotDate)}`
                : "Aucune saisie pour l'instant"}
              {data.expensesSince > 0 &&
                ` · −${formatMoney(data.expensesSince)} de dépenses`}
            </span>
          </div>
          <div className="card p-6 flex flex-col justify-center gap-3">
            <RankBadge amount={data.estimated} size="lg" />
            <Link href="/ranks" className="text-xs text-primary font-medium">
              Voir tous les rangs →
            </Link>
          </div>
        </section>

        {/* Graphique */}
        <section className="card p-5">
          <h2 className="font-semibold mb-2">Évolution de ta valeur nette</h2>
          {chartData.length > 0 ? (
            <NetWorthAreaChart data={chartData} color={rank.color} />
          ) : (
            <p className="text-sm text-muted py-12 text-center">
              Ajoute des entrées pour voir ta courbe apparaître.
            </p>
          )}
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Ajouter une entrée */}
          <section className="card p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Mettre à jour ma valeur nette</h2>
            <form action={addEntry} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Actifs (épargne, placements, biens…)
                <input
                  name="assets"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0"
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Dettes (prêts, cartes de crédit…)
                <input
                  name="liabilities"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0"
                  className="input"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  Date
                  <input
                    name="recorded_at"
                    type="date"
                    defaultValue={today}
                    className="input"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Note
                  <input
                    name="note"
                    type="text"
                    placeholder="Optionnel"
                    className="input"
                  />
                </label>
              </div>
              <button className="btn-primary mt-1">Enregistrer</button>
            </form>
          </section>

          {/* Conseils */}
          <section className="card p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Conseils 💡</h2>
            <ul className="flex flex-col gap-2">
              {tips.map((tip, i) => (
                <li
                  key={i}
                  className="rounded-xl bg-surface-2 px-4 py-3 text-sm border-l-4"
                  style={{ borderColor: "var(--primary)" }}
                >
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Historique */}
        <section className="card p-5 flex flex-col gap-3">
          <h2 className="font-semibold">Historique</h2>
          {data.entries.length === 0 ? (
            <p className="text-sm text-muted">Aucune entrée pour l&apos;instant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium text-right">Actifs</th>
                    <th className="px-3 py-2 font-medium text-right">Dettes</th>
                    <th className="px-3 py-2 font-medium text-right">Valeur nette</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-3 py-2">
                        {formatDate(e.recorded_at)}
                        {e.note && <span className="text-muted"> — {e.note}</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-positive">
                        {formatMoney(e.assets)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-negative">
                        {formatMoney(e.liabilities)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">
                        {formatMoney(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Groupes */}
        <section className="card p-5 flex flex-col gap-3">
          <h2 className="font-semibold">Tes groupes d&apos;amis</h2>
          {groups.length > 0 && (
            <div className="flex flex-col gap-2">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="rounded-xl bg-surface-2 px-4 py-3 flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{g.name}</span>
                  <span className="text-muted">
                    Code :{" "}
                    <code className="font-mono bg-primary/10 text-primary rounded px-1.5 py-0.5">
                      {g.invite_code}
                    </code>
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <form action={createGroup} className="flex flex-col gap-2">
              <span className="text-sm font-medium">Créer un groupe</span>
              <input
                name="name"
                type="text"
                required
                placeholder="Nom du groupe"
                className="input"
              />
              <button className="btn-primary">Créer</button>
            </form>
            <form action={joinGroup} className="flex flex-col gap-2">
              <span className="text-sm font-medium">Rejoindre un groupe</span>
              <input
                name="code"
                type="text"
                required
                placeholder="Code d'invitation"
                className="input uppercase"
              />
              <button className="btn-ghost">Rejoindre</button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
