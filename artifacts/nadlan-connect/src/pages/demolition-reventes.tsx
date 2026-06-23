import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useLanguage } from "@/components/layout/language-provider";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import {
  Building2, MapPin, Layers, Calendar, Mail, User, Loader2, ArrowRight, Handshake, Sparkles,
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
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sea/10 blur-[120px]" />
        <div className="container relative py-10 md:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-sea/30 bg-sea-soft px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-sea">
            <Handshake className="h-3.5 w-3.5" />
            {t("demo.reventes.nav")}
          </div>
          <h1 className="mt-5 font-serif text-3xl font-medium text-foreground md:text-4xl">
            {t("demo.reventes.title")}
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">{t("demo.reventes.subtitle")}</p>
          <Link href="/outils/analyse-ia">
            <Button variant="outline" className="mt-5 border-border bg-card text-foreground hover:bg-muted">
              <Sparkles className="me-2 h-4 w-4" />
              {t("nav.aiAnalysis")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="container py-10">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-10 text-center shadow-sm">
            <p className="text-muted-foreground">{t("demo.offerForm.loginRequired")}</p>
            <Link href="/auth/login">
              <Button className="bg-primary text-primary-foreground hover:bg-ink-2">{t("nav.login")}</Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-sea" />
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
                <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sea/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sea">
                  <Building2 className="h-3.5 w-3.5" />
                  {projectTypeLabel(t, listing.projectType)}
                </div>
                <h2 className="mt-3 font-serif text-lg font-bold text-foreground" dir="auto">
                  {listing.address ?? (listing.neighborhood ? `${listing.neighborhood}, ${listing.city}` : listing.city)}
                </h2>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground" dir="auto">
                  <MapPin className="h-4 w-4" />
                  {listing.city}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-sea" />
                    <span>{listing.units}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-sea" />
                    <span>{listing.buildYear}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {t("demo.reventes.promoter")}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2" dir="auto">
                    <User className="h-4 w-4 text-sea" />
                    {promoterCompany || promoterName || "—"}
                  </div>
                  {promoterEmail && (
                    <a
                      href={`mailto:${promoterEmail}`}
                      className="mt-1.5 flex items-center gap-2 text-sea hover:underline"
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
