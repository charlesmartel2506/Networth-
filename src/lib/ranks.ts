export type Rank = {
  name: string;
  emoji: string;
  color: string;
  min: number;
  max: number;
};

// Rank ladder based on net worth (CAD $).
export const RANKS: Rank[] = [
  { name: "Deficit", emoji: "🔻", color: "#ef4444", min: -Infinity, max: 0 },
  { name: "Bronze", emoji: "🥉", color: "#cd7f32", min: 0, max: 500 },
  { name: "Silver", emoji: "🥈", color: "#9aa3b2", min: 500, max: 1000 },
  { name: "Gold", emoji: "🥇", color: "#f59e0b", min: 1000, max: 2000 },
  { name: "Platinum", emoji: "💠", color: "#22d3ee", min: 2000, max: 5000 },
  { name: "Diamond", emoji: "💎", color: "#38bdf8", min: 5000, max: 10000 },
  { name: "Master", emoji: "👑", color: "#a855f7", min: 10000, max: 25000 },
  { name: "Grandmaster", emoji: "🔱", color: "#8b5cf6", min: 25000, max: 50000 },
  { name: "Legend", emoji: "🏆", color: "#f43f5e", min: 50000, max: 100000 },
  { name: "Mythic", emoji: "🌟", color: "#fbbf24", min: 100000, max: Infinity },
];

export function getRank(amount: number): Rank {
  return (
    RANKS.find((r) => amount >= r.min && amount < r.max) ??
    RANKS[RANKS.length - 1]
  );
}

// Progression vers le rang suivant (0 à 1) + rang suivant éventuel.
export function rankProgress(amount: number): {
  rank: Rank;
  next: Rank | null;
  progress: number;
  toNext: number;
} {
  const rank = getRank(amount);
  const idx = RANKS.indexOf(rank);
  const next = idx < RANKS.length - 1 ? RANKS[idx + 1] : null;

  if (!next || !Number.isFinite(rank.max)) {
    return { rank, next, progress: 1, toNext: 0 };
  }
  const span = rank.max - Math.max(rank.min, 0);
  const done = Math.max(0, amount - Math.max(rank.min, 0));
  const progress = Math.min(1, Math.max(0, span > 0 ? done / span : 0));
  return { rank, next, progress, toNext: Math.max(0, rank.max - amount) };
}
