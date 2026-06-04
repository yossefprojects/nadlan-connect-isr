import { Navbar } from "./navbar";
import { MarketBar } from "./market-bar";
import { useLanguage } from "./language-provider";
import { Link, useLocation } from "wouter";
import { Calculator } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [location] = useLocation();
  const isHome = location === "/";
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className={`${isHome ? "fixed" : "sticky"} top-0 left-0 right-0 z-50`}>
        <MarketBar />
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
      <footer className="bg-[#0F2235] text-[#6B7280] border-t-[0.5px] border-[#C9A84C]">
        <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2.5 mb-4">
              <img src="/favicon.png" alt="NadlanConnect" className="h-8 w-8 rounded-lg" />
              <span className="font-serif text-xl text-white">NadlanConnect</span>
            </div>
            <p className="text-sm max-w-sm text-[#6B7280]">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-[#C9A84C] transition-colors">{t("nav.home")}</Link></li>
              <li><Link href="/listings" className="hover:text-[#C9A84C] transition-colors">{t("nav.properties")}</Link></li>
              <li><Link href="/auth" className="hover:text-[#C9A84C] transition-colors">{t("nav.login")}</Link></li>
              <li>
                <a href="https://israel-simzip.replit.app/" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">
                  {t("footer.aiSimulator")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t("footer.contact")}</h4>
            <ul className="space-y-2 text-sm">
              <li>{t("footer.location")}</li>
              <li>contact@nadlanconnect.co.il</li>
            </ul>
          </div>
        </div>
        <div className="container border-t border-white/5 pb-8 pt-6 text-center">
          <p className="text-[11px] text-[#8995A5]">
            © {new Date().getFullYear()} NadlanConnect · {t("footer.disclaimer")}
          </p>
        </div>
      </footer>
    </div>
  );
}
