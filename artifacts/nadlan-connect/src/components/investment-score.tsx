import { cn } from "@/lib/utils";

interface InvestmentScoreProps {
  score: number;
  className?: string;
}

export function InvestmentScore({ score, className }: InvestmentScoreProps) {
  let colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200";
  let barClass = "bg-emerald-500";
  
  if (score < 40) {
    colorClass = "text-red-600 bg-red-50 border-red-200";
    barClass = "bg-red-500";
  } else if (score < 70) {
    colorClass = "text-amber-600 bg-amber-50 border-amber-200";
    barClass = "bg-amber-500";
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score d'investissement</span>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", colorClass)}>
          {score}/100
        </span>
      </div>
      <div className="h-1.5 w-full bg-secondary/20 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", barClass)} 
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}