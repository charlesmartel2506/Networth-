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

export async function addExpense(formData: FormData) {
  const { supabase, user } = await requireUser();

  const amount = parseFloat(String(formData.get("amount") || "0")) || 0;
  if (amount <= 0) throw new Error("Montant invalide");

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    amount,
    category: String(formData.get("category") || "Autre").trim() || "Autre",
    note: String(formData.get("note") || "").trim() || null,
    spent_at:
      String(formData.get("spent_at") || "") ||
      new Date().toISOString().slice(0, 10),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteExpense(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
