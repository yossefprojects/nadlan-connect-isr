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

  const dateStr = new Date().toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="w-full overflow-hidden border-b border-border bg-muted text-xs">
      <div className="ticker-track">
        {[0, 1, 2, 3].map((copy) => (
          <div
            key={copy}
            className="flex h-8 shrink-0 items-center gap-5 px-2.5"
            aria-hidden={copy !== 0}
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span className="text-sea">
                {t("market.asOf")} {dateStr}
              </span>
            </span>
            {marketData.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5 text-muted-foreground">
                <span>{item.label}</span>
                <span className="font-semibold text-foreground">{item.value}</span>
                {item.trend && <span className="font-medium text-sea">{item.trend}</span>}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
