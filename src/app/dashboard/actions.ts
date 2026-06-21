"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  return { supabase, user };
}

export async function addEntry(formData: FormData) {
  const { supabase, user } = await requireUser();

  const assets = parseFloat(String(formData.get("assets") || "0")) || 0;
  const liabilities =
    parseFloat(String(formData.get("liabilities") || "0")) || 0;
  const note = String(formData.get("note") || "").trim() || null;
  const recorded_at =
    String(formData.get("recorded_at") || "") ||
    new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("net_worth_entries").insert({
    user_id: user.id,
    assets,
    liabilities,
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
  if (!name) throw new Error("Nom de groupe requis");

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
  if (!code) throw new Error("Code requis");

  const { error } = await supabase.rpc("join_group_by_code", { code });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}
