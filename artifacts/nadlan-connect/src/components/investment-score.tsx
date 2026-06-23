import { cn } from "@/lib/utils";
import { scoreColor } from "./score-badge";

interface InvestmentScoreProps {
  score: number;
  className?: string;
}

// Inline bar version of the score, for detail pages and dense lists.
export function InvestmentScore({ score, className }: InvestmentScoreProps) {
  const color = scoreColor(score);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score d'investissement</span>
        <span
          className="inline-flex items-center gap-1 text-xs font-bold rounded-md px-2 py-0.5 text-white"
          style={{ background: color }}
        >
          ★ {score}/100
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}
