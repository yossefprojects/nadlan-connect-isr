import { TrendingUp } from "lucide-react";

const MARKET_DATA = [
  { label: "Taux BOI", value: "4.5%", trend: null },
  { label: "Taux hypothécaire moy.", value: "5.2%", trend: null },
  { label: "Indice CBS", value: "285.4", trend: "▲ 6.2% / 12 mois" },
];

export function MarketBar() {
  return (
    <div className="w-full bg-[#111827] text-white/70 text-xs border-b border-white/5">
      <div className="container flex items-center gap-6 h-8 overflow-x-auto scrollbar-none">
        <span className="flex items-center gap-1.5 shrink-0 text-white/40">
          <TrendingUp className="h-3 w-3" />
          Marché au {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
        </span>
        {MARKET_DATA.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 shrink-0">
            <span className="text-white/40">{item.label} :</span>
            <span className="text-white font-medium">{item.value}</span>
            {item.trend && (
              <span className="text-emerald-400">{item.trend}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
