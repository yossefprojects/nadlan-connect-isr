import { cn } from "@/lib/utils";

interface InvestmentScoreProps {
  score: number;
  className?: string;
}

export function InvestmentScore({ score, className }: InvestmentScoreProps) {
  const color = score >= 70 ? "#0F6E56" : score >= 45 ? "#BA7517" : "#993C1D";
  const bg = score >= 70 ? "#EAF3DE" : score >= 45 ? "#FAEEDA" : "#FCEBEB";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score d'investissement</span>
        <span
          className="inline-flex items-center gap-1 text-xs font-bold rounded-md px-2 py-0.5"
          style={{ color, background: bg }}
        >
          ★ {score}/100
        </span>
      </div>
      <div className="h-1.5 w-full bg-secondary/20 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}