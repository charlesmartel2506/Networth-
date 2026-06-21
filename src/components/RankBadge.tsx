import { rankProgress } from "@/lib/ranks";
import { formatMoney } from "@/lib/format";

export default function RankBadge({
  amount,
  size = "md",
}: {
  amount: number;
  size?: "sm" | "md" | "lg";
}) {
  const { rank, next, progress, toNext } = rankProgress(amount);

  if (size === "sm") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ background: `${rank.color}22`, color: rank.color }}
      >
        {rank.emoji} {rank.name}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span
          className="grid place-items-center rounded-2xl text-2xl"
          style={{
            width: size === "lg" ? 56 : 44,
            height: size === "lg" ? 56 : 44,
            background: `${rank.color}22`,
          }}
        >
          {rank.emoji}
        </span>
        <div>
          <div className="font-bold" style={{ color: rank.color }}>
            Rang {rank.name}
          </div>
          {next && (
            <div className="text-xs text-muted">
              Encore {formatMoney(toNext)} jusqu&apos;à {next.emoji} {next.name}
            </div>
          )}
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.round(progress * 100)}%`,
            background: `linear-gradient(90deg, ${rank.color}, ${next?.color ?? rank.color})`,
          }}
        />
      </div>
    </div>
  );
}
