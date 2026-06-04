import { useRoute, Link } from "wouter";
import { useGetProgram, getGetProgramQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/layout/language-provider";
import { DocumentManager } from "@/components/documents/document-manager";
import { Building2, MapPin, ArrowRight } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function ProgrammeDetail() {
  const { t, locale } = useLanguage();
  const [, params] = useRoute("/programme/:slug");
  const slug = params?.slug ?? "";
  const { data: detail, isLoading } = useGetProgram(slug, {
    query: { enabled: !!slug, queryKey: getGetProgramQueryKey(slug) },
  });

  const metaProgram = detail?.program;
  usePageMeta({
    title: metaProgram ? `${metaProgram.title} — Programme Neuf | NadlanConnect` : undefined,
    description: metaProgram
      ? `${metaProgram.title}${metaProgram.ville ? ` à ${t(`city.${metaProgram.ville}`)}` : ""}${metaProgram.quartier ? ` · ${metaProgram.quartier}` : ""} — Programme immobilier neuf en Israël. Découvrez les projets et appartements disponibles sur NadlanConnect.`
      : undefined,
    image: metaProgram?.coverImageUrl ?? undefined,
    url: metaProgram?.slug ? `${window.location.origin}/programme/${metaProgram.slug}` : undefined,
  });

  if (isLoading) {
    return <div className="container py-8">{t("common.loading")}</div>;
  }

  if (!detail?.program) {
    return (
      <div className="container py-16 text-center text-muted-foreground">
        {t("programs.empty")}
      </div>
    );
  }

  const { program, projets } = detail;

  return (
    <div className="container py-8 max-w-5xl space-y-8">
      <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[21/9]">
        {program.coverImageUrl ? (
          <img
            src={program.coverImageUrl}
            alt={program.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}
      </div>

      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2">
          {program.title}
        </h1>
        <p className="text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          {t(`city.${program.ville}`)}
          {program.quartier ? ` · ${program.quartier}` : ""}
        </p>
        {program.description && (
          <p className="mt-4 text-foreground/80 whitespace-pre-line" dir="auto">
            {program.description}
          </p>
        )}
      </div>

      {/* Public documents: photos + plans (authorizations are filtered server-side) */}
      <section>
        <h2 className="font-serif text-2xl font-bold text-primary mb-4">
          {t("documents.title")}
        </h2>
        <DocumentManager programId={program.id} />
      </section>

      {/* Projets within the programme */}
      <section>
        <h2 className="font-serif text-2xl font-bold text-primary mb-4">
          {t("programs.projets")}
        </h2>
        {projets.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("programs.noProjets")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projets.map((projet) => (
              <Card key={projet.id} className="overflow-hidden flex flex-col">
                <div className="aspect-video bg-muted">
                  {projet.coverImageUrl ? (
                    <img
                      src={projet.coverImageUrl}
                      alt={projet.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 flex flex-col flex-1">
                  <h3 className="font-medium text-primary truncate">{projet.title}</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    {projet.surface} m² · {projet.nbPieces} {t("card.rooms")}
                  </p>
                  <p className="font-serif text-lg font-bold text-primary mb-3">
                    ₪{projet.price.toLocaleString(locale)}
                  </p>
                  <div className="mt-auto">
                    <Link href={`/listings/${projet.slug}`}>
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        {t("documents.view")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
