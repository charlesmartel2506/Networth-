import Nav from "@/components/Nav";
import { ExpensesBarChart } from "@/components/Charts";
import { createClient } from "@/lib/supabase/server";
import { getNetWorthData } from "@/lib/networth";
import { formatMoney, formatDate } from "@/lib/format";
import { addExpense, deleteExpense } from "./actions";

const CATEGORIES: { name: string; color: string }[] = [
  { name: "Housing", color: "#6d5efc" },
  { name: "Food", color: "#10b981" },
  { name: "Transport", color: "#f59e0b" },
  { name: "Leisure", color: "#a855f7" },
  { name: "Bills", color: "#38bdf8" },
  { name: "Health", color: "#f43f5e" },
  { name: "Other", color: "#9aa3b2" },
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

  // Total per category for the chart
  const byCat = new Map<string, number>();
  for (const e of expenses) {
    const c = e.category || "Other";
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
          <h1 className="text-2xl font-bold">Expenses 💸</h1>
          <p className="text-sm text-muted">
            Your expenses are subtracted from your estimated net worth.
          </p>
        </div>

        <section className="grid sm:grid-cols-3 gap-4">
          <div className="card p-5 flex flex-col gap-1">
            <span className="text-sm text-muted">Total expenses</span>
            <span className="text-2xl font-bold tabular-nums text-negative">
              −{formatMoney(total)}
            </span>
          </div>
          <div className="card p-5 flex flex-col gap-1">
            <span className="text-sm text-muted">Last net worth</span>
            <span className="text-2xl font-bold tabular-nums">
              {formatMoney(nw.snapshot)}
            </span>
          </div>
          <div className="card p-5 flex flex-col gap-1">
            <span className="text-sm text-muted">Estimated net worth</span>
            <span className="text-2xl font-bold tabular-nums text-primary">
              {formatMoney(nw.estimated)}
            </span>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Add an expense */}
          <section className="card p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Add an expense</h2>
            <form action={addExpense} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Amount
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
                  Category
                  <select name="category" className="input" defaultValue="Other">
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
                  placeholder="Optional (e.g. groceries)"
                  className="input"
                />
              </label>
              <button className="btn-primary mt-1">Add expense</button>
            </form>
          </section>

          {/* Chart by category */}
          <section className="card p-5 flex flex-col gap-3">
            <h2 className="font-semibold">By category</h2>
            {chartData.length > 0 ? (
              <ExpensesBarChart data={chartData} />
            ) : (
              <p className="text-sm text-muted py-12 text-center">
                Add an expense to see the breakdown.
              </p>
            )}
          </section>
        </div>

        {/* List */}
        <section className="card p-5 flex flex-col gap-3">
          <h2 className="font-semibold">Expense history</h2>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted">No expenses yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Note</th>
                    <th className="px-3 py-2 font-medium text-right">Amount</th>
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
                            background: `${colorFor(e.category || "Other")}22`,
                            color: colorFor(e.category || "Other"),
                          }}
                        >
                          {e.category || "Other"}
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
                            title="Delete"
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
