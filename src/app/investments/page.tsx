import Nav from "@/components/Nav";
import { MultiLineChart, AllocationDonut } from "@/components/Charts";
import { getNetWorthData } from "@/lib/networth";
import { ASSET_CATEGORIES, colorForCategory } from "@/lib/categories";
import { formatMoney, formatDate } from "@/lib/format";

export default async function InvestmentsPage() {
  const nw = await getNetWorthData();
  const entriesAsc = nw.entries.slice().reverse();

  // Which asset categories appear in at least one entry?
  const usedKeys = new Set<string>();
  for (const e of entriesAsc) {
    for (const k of Object.keys(e.asset_breakdown ?? {})) usedKeys.add(k);
  }
  const series = ASSET_CATEGORIES.filter((c) => usedKeys.has(c.key)).map(
    (c) => ({ key: c.key, label: c.label, color: c.color }),
  );

  // Time series: one row per entry, one value per category
  const chartData = entriesAsc.map((e) => {
    const row: Record<string, number | string> = {
      label: formatDate(e.recorded_at).replace(/,? \d{4}$/, ""),
    };
    for (const s of series) row[s.key] = e.asset_breakdown?.[s.key] ?? 0;
    return row;
  });

  // Current allocation (latest entry)
  const latest = nw.entries[0];
  const allocation = latest
    ? Object.entries(latest.asset_breakdown ?? {})
        .map(([key, value]) => ({
          key,
          label: ASSET_CATEGORIES.find((c) => c.key === key)?.label ?? key,
          value: Number(value),
          color: colorForCategory(key),
        }))
        .sort((a, b) => b.value - a.value)
    : [];
  const totalAssets = allocation.reduce((s, a) => s + a.value, 0);

  // Growth of each category since the first recorded entry
  const growth = series
    .map((s) => {
      const first = entriesAsc.find(
        (e) => (e.asset_breakdown?.[s.key] ?? 0) > 0,
      );
      const firstVal = first?.asset_breakdown?.[s.key] ?? 0;
      const lastVal = latest?.asset_breakdown?.[s.key] ?? 0;
      return { ...s, firstVal, lastVal, delta: lastVal - firstVal };
    })
    .filter((g) => g.lastVal > 0 || g.firstVal > 0);

  const hasData = entriesAsc.length > 0 && series.length > 0;

  return (
    <>
      <Nav displayName={nw.displayName} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Investments 📈</h1>
          <p className="text-sm text-muted">
            Track how each asset category evolves over time.
          </p>
        </div>

        {!hasData ? (
          <div className="card p-6 text-sm text-muted">
            No asset data yet. Add a net worth entry with categories (e.g.
            Investments, Crypto) from your dashboard to see your growth here.
          </div>
        ) : (
          <>
            {/* Evolution chart */}
            <section className="card p-5">
              <h2 className="font-semibold mb-2">Asset growth over time</h2>
              <MultiLineChart data={chartData} series={series} />
            </section>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Allocation donut */}
              <section className="card p-5 flex flex-col gap-3">
                <h2 className="font-semibold">Current allocation</h2>
                <AllocationDonut data={allocation} />
              </section>

              {/* Allocation table */}
              <section className="card p-5 flex flex-col gap-3">
                <h2 className="font-semibold">Breakdown</h2>
                <div className="flex flex-col gap-2">
                  {allocation.map((a) => (
                    <div key={a.key} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ background: a.color }}
                          />
                          {a.label}
                        </span>
                        <span className="tabular-nums font-medium">
                          {formatMoney(a.value)}
                          <span className="text-muted">
                            {" "}
                            ·{" "}
                            {totalAssets > 0
                              ? Math.round((a.value / totalAssets) * 100)
                              : 0}
                            %
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${totalAssets > 0 ? (a.value / totalAssets) * 100 : 0}%`,
                            background: a.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Growth table */}
            <section className="card p-5 flex flex-col gap-3">
              <h2 className="font-semibold">Growth since first entry</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium text-right">First</th>
                      <th className="px-3 py-2 font-medium text-right">Now</th>
                      <th className="px-3 py-2 font-medium text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {growth.map((g) => (
                      <tr key={g.key} className="border-t border-border">
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ background: g.color }}
                            />
                            {g.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted">
                          {formatMoney(g.firstVal)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatMoney(g.lastVal)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right tabular-nums font-semibold ${
                            g.delta >= 0 ? "text-positive" : "text-negative"
                          }`}
                        >
                          {g.delta >= 0 ? "+" : "−"}
                          {formatMoney(Math.abs(g.delta))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
