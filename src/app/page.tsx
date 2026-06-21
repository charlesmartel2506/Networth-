import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
      <div className="max-w-xl flex flex-col gap-5">
        <span className="text-5xl">💰</span>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Networth
        </h1>
        <p className="text-lg opacity-80">
          Suis ta valeur nette, compare-toi à tes amis dans un classement, et
          reçois des conseils pour l&apos;améliorer.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-full bg-foreground text-background px-6 py-3 font-medium hover:opacity-90 transition"
        >
          Commencer
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-foreground/20 px-6 py-3 font-medium hover:bg-foreground/5 transition"
        >
          Se connecter
        </Link>
      </div>
    </main>
  );
}
