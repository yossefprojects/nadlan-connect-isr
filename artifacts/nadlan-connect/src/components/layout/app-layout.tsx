import { Navbar } from "./navbar";
import { MarketBar } from "./market-bar";
import { useLanguage } from "./language-provider";
import { Link } from "wouter";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketBar />
      <Navbar />
      <main className="flex-1 w-full relative">
        {children}
      </main>
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
