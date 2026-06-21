import Link from "next/link";
import { signOut } from "@/app/login/actions";

export default function Nav({ displayName }: { displayName?: string | null }) {
  return (
    <header className="border-b border-foreground/10">
      <nav className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold flex items-center gap-1">
            <span>💰</span> Networth
          </Link>
          <Link
            href="/dashboard"
            className="text-sm opacity-70 hover:opacity-100 transition"
          >
            Tableau de bord
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm opacity-70 hover:opacity-100 transition"
          >
            Classement
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {displayName && (
            <span className="text-sm opacity-70 hidden sm:inline">
              {displayName}
            </span>
          )}
          <form action={signOut}>
            <button className="text-sm rounded-full border border-foreground/20 px-3 py-1 hover:bg-foreground/5 transition">
              Déconnexion
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
