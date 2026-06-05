import { Navbar } from "./navbar";
import { MarketBar } from "./market-bar";
import { useLanguage } from "./language-provider";
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
        href="https://israel-simzip.replit.app/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("nav.simulator")}
        className="fixed bottom-5 right-5 rtl:right-auto rtl:left-5 z-50 flex items-center gap-2 rounded-full bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0F2235] shadow-lg shadow-black/20 transition-transform hover:scale-105 hover:bg-[#d8b95e]"
      >
        <Calculator className="h-5 w-5" />
        <span>{t("nav.simulator")}</span>
      </a>
      <footer className="bg-[#0A1628] text-white/60">
        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent md:mx-12" />
        <div className="container grid max-w-6xl grid-cols-1 gap-12 py-14 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <img src="/favicon.png" alt="NadlanConnect" className="h-8 w-8 rounded-lg" />
              <span className="font-serif text-xl text-white">
                Nadlan<span className="text-[#C9A84C]">Connect</span>
              </span>
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-white/40">
              {t("footer.tagline")}
            </p>
            <div className="flex gap-2.5">
              {[
                { icon: Linkedin, label: "LinkedIn", href: "#" },
                { icon: Instagram, label: "Instagram", href: "#" },
                { icon: Mail, label: "Email", href: "mailto:contact@nadlanconnect.co.il" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  title={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-colors hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C9A84C]">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/" className="text-white/40 transition-colors hover:text-[#C9A84C]">{t("nav.home")}</Link></li>
              <li><Link href="/listings" className="text-white/40 transition-colors hover:text-[#C9A84C]">{t("nav.properties")}</Link></li>
              <li><Link href="/outils/analyse-ia" className="text-white/40 transition-colors hover:text-[#C9A84C]">{t("nav.aiAnalysis")}</Link></li>
              <li><Link href="/auth" className="text-white/40 transition-colors hover:text-[#C9A84C]">{t("nav.login")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C9A84C]">
              {t("footer.contact")}
            </h4>
            <div className="mb-2.5 flex items-center gap-2 text-sm text-white/40">
              <MapPin className="h-4 w-4 shrink-0 text-[#C9A84C]" />
              {t("footer.location")}
            </div>
            <a
              href="mailto:contact@nadlanconnect.co.il"
              className="mb-5 flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-[#C9A84C]"
            >
              <Mail className="h-4 w-4 shrink-0 text-[#C9A84C]" />
              contact@nadlanconnect.co.il
            </a>
            <a
              href="https://israel-simzip.replit.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/10 px-3.5 py-2 text-xs font-semibold text-[#C9A84C] transition-colors hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/20"
            >
              <Calculator className="h-4 w-4" />
              {t("footer.aiSimulator")}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <div className="border-t border-white/5 py-5 text-center">
          <div className="mb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px]">
            <Link href="/cgu" className="text-white/30 transition-colors hover:text-[#C9A84C]">{t("footer.cgu")}</Link>
            <span className="text-white/10">·</span>
            <Link href="/cgv" className="text-white/30 transition-colors hover:text-[#C9A84C]">{t("footer.cgv")}</Link>
          </div>
          <p className="text-[11px] text-white/20">
            © {new Date().getFullYear()} NadlanConnect · {t("footer.disclaimer")}
          </p>
        </div>
      </footer>
    </div>
  );
}
