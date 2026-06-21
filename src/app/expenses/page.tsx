import Nav from "@/components/Nav";
import { ExpensesBarChart } from "@/components/Charts";
import { createClient } from "@/lib/supabase/server";
import { getNetWorthData } from "@/lib/networth";
import { formatMoney, formatDate } from "@/lib/format";
import { addExpense, deleteExpense } from "./actions";

const CATEGORIES: { name: string; color: string }[] = [
  { name: "Logement", color: "#6d5efc" },
  { name: "Nourriture", color: "#10b981" },
  { name: "Transport", color: "#f59e0b" },
  { name: "Loisirs", color: "#a855f7" },
  { name: "Factures", color: "#38bdf8" },
  { name: "Santé", color: "#f43f5e" },
  { name: "Autre", color: "#9aa3b2" },
];

function colorFor(cat: string): string {
  return CATEGORIES.find((c) => c.name === cat)?.color ?? "#9aa3b2";
}

type Expense = {
  id: string;
  amount: string;
  category: string | null;
  note: string | null;
  spent_at: string;
};

export default async function ExpensesPage() {
  const supabase = await createClient();
  const nw = await getNetWorthData();

  const { data: expData } = await supabase
    .from("expenses")
    .select("id, amount, category, note, spent_at")
    .order("spent_at", { ascending: false })
    .order("created_at", { ascending: false });
  const expenses = (expData ?? []) as Expense[];

  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  // Total par catégorie pour le graphique
  const byCat = new Map<string, number>();
  for (const e of expenses) {
    const c = e.category || "Autre";
    byCat.set(c, (byCat.get(c) ?? 0) + parseFloat(e.amount));
  }
  const chartData = Array.from(byCat.entries())
    .map(([label, value]) => ({ label, value, color: colorFor(label) }))
    .sort((a, b) => b.value - a.value);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Nav displayName={nw.displayName} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Dépenses 💸</h1>
          <p className="text-sm text-muted">
            Tes dépenses se soustraient de ta valeur nette estimée.
          </p>
        </div>

        <section className="grid sm:grid-cols-3 gap-4">
          <div className="card p-5 flex flex-col gap-1">
            <span className="text-sm text-muted">Total des dépenses</span>
            <span className="text-2xl font-bold tabular-nums text-negative">
              −{formatMoney(total)}
            </span>
          </div>
          <div className="card p-5 flex flex-col gap-1">
            <span className="text-sm text-muted">Dernière valeur nette</span>
            <span className="text-2xl font-bold tabular-nums">
              {formatMoney(nw.snapshot)}
            </span>
          </div>
          <div className="card p-5 flex flex-col gap-1">
            <span className="text-sm text-muted">Valeur nette estimée</span>
            <span className="text-2xl font-bold tabular-nums text-primary">
              {formatMoney(nw.estimated)}
            </span>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Ajouter une dépense */}
          <section className="card p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Ajouter une dépense</h2>
            <form action={addExpense} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Montant
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0"
                  className="input"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  Catégorie
                  <select name="category" className="input" defaultValue="Autre">
                    {CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Date
                  <input
                    name="spent_at"
                    type="date"
                    defaultValue={today}
                    className="input"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Note
                <input
                  name="note"
                  type="text"
                  placeholder="Optionnel (ex: épicerie)"
                  className="input"
                />
              </label>
              <button className="btn-primary mt-1">Ajouter la dépense</button>
            </form>
          </section>

          {/* Graphique par catégorie */}
          <section className="card p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Par catégorie</h2>
            {chartData.length > 0 ? (
              <ExpensesBarChart data={chartData} />
            ) : (
              <p className="text-sm text-muted py-12 text-center">
                Ajoute une dépense pour voir la répartition.
              </p>
            )}
          </section>
        </div>

        {/* Liste */}
        <section className="card p-5 flex flex-col gap-3">
          <h2 className="font-semibold">Historique des dépenses</h2>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted">Aucune dépense pour l&apos;instant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Catégorie</th>
                    <th className="px-3 py-2 font-medium">Note</th>
                    <th className="px-3 py-2 font-medium text-right">Montant</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-3 py-2">{formatDate(e.spent_at)}</td>
                      <td className="px-3 py-2">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            background: `${colorFor(e.category || "Autre")}22`,
                            color: colorFor(e.category || "Autre"),
                          }}
                        >
                          {e.category || "Autre"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted">{e.note || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-negative">
                        −{formatMoney(e.amount)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <form action={deleteExpense}>
                          <input type="hidden" name="id" value={e.id} />
                          <button
                            className="text-muted hover:text-negative transition"
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
