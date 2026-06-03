import { TrendingUp } from "lucide-react";
import { useLanguage } from "./language-provider";

export function MarketBar() {
  const { t, language } = useLanguage();

  const localeMap: Record<string, string> = { fr: "fr-FR", en: "en-US", he: "he-IL" };
  const locale = localeMap[language] ?? "fr-FR";

  const marketData = [
    { label: t("market.boiRate"), value: "4.5%", trend: null },
    { label: t("market.mortgageRate"), value: "5.2%", trend: null },
    { label: t("market.cbsIndex"), value: "285.4", trend: t("market.cbsTrend") },
  ];

  return (
    <div className="w-full bg-[#0A1628] text-xs">
      <div className="container flex items-center gap-5 h-8 overflow-x-auto scrollbar-none whitespace-nowrap">
        <span className="flex items-center gap-1.5 shrink-0 text-[#9CABBF]">
          <TrendingUp className="h-3 w-3" />
          <span className="text-[#85B7EB]">
            {t("market.asOf")}{" "}
            {new Date().toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" })}
          </span>
        </span>
        {marketData.map((item) => (
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
