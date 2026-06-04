import { useState } from "react";
import { useListListings } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/layout/language-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Building2, SlidersHorizontal } from "lucide-react";

const ALL = "__all__";

export default function Listings() {
  const { t } = useLanguage();
  const [ville, setVille] = useState<string>(ALL);
  const [type, setType] = useState<string>(ALL);

  const { data, isLoading } = useListListings({
    ville: ville === ALL ? undefined : ville,
    type: type === ALL ? undefined : type,
  });

  const count = data?.listings.length ?? 0;

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
            {t("listings.catalog")}
          </div>
          <h1 className="mt-5 font-serif text-4xl font-bold text-white md:text-5xl">
            {t("listings.title")}
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/60">
            {t("listings.tagline")}
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
                <SelectItem value="tlv">Tel Aviv</SelectItem>
                <SelectItem value="jer">Jérusalem</SelectItem>
                <SelectItem value="hfa">Haïfa</SelectItem>
                <SelectItem value="bs">Beer-Sheva</SelectItem>
                <SelectItem value="nat">Netanya</SelectItem>
                <SelectItem value="ash">Ashdod</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("listings.propertyType")}</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-11 rounded-xl border-[1.5px] bg-[#FAFCFA] focus:border-[#1A3A5C] focus:ring-0">
                <SelectValue placeholder={t("listings.allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("listings.allTypes")}</SelectItem>
                <SelectItem value="resale">{t("listings.resale")}</SelectItem>
                <SelectItem value="new_development">{t("listings.newDev")}</SelectItem>
              </SelectContent>
            </Select>
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
            <span className="font-bold text-[#1A3A5C]">{count}</span> {t("listings.subtitle")}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[400px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#C9A84C]/30 bg-white py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A3A5C]/5">
              <Building2 className="h-8 w-8 text-[#1A3A5C]/40" />
            </div>
            <h3 className="mb-2 font-serif text-xl font-bold text-[#0A1628]">{t("listings.noResults")}</h3>
            <p className="mb-6 max-w-sm text-muted-foreground">{t("listings.noResultsDesc")}</p>
            <Button
              variant="outline"
              className="rounded-full border-[#1A3A5C]/20 text-[#1A3A5C] hover:bg-[#1A3A5C]/5"
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
