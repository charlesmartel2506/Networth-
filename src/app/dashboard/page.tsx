import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate } from "@/lib/format";
import { addEntry, createGroup, joinGroup } from "./actions";

type Entry = {
  id: string;
  assets: string;
  liabilities: string;
  amount: string;
  note: string | null;
  recorded_at: string;
};

type Group = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
};

// Quelques conseils simples basés sur les données.
function buildTips(entries: Entry[]): string[] {
  const tips: string[] = [];
  if (entries.length === 0) {
    return ["Ajoute ta première entrée pour démarrer le suivi !"];
  }
  const latest = entries[0];
  const assets = parseFloat(latest.assets);
  const liabilities = parseFloat(latest.liabilities);
  const amount = parseFloat(latest.amount);

  if (liabilities > assets * 0.5 && liabilities > 0) {
    tips.push(
      "Tes dettes représentent une grosse part de tes actifs. Cible le remboursement des dettes à taux d'intérêt élevé en premier.",
    );
  }
  if (amount < 0) {
    tips.push(
      "Ta valeur nette est négative. Concentre-toi sur la réduction des dettes et la création d'un petit fonds d'urgence.",
    );
  }
  if (entries.length >= 2) {
    const prev = parseFloat(entries[1].amount);
    if (amount > prev) {
      tips.push(
        `Bravo ! Ta valeur nette a augmenté de ${formatMoney(amount - prev)} depuis ta dernière entrée. Continue !`,
      );
    } else if (amount < prev) {
      tips.push(
        `Ta valeur nette a baissé de ${formatMoney(prev - amount)}. Revois tes dépenses récentes.`,
      );
    }
  }
  tips.push(
    "Vise à épargner/investir au moins 20 % de tes revenus pour faire croître ta valeur nette dans le temps.",
  );
  return tips;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", user!.id)
    .single();

  const { data: entriesData } = await supabase
    .from("net_worth_entries")
    .select("id, assets, liabilities, amount, note, recorded_at")
    .eq("user_id", user!.id)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false });

  const entries = (entriesData ?? []) as Entry[];

  const { data: groupsData } = await supabase
    .from("groups")
    .select("id, name, invite_code, owner_id");
  const groups = (groupsData ?? []) as Group[];

  const current = entries[0] ? parseFloat(entries[0].amount) : 0;
  const tips = buildTips(entries);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Nav displayName={profile?.display_name} />
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Valeur nette actuelle */}
        <section className="rounded-2xl border border-foreground/10 p-6 flex flex-col gap-1">
          <span className="text-sm opacity-60">Ta valeur nette actuelle</span>
          <span className="text-4xl font-bold tabular-nums">
            {formatMoney(current)}
          </span>
          {entries[0] && (
            <span className="text-sm opacity-60">
              au {formatDate(entries[0].recorded_at)}
            </span>
          )}
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Ajouter une entrée */}
          <section className="flex flex-col gap-4">
            <h2 className="font-semibold">Ajouter une entrée</h2>
            <form
              action={addEntry}
              className="flex flex-col gap-3 rounded-2xl border border-foreground/10 p-5"
            >
              <label className="flex flex-col gap-1 text-sm">
                Actifs (épargne, placements, biens…)
                <input
                  name="assets"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0"
                  className="rounded-lg border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
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
                  className="rounded-lg border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Date
                <input
                  name="recorded_at"
                  type="date"
                  defaultValue={today}
                  className="rounded-lg border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Note (optionnel)
                <input
                  name="note"
                  type="text"
                  placeholder="Ex: après remboursement auto"
                  className="rounded-lg border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
                />
              </label>
              <button className="mt-1 rounded-full bg-foreground text-background px-5 py-2.5 font-medium hover:opacity-90 transition">
                Enregistrer
              </button>
            </form>
          </section>

          {/* Conseils */}
          <section className="flex flex-col gap-4">
            <h2 className="font-semibold">Conseils pour t&apos;améliorer 💡</h2>
            <ul className="flex flex-col gap-3">
              {tips.map((tip, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-sm"
                >
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Historique */}
        <section className="flex flex-col gap-4">
          <h2 className="font-semibold">Historique</h2>
          {entries.length === 0 ? (
            <p className="text-sm opacity-60">Aucune entrée pour l&apos;instant.</p>
          ) : (
            <div className="rounded-2xl border border-foreground/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-foreground/[0.03] text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium text-right">Actifs</th>
                    <th className="px-4 py-2 font-medium text-right">Dettes</th>
                    <th className="px-4 py-2 font-medium text-right">
                      Valeur nette
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-t border-foreground/10">
                      <td className="px-4 py-2">
                        {formatDate(e.recorded_at)}
                        {e.note && (
                          <span className="opacity-50"> — {e.note}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatMoney(e.assets)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatMoney(e.liabilities)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">
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
        <section className="flex flex-col gap-4">
          <h2 className="font-semibold">Tes groupes d&apos;amis</h2>

          {groups.length > 0 && (
            <div className="flex flex-col gap-2">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="rounded-xl border border-foreground/10 px-4 py-3 flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{g.name}</span>
                  <span className="opacity-60">
                    Code d&apos;invitation :{" "}
                    <code className="font-mono bg-foreground/10 rounded px-1.5 py-0.5">
                      {g.invite_code}
                    </code>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <form
              action={createGroup}
              className="flex flex-col gap-3 rounded-2xl border border-foreground/10 p-5"
            >
              <span className="text-sm font-medium">Créer un groupe</span>
              <input
                name="name"
                type="text"
                required
                placeholder="Nom du groupe (ex: Les Amis)"
                className="rounded-lg border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40 text-sm"
              />
              <button className="rounded-full bg-foreground text-background px-5 py-2 font-medium hover:opacity-90 transition text-sm">
                Créer
              </button>
            </form>

            <form
              action={joinGroup}
              className="flex flex-col gap-3 rounded-2xl border border-foreground/10 p-5"
            >
              <span className="text-sm font-medium">Rejoindre un groupe</span>
              <input
                name="code"
                type="text"
                required
                placeholder="Code d'invitation"
                className="rounded-lg border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40 text-sm uppercase"
              />
              <button className="rounded-full border border-foreground/20 px-5 py-2 font-medium hover:bg-foreground/5 transition text-sm">
                Rejoindre
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
