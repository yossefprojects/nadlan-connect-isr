import { cn } from "@/lib/utils";

// Colour + letter grade derived from the investment score (0-100).
// Colours come from the brand tokens so the whole site re-themes in one place.
export function scoreColor(score: number): string {
  const v = score >= 70 ? "--score-good" : score >= 45 ? "--score-mid" : "--score-low";
  return `hsl(var(${v}))`;
}

export function scoreGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "E";
}

interface ScoreBadgeProps {
  score: number;
  label?: string;
  className?: string;
}

// The signature "ring" badge from the design: a white pill with a coloured
// disc (letter grade) + the score. Meant to sit over a property photo.
export function ScoreBadge({ score, label = "Score", className }: ScoreBadgeProps) {
  const color = scoreColor(score);
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[11px] bg-white px-2.5 py-1.5 shadow-[0_6px_18px_-8px_rgba(14,27,42,0.4)]",
        className,
      )}
    >
      <span
        className="grid h-8 w-8 place-items-center rounded-full font-mono text-[13px] font-semibold text-white"
        style={{ background: color }}
        aria-hidden="true"
      >
        {scoreGrade(score)}
      </span>
      <div className="leading-tight">
        <span className="block text-[9px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{label}</span>
        <span className="font-mono text-[12.5px] font-semibold text-foreground">{score}/100</span>
      </div>
    </div>
  );
}
