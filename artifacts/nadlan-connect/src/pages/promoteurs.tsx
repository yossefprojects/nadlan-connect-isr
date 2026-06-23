import { useLanguage } from "@/components/layout/language-provider";
import { usePageMeta } from "@/hooks/use-page-meta";
import {
  DEVELOPERS,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  DEV_UI,
  type Developer,
} from "@/data/developers";

function initials(name: string): string {
  return name
    .replace(/[^A-Za-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function DeveloperCard({ dev, blurb }: { dev: Developer; blurb: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center gap-3">
        {dev.logo ? (
          <img src={dev.logo} alt={dev.name} className="h-11 w-11 rounded-lg object-contain" loading="lazy" />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-foreground font-serif text-sm text-sea-bright">
            {initials(dev.name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-serif text-lg text-foreground">{dev.name}</p>
          <p className="text-sm text-sea" dir="rtl">
            {dev.nameHe}
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{blurb}</p>
    </div>
  );
}

export default function Promoteurs() {
  const { language } = useLanguage();

  const pick = (o: { fr: string; en: string; he?: string }) =>
    language === "fr" ? o.fr : language === "he" && o.he ? o.he : o.en;

  usePageMeta({
    title:
      language === "fr"
        ? "Les grands promoteurs immobiliers en Israël — NadlanConnect"
        : "Israel's leading real-estate developers — NadlanConnect",
    description: pick(DEV_UI.pageSubtitle),
  });

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* En-tête */}
      <section className="border-b border-border bg-card py-16 md:py-20">
        <div className="container text-center">
          <h1 className="mx-auto max-w-3xl font-serif text-3xl leading-tight text-foreground md:text-4xl">
            {pick(DEV_UI.sectionLabel)}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {pick(DEV_UI.pageSubtitle)}
          </p>
        </div>
      </section>

      {/* Catégories */}
      <div className="container space-y-14 py-14 md:py-16">
        {CATEGORY_ORDER.map((cat) => {
          const list = DEVELOPERS.filter((d) => d.category === cat);
          return (
            <section key={cat}>
              <div className="mb-5 flex items-center gap-3">
                <h2 className="font-serif text-xl text-foreground md:text-2xl">{pick(CATEGORY_LABELS[cat])}</h2>
                <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                <span className="text-xs text-muted-foreground">{list.length}</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((dev) => (
                  <DeveloperCard key={dev.slug} dev={dev} blurb={pick(dev.blurb)} />
                ))}
              </div>
            </section>
          );
        })}

        <p className="pt-2 text-center text-xs leading-relaxed text-muted-foreground">
          {pick(DEV_UI.disclaimer)}
        </p>
      </div>
    </div>
  );
}
