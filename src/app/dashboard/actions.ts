"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from "@/lib/categories";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function addEntry(formData: FormData) {
  const { supabase, user } = await requireUser();

  // Additionne chaque catégorie et construit le détail (breakdown).
  let assets = 0;
  const asset_breakdown: Record<string, number> = {};
  for (const c of ASSET_CATEGORIES) {
    const v = parseFloat(String(formData.get(`asset_${c.key}`) || "0")) || 0;
    if (v) asset_breakdown[c.key] = v;
    assets += v;
  }

  let liabilities = 0;
  const liability_breakdown: Record<string, number> = {};
  for (const c of LIABILITY_CATEGORIES) {
    const v =
      parseFloat(String(formData.get(`liability_${c.key}`) || "0")) || 0;
    if (v) liability_breakdown[c.key] = v;
    liabilities += v;
  }

  const note = String(formData.get("note") || "").trim() || null;
  const recorded_at =
    String(formData.get("recorded_at") || "") ||
    new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("net_worth_entries").insert({
    user_id: user.id,
    assets,
    liabilities,
    asset_breakdown,
    liability_breakdown,
    note,
    recorded_at,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}

export async function createGroup(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Group name required");

  const { data: group, error } = await supabase
    .from("groups")
    .insert({ name, owner_id: user.id })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id });

  if (memberError) throw new Error(memberError.message);

  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}

export async function joinGroup(formData: FormData) {
  const { supabase } = await requireUser();

  const code = String(formData.get("code") || "").trim();
  if (!code) throw new Error("Code required");

  const { error } = await supabase.rpc("join_group_by_code", { code });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}
