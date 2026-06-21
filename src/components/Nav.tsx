import Link from "next/link";
import { signOut } from "@/app/login/actions";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/investments", label: "Investments", icon: "📈" },
  { href: "/expenses", label: "Expenses", icon: "💸" },
  { href: "/forecast", label: "Forecast", icon: "🔮" },
  { href: "/ranks", label: "Ranks", icon: "🏅" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
];

export default function Nav({ displayName }: { displayName?: string | null }) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-surface/70 border-b border-border">
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          <Link
            href="/dashboard"
            className="font-bold flex items-center gap-1 pr-2 shrink-0"
          >
            <span>💰</span>
            <span className="gradient-text">Networth</span>
          </Link>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm px-2.5 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition whitespace-nowrap"
            >
              <span className="sm:hidden">{l.icon}</span>
              <span className="hidden sm:inline">{l.label}</span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {displayName && (
            <span className="text-sm text-muted hidden md:inline">
              {displayName}
            </span>
          )}
          <form action={signOut}>
            <button className="text-sm rounded-full border border-border px-3 py-1 hover:bg-surface-2 transition">
              Sign out
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
