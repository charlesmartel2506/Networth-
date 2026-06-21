import Nav from "@/components/Nav";
import RankBadge from "@/components/RankBadge";
import { createClient } from "@/lib/supabase/server";
import { getNetWorthData } from "@/lib/networth";
import { RANKS, getRank } from "@/lib/ranks";
import { formatMoney } from "@/lib/format";

export default async function RanksPage() {
  const supabase = await createClient();
  const nw = await getNetWorthData();
  const myRank = getRank(nw.estimated);

  // Rangs des amis (basés sur la dernière valeur nette saisie)
  const { data: groups } = await supabase.from("groups").select("id, name");
  const groupIds = (groups ?? []).map((g) => g.id);
  const safe = (arr: string[]) =>
    arr.length ? arr : ["00000000-0000-0000-0000-000000000000"];

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .in("group_id", safe(groupIds));
  const userIds = Array.from(new Set((members ?? []).map((m) => m.user_id)));

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .in("id", safe(userIds));
  const { data: nws } = await supabase
    .from("latest_net_worth")
    .select("user_id, amount")
    .in("user_id", safe(userIds));

  const amountById = new Map(
    (nws ?? []).map((n) => [n.user_id, parseFloat(n.amount as unknown as string)]),
  );
  const friends = (profiles ?? [])
    .map((p) => ({
      id: p.id,
      name: p.display_name || p.username || "Anonyme",
      amount: amountById.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Pour la barre de chaque palier (largeur d'affichage)
  const displayMax = (max: number) => (Number.isFinite(max) ? max : "∞");

  return (
    <>
      <Nav displayName={nw.displayName} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Rangs 🏅</h1>
          <p className="text-sm text-muted">
            Grimpe les paliers en augmentant ta valeur nette.
          </p>
        </div>

        {/* Mon rang */}
        <section
          className="card p-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${myRank.color}, var(--primary-2))`,
          }}
        >
          <span className="text-sm opacity-90">Ton rang actuel</span>
          <div className="flex items-center justify-between gap-4 mt-1">
            <div className="text-3xl font-bold">
              {myRank.emoji} {myRank.name}
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {formatMoney(nw.estimated)}
            </div>
          </div>
        </section>

        {/* Échelle des rangs */}
        <section className="card p-5 flex flex-col gap-2">
          <h2 className="font-semibold mb-1">L&apos;échelle des rangs</h2>
          {RANKS.filter((r) => Number.isFinite(r.max) || r.min >= 0).map((r) => {
            const isCurrent = r.name === myRank.name;
            return (
              <div
                key={r.name}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: isCurrent ? `${r.color}1f` : "var(--surface-2)",
                  outline: isCurrent ? `2px solid ${r.color}` : "none",
                }}
              >
                <span
                  className="grid place-items-center rounded-xl text-xl"
                  style={{ width: 40, height: 40, background: `${r.color}22` }}
                >
                  {r.emoji}
                </span>
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: r.color }}>
                    {r.name}
                    {isCurrent && (
                      <span className="ml-2 text-xs text-muted">(toi)</span>
                    )}
                  </div>
                  <div className="text-xs text-muted tabular-nums">
                    {r.min < 0
                      ? "En dessous de 0 $"
                      : `${formatMoney(r.min)} – ${displayMax(r.max) === "∞" ? "∞" : formatMoney(r.max)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Rangs des amis */}
        {friends.length > 1 && (
          <section className="card p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Rangs de tes amis</h2>
            <div className="flex flex-col gap-2">
              {friends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3"
                >
                  <span className="font-medium">
                    {f.name}
                    {f.id === nw.userId && (
                      <span className="text-muted"> (toi)</span>
                    )}
                  </span>
                  <RankBadge amount={f.amount} size="sm" />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
