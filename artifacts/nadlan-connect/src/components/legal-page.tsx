import { useLanguage } from "@/components/layout/language-provider";
import type { LegalDoc } from "@/lib/legal-content";
import { ScrollText } from "lucide-react";

export function LegalPage({ docByLang }: { docByLang: Record<string, LegalDoc> }) {
  const { t, language } = useLanguage();
  const doc = docByLang[language] ?? docByLang.fr;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-border bg-card py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #0E1B2A 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="container relative max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sea/30 bg-sea-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-sea">
            <ScrollText className="h-3.5 w-3.5" /> {t("legal.badge")}
          </div>
          <h1 className="mt-4 font-serif text-3xl text-foreground md:text-4xl">{doc.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("legal.lastUpdated")} {doc.lastUpdated}
          </p>
        </div>
      </div>

      <div className="container max-w-4xl py-12">
        <p className="mb-10 leading-relaxed text-muted-foreground">{doc.intro}</p>
        <div className="space-y-10">
          {doc.sections.map((s, i) => (
            <section key={i}>
              <h2 className="mb-3 font-serif text-xl text-foreground">
                {i + 1}. {s.heading}
              </h2>
              <div className="space-y-3">
                {s.paragraphs.map((p, j) => (
                  <p key={j} className="leading-relaxed text-foreground/80">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
