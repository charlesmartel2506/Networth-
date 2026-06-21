import Link from "next/link";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  const { data: groups } = await supabase.from("groups").select("id, name");
  const groupIds = (groups ?? []).map((g) => g.id);

  // Membres de tous mes groupes
  const { data: members } = await supabase
    .from("group_members")
    .select("group_id, user_id")
    .in("group_id", groupIds.length ? groupIds : ["00000000-0000-0000-0000-000000000000"]);

  const userIds = Array.from(new Set((members ?? []).map((m) => m.user_id)));

  // Profils + derniers net worth
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: nws } = await supabase
    .from("latest_net_worth")
    .select("user_id, amount")
    .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name || p.username || "Anonyme"]),
  );
  const amountById = new Map(
    (nws ?? []).map((n) => [n.user_id, parseFloat(n.amount)]),
  );

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <>
      <Nav displayName={profile?.display_name} />
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        <h1 className="text-2xl font-bold">Classement 🏆</h1>

        {(groups ?? []).length === 0 ? (
          <div className="rounded-2xl border border-foreground/10 p-6 text-sm opacity-70">
            Tu ne fais partie d&apos;aucun groupe pour l&apos;instant. Crée ou
            rejoins un groupe depuis ton{" "}
            <Link href="/dashboard" className="underline">
              tableau de bord
            </Link>{" "}
            pour te comparer à tes amis.
          </div>
        ) : (
          (groups ?? []).map((group) => {
            const ranked = (members ?? [])
              .filter((m) => m.group_id === group.id)
              .map((m) => ({
                userId: m.user_id,
                name: nameById.get(m.user_id) ?? "Anonyme",
                amount: amountById.get(m.user_id) ?? null,
              }))
              .sort((a, b) => (b.amount ?? -Infinity) - (a.amount ?? -Infinity));

            return (
              <section key={group.id} className="flex flex-col gap-3">
                <h2 className="font-semibold">{group.name}</h2>
                <div className="rounded-2xl border border-foreground/10 overflow-hidden">
                  {ranked.map((row, i) => (
                    <div
                      key={row.userId}
                      className={`flex items-center justify-between px-4 py-3 text-sm ${
                        i > 0 ? "border-t border-foreground/10" : ""
                      } ${row.userId === user!.id ? "bg-foreground/[0.04]" : ""}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-6 text-center">
                          {medals[i] ?? i + 1}
                        </span>
                        <span className="font-medium">
                          {row.name}
                          {row.userId === user!.id && (
                            <span className="opacity-50"> (toi)</span>
                          )}
                        </span>
                      </span>
                      <span className="tabular-nums font-medium">
                        {row.amount === null ? "—" : formatMoney(row.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>
    </>
  );
}
