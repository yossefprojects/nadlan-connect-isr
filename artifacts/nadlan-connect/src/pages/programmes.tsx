import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListPrograms } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/layout/language-provider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Building2, SlidersHorizontal, ArrowRight, Search } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { CITIES } from "@/data/villes";

const ALL = "__all__";

export default function Programmes() {
  const { t } = useLanguage();
  const [ville, setVille] = useState<string>(ALL);
  const [keyword, setKeyword] = useState("");

  const { data: programs, isLoading } = useListPrograms();

  usePageMeta({
    title: "Programmes Neufs en Israël — NadlanConnect",
    description:
      "Découvrez tous les programmes immobiliers neufs en Israël : résidences et projets à Tel Aviv, Jérusalem, Haïfa et partout en Israël. Filtrez par ville.",
  });

  const filtered = useMemo(() => {
    if (!programs) return [];
    const kw = keyword.trim().toLowerCase();
    return programs.filter((p) => {
      if (ville !== ALL && p.ville !== ville) return false;
      if (kw) {
        const haystack = `${p.title} ${p.ville} ${p.quartier ?? ""}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
  }, [programs, ville, keyword]);

  const count = filtered.length;

  return (
    <div className="bg-[#F8F7F4] min-h-screen">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0F2235] to-[#1A3A5C]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#C9A84C]/20 blur-[120px]" />
        <div className="container relative py-14 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C9A84C]">
            <Building2 className="h-3.5 w-3.5" />
            {t("publicPrograms.catalog")}
          </div>
          <h1 className="mt-5 font-serif text-4xl font-bold text-white md:text-5xl">
            {t("publicPrograms.title")}
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/60">
            {t("publicPrograms.tagline")}
          </p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[112px] z-30 border-b border-[#E5E7EB] bg-white/85 backdrop-blur-md">
        <div className="container flex flex-col gap-4 py-4 md:flex-row md:items-end">
          <div className="hidden items-center gap-2 pb-2 text-sm font-semibold text-[#1A3A5C] md:flex">
            <SlidersHorizontal className="h-4 w-4 text-[#C9A84C]" />
            {t("listings.filter")}
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("listings.city")}</label>
            <Select value={ville} onValueChange={setVille}>
              <SelectTrigger className="h-11 rounded-xl border-[1.5px] bg-[#FAFCFA] focus:border-[#1A3A5C] focus:ring-0">
                <SelectValue placeholder={t("listings.allCities")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("listings.allCities")}</SelectItem>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{t(`city.${c}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("publicPrograms.search")}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t("publicPrograms.searchPlaceholder")}
                className="h-11 rounded-xl border-[1.5px] bg-[#FAFCFA] ps-9 focus-visible:border-[#1A3A5C] focus-visible:ring-0"
              />
            </div>
          </div>

          <Button className="h-11 gap-2 rounded-xl bg-[#1A3A5C] px-8 text-white shadow-[0_4px_12px_rgba(26,58,92,0.25)] hover:bg-[#2A5080]">
            <Filter className="h-4 w-4" /> {t("listings.filter")}
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="container py-10">
        {!isLoading && count > 0 && (
          <p className="mb-6 text-sm text-muted-foreground">
            <span className="font-bold text-[#1A3A5C]">{count}</span> {t("publicPrograms.subtitle")}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[360px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#C9A84C]/30 bg-white py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A3A5C]/5">
              <Building2 className="h-8 w-8 text-[#1A3A5C]/40" />
            </div>
            <h3 className="mb-2 font-serif text-xl font-bold text-[#0A1628]">
              {t("publicPrograms.noResults")}
            </h3>
            <p className="mb-6 max-w-sm text-muted-foreground">
              {t("publicPrograms.noResultsDesc")}
            </p>
            <Button
              variant="outline"
              className="rounded-full border-[#1A3A5C]/20 text-[#1A3A5C] hover:bg-[#1A3A5C]/5"
              onClick={() => {
                setVille(ALL);
                setKeyword("");
              }}
            >
              {t("listings.resetFilters")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link key={p.id} href={`/programme/${p.slug}`}>
                <Card className="group flex h-full cursor-pointer flex-col overflow-hidden border-[#E5E7EB] transition-shadow hover:shadow-[0_8px_30px_rgba(15,34,53,0.12)]">
                  <div className="aspect-video relative bg-muted">
                    {p.coverImageUrl ? (
                      <img
                        src={p.coverImageUrl}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Building2 className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <Badge
                      variant="outline"
                      className="absolute top-2 end-2 bg-card/90 border-[#C9A84C]/30 text-[#1A3A5C]"
                    >
                      {t("listings.newDev")}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <h3 className="truncate font-serif text-lg font-bold text-primary">{p.title}</h3>
                    <p className="mb-1 text-sm text-muted-foreground">
                      {t(`city.${p.ville}`)}
                      {p.quartier ? ` · ${p.quartier}` : ""}
                    </p>
                    <p className="mb-4 text-xs text-muted-foreground">
                      {p.projetsCount ?? 0} {t("programs.projetsCount")}
                    </p>
                    <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-[#1A3A5C] transition-colors group-hover:text-[#C9A84C]">
                      {t("publicPrograms.view")}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
