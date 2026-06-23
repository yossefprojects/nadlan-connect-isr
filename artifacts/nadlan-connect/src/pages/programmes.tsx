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

type SortKey = "newest" | "projets" | "az";

export default function Programmes() {
  const { t } = useLanguage();
  const [ville, setVille] = useState<string>(ALL);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const { data: programs, isLoading } = useListPrograms();

  usePageMeta({
    title: "Programmes Neufs en Israël — NadlanConnect",
    description:
      "Découvrez tous les programmes immobiliers neufs en Israël : résidences et projets à Tel Aviv, Jérusalem, Haïfa et partout en Israël. Filtrez par ville.",
  });

  const filtered = useMemo(() => {
    if (!programs) return [];
    const kw = keyword.trim().toLowerCase();
    const result = programs.filter((p) => {
      if (ville !== ALL && p.ville !== ville) return false;
      if (kw) {
        const haystack = `${p.title} ${p.ville} ${p.quartier ?? ""}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
    result.sort((a, b) => {
      if (sort === "projets") return (b.projetsCount ?? 0) - (a.projetsCount ?? 0);
      if (sort === "az") return a.title.localeCompare(b.title);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [programs, ville, keyword, sort]);

  const count = filtered.length;

  return (
    <div className="bg-background min-h-screen">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-card border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(rgba(14,27,42,0.9) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sea/10 blur-[120px]" />
        <div className="container relative py-14 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-sea/30 bg-sea-soft px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-sea">
            <Building2 className="h-3.5 w-3.5" />
            {t("publicPrograms.catalog")}
          </div>
          <h1 className="mt-5 font-serif text-4xl font-medium text-foreground md:text-5xl">
            {t("publicPrograms.title")}
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            {t("publicPrograms.tagline")}
          </p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[112px] z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container flex flex-col gap-4 py-4 md:flex-row md:items-end">
          <div className="hidden items-center gap-2 pb-2 text-sm font-semibold text-foreground md:flex">
            <SlidersHorizontal className="h-4 w-4 text-sea" />
            {t("listings.filter")}
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("listings.city")}</label>
            <Select value={ville} onValueChange={setVille}>
              <SelectTrigger className="h-11 rounded-xl border-[1.5px] bg-card focus:border-sea focus:ring-0">
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
                className="h-11 rounded-xl border-[1.5px] bg-card ps-9 focus-visible:border-sea focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="flex-1 space-y-1.5 md:max-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground">
              {t("publicPrograms.sortBy")}
            </label>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-11 rounded-xl border-[1.5px] bg-card focus:border-sea focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("publicPrograms.sortNewest")}</SelectItem>
                <SelectItem value="projets">{t("publicPrograms.sortProjets")}</SelectItem>
                <SelectItem value="az">{t("publicPrograms.sortAz")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="h-11 gap-2 rounded-xl bg-primary px-8 text-primary-foreground shadow-sm hover:bg-ink-2">
            <Filter className="h-4 w-4" /> {t("listings.filter")}
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="container py-10">
        {!isLoading && count > 0 && (
          <p className="mb-6 text-sm text-muted-foreground">
            <span className="font-bold text-sea">{count}</span> {t("publicPrograms.subtitle")}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[360px] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">
              {t("publicPrograms.noResults")}
            </h3>
            <p className="mb-6 max-w-sm text-muted-foreground">
              {t("publicPrograms.noResultsDesc")}
            </p>
            <Button
              variant="outline"
              className="rounded-full border-primary/20 text-primary hover:bg-primary/5"
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
                <Card className="group flex h-full cursor-pointer flex-col overflow-hidden border-border transition-all hover:border-sea hover:shadow-[0_22px_44px_-30px_rgba(14,27,42,0.45)] hover:-translate-y-1">
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
                      className="absolute top-2 end-2 bg-card/90 border-sea/30 text-sea"
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
                    <div className="mb-4 flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {p.projetsCount ?? 0} {t("programs.projetsCount")}
                      </span>
                      {(p.projetsCount ?? 0) > 0 &&
                        ((p.availableCount ?? 0) > 0 ? (
                          <Badge
                            variant="outline"
                            className="border-sea/30 bg-sea-soft font-semibold text-sea"
                          >
                            {t("publicPrograms.available")
                              .replace("{available}", String(p.availableCount ?? 0))
                              .replace("{total}", String(p.projetsCount ?? 0))}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-border bg-muted font-semibold text-muted-foreground"
                          >
                            {t("publicPrograms.soldOut")}
                          </Badge>
                        ))}
                    </div>
                    <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-sea transition-colors group-hover:text-ink-2">
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
