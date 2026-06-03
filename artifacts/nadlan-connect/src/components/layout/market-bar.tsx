import { TrendingUp } from "lucide-react";

const MARKET_DATA = [
  { label: "Taux BOI", value: "4.5%", trend: null },
  { label: "Taux hypothécaire moy.", value: "5.2%", trend: null },
  { label: "Indice CBS", value: "285.4", trend: "▲ 6.2% / 12 mois" },
];

export function MarketBar() {
  return (
    <div className="w-full bg-[#0A1628] text-xs">
      <div className="container flex items-center gap-5 h-8 overflow-x-auto scrollbar-none whitespace-nowrap">
        <span className="flex items-center gap-1.5 shrink-0 text-[#9CABBF]">
          <TrendingUp className="h-3 w-3" />
          <span className="text-[#85B7EB]">
            Marché au {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </span>
        </span>
        {MARKET_DATA.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 shrink-0 text-[#9CABBF]">
            <span>{item.label}</span>
            <span className="text-[#C9A84C] font-semibold">{item.value}</span>
            {item.trend && (
              <span className="text-[#0F6E56] font-medium">{item.trend}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
