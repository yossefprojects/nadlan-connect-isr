import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useLanguage } from "@/components/layout/language-provider";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import {
  Building2, MapPin, Layers, Calendar, Mail, User, Loader2, ArrowRight, Handshake,
} from "lucide-react";

type AssignedProject = {
  listing: {
    id: number;
    address: string | null;
    city: string;
    neighborhood: string | null;
    units: number;
    buildYear: number;
    projectType: string;
  };
  promoterName: string | null;
  promoterEmail: string | null;
  promoterCompany: string | null;
};

function projectTypeLabel(t: (k: string) => string, pt: string) {
  if (pt === "tama38") return t("demo.projectType.tama38");
  if (pt === "pinui_binui") return t("demo.projectType.pinui_binui");
  return t("demo.projectType.both");
}

export default function DemolitionReventes() {
  const { t } = useLanguage();
  const { isAuthenticated } = useUserRole();

  const { data, isLoading } = useQuery({
    queryKey: ["demolition-resale-assigned"],
    queryFn: () =>
      customFetch<AssignedProject[]>(`/demolition/resale/assigned`, { method: "GET" }),
    enabled: isAuthenticated,
  });

  const projects = data ?? [];

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0F2235] to-[#1A3A5C]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#C9A84C]/20 blur-[120px]" />
        <div className="container relative py-10 md:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C9A84C]">
            <Handshake className="h-3.5 w-3.5" />
            {t("demo.reventes.nav")}
          </div>
          <h1 className="mt-5 font-serif text-3xl font-bold text-white md:text-4xl">
            {t("demo.reventes.title")}
          </h1>
          <p className="mt-2 max-w-xl text-white/60">{t("demo.reventes.subtitle")}</p>
        </div>
      </div>

      <div className="container py-10">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-10 text-center shadow-sm">
            <p className="text-muted-foreground">{t("demo.offerForm.loginRequired")}</p>
            <Link href="/auth/login">
              <Button className="bg-[#1A3A5C] text-white hover:bg-[#2A5080]">{t("nav.login")}</Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#1A3A5C]" />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground shadow-sm">
            {t("demo.reventes.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(({ listing, promoterName, promoterEmail, promoterCompany }) => (
              <div
                key={listing.id}
                className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#1A3A5C]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1A3A5C]">
                  <Building2 className="h-3.5 w-3.5" />
                  {projectTypeLabel(t, listing.projectType)}
                </div>
                <h2 className="mt-3 font-serif text-lg font-bold text-[#0F2235]" dir="auto">
                  {listing.address ?? (listing.neighborhood ? `${listing.neighborhood}, ${listing.city}` : listing.city)}
                </h2>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground" dir="auto">
                  <MapPin className="h-4 w-4" />
                  {listing.city}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#1A3A5C]" />
                    <span>{listing.units}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#1A3A5C]" />
                    <span>{listing.buildYear}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-[#F8F7F4] p-3 text-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {t("demo.reventes.promoter")}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2" dir="auto">
                    <User className="h-4 w-4 text-[#1A3A5C]" />
                    {promoterCompany || promoterName || "—"}
                  </div>
                  {promoterEmail && (
                    <a
                      href={`mailto:${promoterEmail}`}
                      className="mt-1.5 flex items-center gap-2 text-[#C9A84C] hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {promoterEmail}
                    </a>
                  )}
                </div>

                <Link href={`/demolition/${listing.id}`} className="mt-4">
                  <Button variant="outline" className="w-full">
                    {t("demo.detail.characteristics")}
                    <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
