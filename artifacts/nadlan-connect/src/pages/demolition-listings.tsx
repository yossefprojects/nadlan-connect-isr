import { useState } from "react";
import { Link } from "wouter";
import {
  useListDemolitionListings,
  type ListDemolitionListingsParams,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/components/layout/language-provider";
import { Building2, MapPin, Calendar, Layers, Plus, Inbox } from "lucide-react";

const ALL = "__all__";

function projectTypeLabel(t: (k: string) => string, pt: string) {
  if (pt === "tama38") return t("demo.projectType.tama38");
  if (pt === "pinui_binui") return t("demo.projectType.pinui_binui");
  return t("demo.projectType.both");
}

export default function DemolitionListings() {
  const { t } = useLanguage();
  const [city, setCity] = useState("");
  const [projectType, setProjectType] = useState<string>(ALL);
  const [minUnits, setMinUnits] = useState("");
  const [applied, setApplied] = useState<ListDemolitionListingsParams>({});

  const { data: listings, isLoading } = useListDemolitionListings(applied);

  const apply = () => {
    const params: ListDemolitionListingsParams = {};
    if (city.trim()) params.city = city.trim();
    if (projectType !== ALL) params.projectType = projectType as ListDemolitionListingsParams["projectType"];
    if (minUnits.trim()) params.minUnits = Number(minUnits);
    setApplied(params);
  };

  const reset = () => {
    setCity("");
    setProjectType(ALL);
    setMinUnits("");
    setApplied({});
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0F2235] to-[#1A3A5C]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#C9A84C]/20 blur-[120px]" />
        <div className="container relative py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C9A84C]">
                <Building2 className="h-3.5 w-3.5" />
                {t("demo.badge")}
              </div>
              <h1 className="mt-5 font-serif text-3xl font-bold text-white md:text-4xl">{t("demo.title")}</h1>
              <p className="mt-3 max-w-2xl text-base text-white/60">{t("demo.tagline")}</p>
            </div>
            <Link href="/demolition/nouveau">
              <Button className="bg-[#C9A84C] text-[#0F2235] hover:bg-[#D9BC6C]">
                <Plus className="me-2 h-4 w-4" />
                {t("demo.registerBuilding")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("demo.filter.city")}</label>
            <Input dir="auto" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("demo.filter.projectType")}</label>
            <Select value={projectType} onValueChange={setProjectType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("demo.filter.all")}</SelectItem>
                <SelectItem value="tama38">{t("demo.projectType.tama38")}</SelectItem>
                <SelectItem value="pinui_binui">{t("demo.projectType.pinui_binui")}</SelectItem>
                <SelectItem value="both">{t("demo.projectType.both")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("demo.filter.minUnits")}</label>
            <Input type="number" min="1" value={minUnits} onChange={(e) => setMinUnits(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={apply} className="bg-[#1A3A5C] text-white hover:bg-[#2A5080]">{t("demo.filter.apply")}</Button>
            <Button onClick={reset} variant="outline">{t("demo.filter.reset")}</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl border bg-card" />
            ))}
          </div>
        ) : !listings || listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-20 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 font-serif text-xl font-bold text-[#0F2235]">{t("demo.noListings")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("demo.noListingsDesc")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <Link key={l.id} href={`/demolition/${l.id}`}>
                <article className="group flex h-full cursor-pointer flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#C9A84C]/50 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1A3A5C]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1A3A5C]">
                      {projectTypeLabel(t, l.projectType)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#C9A84C]">
                      {l.offerCount} {l.offerCount === 1 ? t("demo.offer") : t("demo.offers")}
                    </span>
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-bold leading-snug text-[#0F2235]" dir="auto">{l.address}</h3>
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground" dir="auto">
                    <MapPin className="h-3.5 w-3.5" />
                    {l.city}
                  </div>
                  <div className="mt-5 flex items-center gap-5 border-t pt-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-[#1A3A5C]" />
                      {l.units} {t("demo.units")}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-[#1A3A5C]" />
                      {t("demo.builtIn")} {l.buildYear}
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
