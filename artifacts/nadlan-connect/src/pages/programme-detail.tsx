import { useRoute, Link } from "wouter";
import { useGetProgram, getGetProgramQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/layout/language-provider";
import { DocumentManager } from "@/components/documents/document-manager";
import { Building2, MapPin, ArrowRight } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useJsonLd } from "@/hooks/use-json-ld";

export default function ProgrammeDetail() {
  const { t, locale } = useLanguage();
  const [, params] = useRoute("/programme/:slug");
  const slug = params?.slug ?? "";
  const { data: detail, isLoading } = useGetProgram(slug, {
    query: { enabled: !!slug, queryKey: getGetProgramQueryKey(slug) },
  });

  const metaProgram = detail?.program;
  const programCanonicalUrl = metaProgram?.slug ? `${window.location.origin}/programme/${metaProgram.slug}` : undefined;
  const programCityLabel = metaProgram?.ville ? t(`city.${metaProgram.ville}`) : undefined;
  usePageMeta({
    title: metaProgram ? `${metaProgram.title} — Programme Neuf | NadlanConnect` : undefined,
    description: metaProgram
      ? `${metaProgram.title}${metaProgram.ville ? ` à ${programCityLabel}` : ""}${metaProgram.quartier ? ` · ${metaProgram.quartier}` : ""} — Programme immobilier neuf en Israël. Découvrez les projets et appartements disponibles sur NadlanConnect.`
      : undefined,
    image: metaProgram?.coverImageUrl ?? undefined,
    url: programCanonicalUrl,
  });

  useJsonLd(
    metaProgram && programCanonicalUrl
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ApartmentComplex",
              "@id": programCanonicalUrl,
              name: metaProgram.title,
              description: metaProgram.description ?? undefined,
              url: programCanonicalUrl,
              ...(metaProgram.coverImageUrl ? { image: metaProgram.coverImageUrl } : {}),
              address: {
                "@type": "PostalAddress",
                addressLocality: programCityLabel,
                ...(metaProgram.quartier ? { addressRegion: metaProgram.quartier } : {}),
                addressCountry: "IL",
              },
              ...(detail?.projets && detail.projets.length > 0
                ? {
                    containsPlace: detail.projets.map((projet) => ({
                      "@type": "Apartment",
                      name: projet.title,
                      url: `${window.location.origin}/listings/${projet.slug}`,
                      floorSize: {
                        "@type": "QuantitativeValue",
                        value: projet.surface,
                        unitCode: "MTK",
                      },
                      numberOfRooms: projet.nbPieces,
                      offers: {
                        "@type": "Offer",
                        price: projet.price,
                        priceCurrency: "ILS",
                        availability: "https://schema.org/InStock",
                      },
                    })),
                  }
                : {}),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "NadlanConnect",
                  item: window.location.origin,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Programmes neufs",
                  item: `${window.location.origin}/programmes`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: metaProgram.title,
                  item: programCanonicalUrl,
                },
              ],
            },
          ],
        }
      : null
  );

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
  const photos = detail.documents.filter((d) => d.category === "photo");

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

      {photos.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <a
              key={photo.id}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl overflow-hidden bg-muted aspect-square"
            >
              <img
                src={photo.url}
                alt={photo.fileName ?? program.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform hover:scale-105"
              />
            </a>
          ))}
        </div>
      )}

      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2">
          {program.title}
        </h1>
        <p className="text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          {t(`city.${program.ville}`)}
          {program.quartier ? ` · ${program.quartier}` : ""}
        </p>
        {(program.projetsCount ?? 0) > 0 && (
          <div className="mt-3">
            {(program.availableCount ?? 0) > 0 ? (
              <Badge
                variant="outline"
                className="border-emerald-600/30 bg-emerald-50 font-semibold text-emerald-700"
              >
                {t("publicPrograms.available")
                  .replace("{available}", String(program.availableCount ?? 0))
                  .replace("{total}", String(program.projetsCount ?? 0))}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-[#0A1628]/15 bg-[#0A1628]/5 font-semibold text-[#0A1628]/70"
              >
                {t("publicPrograms.soldOut")}
              </Badge>
            )}
          </div>
        )}
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
                      src={`/api/storage${projet.coverImageUrl}`}
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
