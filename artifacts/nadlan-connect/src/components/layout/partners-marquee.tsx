import { Link } from "wouter";
import { useLanguage } from "./language-provider";
import { DEVELOPERS, DEV_UI, type Developer } from "@/data/developers";

function DeveloperChip({ dev }: { dev: Developer }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5 transition-colors hover:border-sea hover:bg-sea-soft">
      {dev.logo ? (
        <img src={dev.logo} alt={dev.name} className="h-6 w-auto max-w-[120px] object-contain" loading="lazy" />
      ) : (
        <div className="flex flex-col leading-tight">
          <span className="whitespace-nowrap font-serif text-sm text-foreground">{dev.name}</span>
          <span className="whitespace-nowrap text-[10px] text-muted-foreground">{dev.nameHe}</span>
        </div>
      )}
    </div>
  );
}

export function PartnersMarquee() {
  const { language } = useLanguage();
  const label =
    language === "fr" ? DEV_UI.sectionLabel.fr : language === "he" ? DEV_UI.sectionLabel.he : DEV_UI.sectionLabel.en;

  return (
    <section className="border-t border-border bg-background py-6" aria-label={label}>
      <div className="container mb-4">
        <Link
          href="/promoteurs"
          className="block text-center text-[11px] font-bold uppercase tracking-[0.18em] text-sea transition-opacity hover:opacity-80"
        >
          {label}
        </Link>
      </div>

      <div className="group relative overflow-hidden">
        <div className="flex w-max animate-[marquee_45s_linear_infinite] group-hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-4 px-2" aria-hidden={copy === 1}>
              {DEVELOPERS.map((dev) => (
                <DeveloperChip key={dev.slug} dev={dev} />
              ))}
            </div>
          ))}
        </div>

        {/* Fondu sur les bords */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
      </div>
    </section>
  );
}
