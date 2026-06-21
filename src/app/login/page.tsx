import Link from "next/link";
import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center flex flex-col gap-2">
          <Link href="/" className="text-3xl">
            💰
          </Link>
          <h1 className="text-2xl font-bold">Bienvenue sur Networth</h1>
          <p className="text-sm opacity-70">
            Connecte-toi ou crée un compte pour commencer.
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 text-sm">
            {error}
          </p>
        )}
        {message === "check-email" && (
          <p className="rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-3 text-sm">
            Vérifie ta boîte mail pour confirmer ton compte, puis connecte-toi.
          </p>
        )}

        <form className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Nom affiché (à l&apos;inscription)
            <input
              name="display_name"
              type="text"
              placeholder="Ex: Julien"
              className="rounded-lg border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Courriel
            <input
              name="email"
              type="email"
              required
              placeholder="toi@exemple.com"
              className="rounded-lg border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Mot de passe
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="rounded-lg border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
            />
          </label>

          <div className="flex flex-col gap-2 mt-2">
            <button
              formAction={login}
              className="rounded-full bg-foreground text-background px-5 py-2.5 font-medium hover:opacity-90 transition"
            >
              Se connecter
            </button>
            <button
              formAction={signup}
              className="rounded-full border border-foreground/20 px-5 py-2.5 font-medium hover:bg-foreground/5 transition"
            >
              Créer un compte
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
