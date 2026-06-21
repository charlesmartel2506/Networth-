import { createClient } from "./supabase/server";
import type { PaySettings } from "./pay";

export type Entry = {
  id: string;
  assets: string;
  liabilities: string;
  amount: string;
  note: string | null;
  recorded_at: string;
};

export type NWData = {
  userId: string;
  displayName: string | null;
  entries: Entry[]; // du plus récent au plus ancien
  snapshot: number; // dernière valeur nette saisie
  snapshotDate: string | null;
  expensesSince: number; // dépenses depuis la dernière saisie
  estimated: number; // snapshot - dépenses depuis
  pay: PaySettings | null;
};

// Récupère et calcule les données de valeur nette de l'utilisateur courant.
export async function getNetWorthData(): Promise<NWData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  const { data: entriesData } = await supabase
    .from("net_worth_entries")
    .select("id, assets, liabilities, amount, note, recorded_at")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false });

  const entries = (entriesData ?? []) as Entry[];
  const snapshot = entries[0] ? parseFloat(entries[0].amount) : 0;
  const snapshotDate = entries[0]?.recorded_at ?? null;

  let expensesSince = 0;
  if (snapshotDate) {
    const { data: exp } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", userId)
      .gte("spent_at", snapshotDate);
    expensesSince = (exp ?? []).reduce(
      (s, e) => s + parseFloat(e.amount as unknown as string),
      0,
    );
  }

  const { data: payData } = await supabase
    .from("pay_settings")
    .select("hourly_rate, hours_per_paycheck, frequency_days, next_payday")
    .eq("user_id", userId)
    .maybeSingle();

  const pay = payData
    ? {
        hourly_rate: parseFloat(payData.hourly_rate as unknown as string),
        hours_per_paycheck: parseFloat(
          payData.hours_per_paycheck as unknown as string,
        ),
        frequency_days: payData.frequency_days as number,
        next_payday: payData.next_payday as string | null,
      }
    : null;

  return {
    userId,
    displayName: profile?.display_name ?? null,
    entries,
    snapshot,
    snapshotDate,
    expensesSince,
    estimated: snapshot - expensesSince,
    pay,
  };
}
