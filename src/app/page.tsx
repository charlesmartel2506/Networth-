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
        <span className="text-6xl">💰</span>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          <span className="gradient-text">Networth</span>
        </h1>
        <p className="text-lg text-muted">
          Suis ta valeur nette, grimpe les rangs, compare-toi à tes amis et
          projette tes finances futures.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          {["📊 Graphiques", "🔮 Prévisions", "💸 Dépenses", "🏅 Rangs", "🏆 Classement"].map(
            (f) => (
              <span key={f} className="card px-3 py-1.5">
                {f}
              </span>
            ),
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <Link href="/login" className="btn-primary text-base">
          Commencer
        </Link>
        <Link href="/login" className="btn-ghost text-base">
          Se connecter
        </Link>
      </div>
    </main>
  );
}
