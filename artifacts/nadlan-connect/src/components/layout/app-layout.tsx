import { Navbar } from "./navbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 w-full relative">
        {children}
      </main>
      <footer className="border-t py-12 bg-card text-muted-foreground">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="font-serif text-xl font-bold text-primary">NadlanConnect</span>
            </div>
            <p className="text-sm max-w-sm">
              La plateforme premium pour l'immobilier israélien.
              Connectez-vous avec les meilleurs agents et promoteurs.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Liens Rapides</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-primary transition-colors">Accueil</a></li>
              <li><a href="/listings" className="hover:text-primary transition-colors">Propriétés</a></li>
              <li><a href="/auth" className="hover:text-primary transition-colors">Connexion</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>Tel Aviv, Israël</li>
              <li>contact@nadlanconnect.co.il</li>
            </ul>
          </div>
        </div>
        <div className="container border-t mt-12 pt-8 text-sm text-center">
          © {new Date().getFullYear()} NadlanConnect. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}