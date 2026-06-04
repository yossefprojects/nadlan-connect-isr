import { useLanguage } from "@/components/layout/language-provider";
import type { LegalDoc } from "@/lib/legal-content";
import { ScrollText } from "lucide-react";

export function LegalPage({ docByLang }: { docByLang: Record<string, LegalDoc> }) {
  const { t, language } = useLanguage();
  const doc = docByLang[language] ?? docByLang.fr;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0F2235] to-[#1A3A5C] py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #C9A84C 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="container relative max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C9A84C]">
            <ScrollText className="h-3.5 w-3.5" /> {t("legal.badge")}
          </div>
          <h1 className="mt-4 font-serif text-3xl text-white md:text-4xl">{doc.title}</h1>
          <p className="mt-2 text-sm text-white/50">
            {t("legal.lastUpdated")} {doc.lastUpdated}
          </p>
        </div>
      </div>

      <div className="container max-w-4xl py-12">
        <p className="mb-10 leading-relaxed text-muted-foreground">{doc.intro}</p>
        <div className="space-y-10">
          {doc.sections.map((s, i) => (
            <section key={i}>
              <h2 className="mb-3 font-serif text-xl text-[#0F2235]">
                {i + 1}. {s.heading}
              </h2>
              <div className="space-y-3">
                {s.paragraphs.map((p, j) => (
                  <p key={j} className="leading-relaxed text-[#1A3A5C]/80">
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
