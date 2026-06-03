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
      <footer className="py-12 bg-[#1A3A5C] text-white/60">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2.5 mb-4">
              <img src="/favicon.png" alt="NadlanConnect" className="h-8 w-8 rounded-lg" />
              <span className="font-serif text-xl font-bold text-white">NadlanConnect</span>
            </div>
            <p className="text-sm max-w-sm text-white/50">
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
        <div className="container border-t border-white/10 mt-10 pt-8 text-sm text-center text-white/30">
          © {new Date().getFullYear()} NadlanConnect. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
