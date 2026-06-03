import { useGetFeaturedListings, useGetListingsStats } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Building2, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: featuredListings, isLoading: isFeaturedLoading } = useGetFeaturedListings();
  const { data: stats } = useGetListingsStats();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Tel Aviv Skyline" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="container relative z-10 text-center px-4">
          <Badge className="mb-6 bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm py-1.5 px-4 rounded-full">
            La plateforme premium de l'immobilier israélien
          </Badge>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-6 leading-tight max-w-4xl mx-auto">
            Trouvez l'investissement parfait en Israël
          </h1>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto font-light">
            Données précises, opportunités exclusives et connexion directe avec les meilleurs professionnels du marché.
          </p>
          
          <div className="bg-background p-2 rounded-lg max-w-2xl mx-auto flex flex-col md:flex-row gap-2 shadow-xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par ville (ex: Tel Aviv, Jérusalem)..." 
                className="pl-10 h-12 border-0 bg-transparent shadow-none focus-visible:ring-0 text-base"
              />
            </div>
            <Link href="/listings">
              <Button size="lg" className="h-12 px-8 w-full md:w-auto text-base">
                Rechercher
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50 border-y">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 bg-background p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{stats?.totalListings || 0}</div>
                <div className="text-sm text-muted-foreground font-medium">Propriétés exclusives</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-background p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">Data-driven</div>
                <div className="text-sm text-muted-foreground font-medium">Scores d'investissement précis</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-background p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">Réseau Pro</div>
                <div className="text-sm text-muted-foreground font-medium">Agents et promoteurs vérifiés</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-serif text-3xl font-bold text-primary mb-2">Opportunités à la une</h2>
              <p className="text-muted-foreground">Sélection rigoureuse des meilleurs biens sur le marché</p>
            </div>
            <Link href="/listings">
              <Button variant="ghost" className="text-primary hover:text-primary/80 group">
                Voir tout <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          
          {isFeaturedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[400px] bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings?.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Quick inline Badge since we didn't write it separately
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>;
}