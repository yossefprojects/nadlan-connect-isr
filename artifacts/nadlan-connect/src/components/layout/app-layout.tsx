import { Navbar } from "./navbar";
import { MarketBar } from "./market-bar";
import { PartnersMarquee } from "./partners-marquee";
import { useLanguage } from "./language-provider";
import { Logo } from "./logo";
import { Link, useLocation } from "wouter";
import { Calculator, Linkedin, Instagram, Mail, MapPin, ArrowUpRight } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [location] = useLocation();
  const isHome = location === "/";
  const hideMarketBar = location === "/outils/analyse-ia";
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className={`${isHome ? "fixed" : "sticky"} top-0 left-0 right-0 z-50`}>
        {!hideMarketBar && <MarketBar />}
        <Navbar />
      </div>
      <main className="flex-1 w-full relative">
        {children}
      </main>
      <a
        href="https://simmoisrael.com/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("nav.simulator")}
        className="fixed bottom-5 right-5 rtl:right-auto rtl:left-5 z-50 flex items-center gap-2 rounded-full bg-sea px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-transform hover:scale-105"
      >
        <Calculator className="h-5 w-5" />
        <span>{t("nav.simulator")}</span>
      </a>
      <PartnersMarquee />
      <footer className="bg-card text-muted-foreground border-t border-border">
        <div className="container grid max-w-6xl grid-cols-1 gap-12 py-14 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <div className="mb-4">
              <Logo />
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <div className="flex gap-2.5">
              {[
                { icon: Linkedin, label: "LinkedIn", href: "" },
                { icon: Instagram, label: "Instagram", href: "" },
                { icon: Mail, label: "Email", href: "mailto:contact@nadlanconnect.co.il" },
              ]
                .filter((s) => s.href !== "")
                .map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  title={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors hover:border-sea hover:bg-sea-soft hover:text-sea"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/" className="text-muted-foreground transition-colors hover:text-sea">{t("nav.home")}</Link></li>
              <li><Link href="/listings" className="text-muted-foreground transition-colors hover:text-sea">{t("nav.properties")}</Link></li>
              <li><Link href="/outils/analyse-ia" className="text-muted-foreground transition-colors hover:text-sea">{t("nav.aiAnalysis")}</Link></li>
              <li><Link href="/auth" className="text-muted-foreground transition-colors hover:text-sea">{t("nav.login")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
              {t("footer.contact")}
            </h4>
            <div className="mb-2.5 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-sea" />
              {t("footer.location")}
            </div>
            <a
              href="mailto:contact@nadlanconnect.co.il"
              className="mb-5 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-sea"
            >
              <Mail className="h-4 w-4 shrink-0 text-sea" />
              contact@nadlanconnect.co.il
            </a>
            <a
              href="https://simmoisrael.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-sea/30 bg-sea-soft px-3.5 py-2 text-xs font-semibold text-sea transition-colors hover:border-sea/50 hover:bg-sea/15"
            >
              <Calculator className="h-4 w-4" />
              {t("footer.aiSimulator")}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center">
          <div className="mb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px]">
            <Link href="/cgu" className="text-muted-foreground transition-colors hover:text-sea">{t("footer.cgu")}</Link>
            <span className="text-border">·</span>
            <Link href="/cgv" className="text-muted-foreground transition-colors hover:text-sea">{t("footer.cgv")}</Link>
            <span className="text-border">·</span>
            <Link href="/confidentialite" className="text-muted-foreground transition-colors hover:text-sea">{t("footer.privacy")}</Link>
            <span className="text-border">·</span>
            <Link href="/mentions-legales" className="text-muted-foreground transition-colors hover:text-sea">{t("footer.legal")}</Link>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            © {new Date().getFullYear()} NadlanConnect · {t("footer.disclaimer")}
          </p>
        </div>
      </footer>
    </div>
  );
}
