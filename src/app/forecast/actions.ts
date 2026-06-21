"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function savePaySettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase.from("pay_settings").upsert({
    user_id: user.id,
    hourly_rate: parseFloat(String(formData.get("hourly_rate") || "0")) || 0,
    hours_per_paycheck:
      parseFloat(String(formData.get("hours_per_paycheck") || "0")) || 0,
    frequency_days: parseInt(String(formData.get("frequency_days") || "14")) || 14,
    next_payday: String(formData.get("next_payday") || "") || null,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/forecast");
}
