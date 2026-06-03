import { Navbar } from "./navbar";
import { MarketBar } from "./market-bar";
import { Link } from "wouter";

export function AppLayout({ children }: { children: React.ReactNode }) {
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
              La plateforme premium pour l'immobilier israélien.
              Connectez-vous avec les meilleurs agents et promoteurs.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Liens Rapides</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-[#C9A84C] transition-colors">Accueil</Link></li>
              <li><Link href="/listings" className="hover:text-[#C9A84C] transition-colors">Propriétés</Link></li>
              <li><Link href="/auth" className="hover:text-[#C9A84C] transition-colors">Connexion</Link></li>
              <li>
                <a href="https://israel-simzip.replit.app/" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">
                  Simulateur IA
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>Tel Aviv, Israël</li>
              <li>contact@nadlanconnect.co.il</li>
            </ul>
          </div>
        </div>
        <div className="container border-t border-white/5 pb-8 pt-6 text-center">
          <p className="text-[11px] text-[#8995A5]">
            © {new Date().getFullYear()} NadlanConnect · Estimations indicatives, non contractuelles.
          </p>
        </div>
      </footer>
    </div>
  );
}
