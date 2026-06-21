import Link from "next/link";
import Nav from "@/components/Nav";
import RankBadge from "@/components/RankBadge";
import NetWorthForm from "@/components/NetWorthForm";
import { NetWorthAreaChart } from "@/components/Charts";
import { createClient } from "@/lib/supabase/server";
import { getNetWorthData, type Entry } from "@/lib/networth";
import { getRank } from "@/lib/ranks";
import { labelFor, iconFor } from "@/lib/categories";
import { formatMoney, formatDate } from "@/lib/format";
import { createGroup, joinGroup } from "./actions";

type Group = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
};

function buildTips(
  entries: Entry[],
  estimated: number,
  expensesSince: number,
): string[] {
  const tips: string[] = [];
  if (entries.length === 0) {
    return ["Add your first net worth to start tracking!"];
  }
  if (expensesSince > 0) {
    tips.push(
      `You've spent ${formatMoney(expensesSince)} since your last update. Consider updating your net worth.`,
    );
  }
  if (estimated < 0) {
    tips.push(
      "Your net worth is negative. Focus on paying down debt and building a small emergency fund.",
    );
  }
  if (entries.length >= 2) {
    const prev = parseFloat(entries[1].amount);
    const cur = parseFloat(entries[0].amount);
    if (cur > prev)
      tips.push(
        `Nice! +${formatMoney(cur - prev)} since your previous entry. Keep it up!`,
      );
  }
  tips.push(
    "Save or invest at least 20% of your income to grow your net worth over time.",
  );
  return tips;
}

function Breakdown({ entry }: { entry: Entry }) {
  const assets = Object.entries(entry.asset_breakdown ?? {});
  const liabilities = Object.entries(entry.liability_breakdown ?? {});
  if (assets.length === 0 && liabilities.length === 0) return null;

  const Row = ({ k, v, neg }: { k: string; v: number; neg?: boolean }) => (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="flex items-center gap-2">
        <span className="w-5 text-center">{iconFor(k)}</span>
        {labelFor(k)}
      </span>
      <span
        className={`tabular-nums ${neg ? "text-negative" : "text-positive"}`}
      >
        {neg ? "−" : ""}
        {formatMoney(v)}
      </span>
    </div>
  );

  return (
    <section className="card p-5 flex flex-col gap-3">
      <h2 className="font-semibold">Current breakdown</h2>
      <div className="grid sm:grid-cols-2 gap-x-8">
        <div>
          <h3 className="text-sm font-semibold text-positive mb-1">Assets</h3>
          {assets.length ? (
            assets.map(([k, v]) => <Row key={k} k={k} v={v} />)
          ) : (
            <p className="text-sm text-muted">None</p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-negative mb-1">Debts</h3>
          {liabilities.length ? (
            liabilities.map(([k, v]) => <Row key={k} k={k} v={v} neg />)
          ) : (
            <p className="text-sm text-muted">None</p>
          )}
        </div>
      </div>
    </section>
  );
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
        label: formatDate(e.recorded_at).replace(/,? \d{4}$/, ""),
        value: parseFloat(e.amount),
      })),
  ];
  if (data.expensesSince > 0) {
    chartData.push({ label: "Estimated", value: data.estimated });
  }

  return (
    <>
      <Nav displayName={data.displayName} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Header: net worth + rank */}
        <section className="grid md:grid-cols-3 gap-4">
          <div
            className="card p-6 md:col-span-2 flex flex-col gap-1 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${rank.color}, var(--primary-2))`,
            }}
          >
            <span className="text-sm opacity-90">Your estimated net worth</span>
            <span className="text-4xl sm:text-5xl font-bold tabular-nums">
              {formatMoney(data.estimated)}
            </span>
            <span className="text-sm opacity-90">
              {data.snapshotDate
                ? `Last entry: ${formatMoney(data.snapshot)} on ${formatDate(data.snapshotDate)}`
                : "No entry yet"}
              {data.expensesSince > 0 &&
                ` · −${formatMoney(data.expensesSince)} in expenses`}
            </span>
          </div>
          <div className="card p-6 flex flex-col justify-center gap-3">
            <RankBadge amount={data.estimated} size="lg" />
            <Link href="/ranks" className="text-xs text-primary font-medium">
              See all ranks →
            </Link>
          </div>
        </section>

        {/* Chart */}
        <section className="card p-5">
          <h2 className="font-semibold mb-2">Net worth over time</h2>
          {chartData.length > 0 ? (
            <NetWorthAreaChart data={chartData} color={rank.color} />
          ) : (
            <p className="text-sm text-muted py-12 text-center">
              Add entries to see your curve appear.
            </p>
          )}
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Update net worth (categorized form) */}
          <section className="card p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Update my net worth</h2>
            <NetWorthForm today={today} />
          </section>

          <div className="flex flex-col gap-6">
            {/* Breakdown */}
            {data.entries[0] && <Breakdown entry={data.entries[0]} />}

            {/* Tips */}
            <section className="card p-5 flex flex-col gap-3">
              <h2 className="font-semibold">Tips 💡</h2>
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
        </div>

        {/* History */}
        <section className="card p-5 flex flex-col gap-3">
          <h2 className="font-semibold">History</h2>
          {data.entries.length === 0 ? (
            <p className="text-sm text-muted">No entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium text-right">Assets</th>
                    <th className="px-3 py-2 font-medium text-right">Debts</th>
                    <th className="px-3 py-2 font-medium text-right">
                      Net worth
                    </th>
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

        {/* Groups */}
        <section className="card p-5 flex flex-col gap-3">
          <h2 className="font-semibold">Your friend groups</h2>
          {groups.length > 0 && (
            <div className="flex flex-col gap-2">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="rounded-xl bg-surface-2 px-4 py-3 flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{g.name}</span>
                  <span className="text-muted">
                    Code:{" "}
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
              <span className="text-sm font-medium">Create a group</span>
              <input
                name="name"
                type="text"
                required
                placeholder="Group name"
                className="input"
              />
              <button className="btn-primary">Create</button>
            </form>
            <form action={joinGroup} className="flex flex-col gap-2">
              <span className="text-sm font-medium">Join a group</span>
              <input
                name="code"
                type="text"
                required
                placeholder="Invite code"
                className="input uppercase"
              />
              <button className="btn-ghost">Join</button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
