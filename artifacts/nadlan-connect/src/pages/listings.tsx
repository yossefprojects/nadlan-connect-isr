import { useEffect, useState } from "react";
import { useListListings } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/layout/language-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Building2, SlidersHorizontal } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { CITIES } from "@/data/villes";

const ALL = "__all__";

export default function Listings() {
  const { t } = useLanguage();
  const [ville, setVille] = useState<string>(ALL);
  const [type, setType] = useState<string>(ALL);

  // Pick up the search filters passed from the homepage search bar (?ville=&type=).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const v = p.get("ville");
    const ty = p.get("type");
    if (v) setVille(v);
    if (ty) setType(ty);
  }, []);

  const { data, isLoading } = useListListings({
    ville: ville === ALL ? undefined : ville,
    type: type === ALL ? undefined : type,
  });

  const count = data?.listings.length ?? 0;

  usePageMeta({
    title: "Catalogue Immobilier en Israël — NadlanConnect",
    description: "Parcourez les annonces immobilières en Israël : appartements, villas, programmes neufs à Tel Aviv, Jérusalem, Haïfa et partout en Israël. Filtrez par ville, type et budget.",
  });

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
            {t("listings.catalog")}
          </div>
          <h1 className="mt-5 font-serif text-4xl font-medium text-foreground md:text-5xl">
            {t("listings.title")}
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            {t("listings.tagline")}
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
            <label className="text-xs font-medium text-muted-foreground">{t("listings.propertyType")}</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-11 rounded-xl border-[1.5px] bg-card focus:border-sea focus:ring-0">
                <SelectValue placeholder={t("listings.allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("listings.allTypes")}</SelectItem>
                <SelectItem value="resale">{t("listings.resale")}</SelectItem>
                <SelectItem value="new_development">{t("listings.newDev")}</SelectItem>
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
            <span className="font-bold text-sea">{count}</span> {t("listings.subtitle")}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[400px] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">{t("listings.noResults")}</h3>
            <p className="mb-6 max-w-sm text-muted-foreground">{t("listings.noResultsDesc")}</p>
            <Button
              variant="outline"
              className="rounded-full border-primary/20 text-primary hover:bg-primary/5"
              onClick={() => { setVille(ALL); setType(ALL); }}
            >
              {t("listings.resetFilters")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data?.listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
