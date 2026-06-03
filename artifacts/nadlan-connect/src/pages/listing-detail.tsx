import { useRoute } from "wouter";
import { 
  useGetListing, getGetListingQueryKey,
  useAddFavorite, useRemoveFavorite, getGetMyFavoritesQueryKey,
  useCreateLead,
  useGetMyFavorites
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { InvestmentScore } from "@/components/investment-score";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Maximize, Home, Heart, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ListingDetail() {
  const [, params] = useRoute("/listings/:id");
  const listingId = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: detail, isLoading } = useGetListing(listingId, {
    query: { enabled: !!listingId, queryKey: getGetListingQueryKey(listingId) }
  });
  const { data: favorites } = useGetMyFavorites();

  const isFavorited = favorites?.some(f => f.listingId === listingId) || false;
  
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const createLead = useCreateLead();

  const [message, setMessage] = useState("");

  const toggleFavorite = () => {
    if (!isAuthenticated) {
      toast({ title: "Connectez-vous pour ajouter aux favoris", variant: "destructive" });
      return;
    }
    
    if (isFavorited) {
      removeFavorite.mutate({ data: { listingId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyFavoritesQueryKey() });
          toast({ title: "Retiré des favoris" });
        }
      });
    } else {
      addFavorite.mutate({ data: { listingId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyFavoritesQueryKey() });
          toast({ title: "Ajouté aux favoris" });
        }
      });
    }
  };

  const handleSendLead = () => {
    if (!isAuthenticated) {
      toast({ title: "Connectez-vous pour contacter l'agent", variant: "destructive" });
      return;
    }
    createLead.mutate({ data: { listingId, message } }, {
      onSuccess: () => {
        toast({ title: "Message envoyé avec succès" });
        setMessage("");
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center">Chargement...</div>;
  if (!detail) return <div className="p-8 text-center">Propriété introuvable.</div>;

  const listing = detail.listing;

  return (
    <div className="container py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-xl overflow-hidden aspect-video bg-muted relative">
            {listing.coverImageUrl ? (
              <img src={`/api/storage${listing.coverImageUrl}`} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Home className="h-12 w-12 opacity-20" /></div>
            )}
            <div className="absolute top-4 right-4">
              <Button variant="secondary" size="icon" className="rounded-full bg-white/90 hover:bg-white text-primary" onClick={toggleFavorite}>
                <Heart className={`h-5 w-5 ${isFavorited ? "fill-primary" : ""}`} />
              </Button>
            </div>
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="secondary" className="bg-white/90 text-primary hover:bg-white">{listing.type === "new_development" ? "Neuf" : "Revente"}</Badge>
            </div>
          </div>
          
          <div>
            <h1 className="font-serif text-4xl font-bold text-primary mb-2">{listing.title}</h1>
            <p className="text-muted-foreground flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" /> {listing.ville}{listing.quartier ? `, ${listing.quartier}` : ""}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-6 py-6 border-y">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg text-primary"><Maximize className="h-6 w-6" /></div>
              <div><div className="text-sm text-muted-foreground">Surface</div><div className="font-semibold text-lg">{listing.surface} m²</div></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg text-primary"><Home className="h-6 w-6" /></div>
              <div><div className="text-sm text-muted-foreground">Pièces</div><div className="font-semibold text-lg">{listing.nbPieces}</div></div>
            </div>
          </div>
          
          <div>
            <h3 className="font-serif text-2xl font-bold text-primary mb-4">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{listing.description || "Aucune description fournie."}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-primary mb-2">
              ₪{listing.price.toLocaleString("he-IL")}
            </div>
            {listing.estimatedPrice && (
              <div className="text-sm font-medium text-emerald-600 mb-6">
                Estimation du marché: ₪{listing.estimatedPrice.toLocaleString("he-IL")}
              </div>
            )}
            
            {listing.investmentScore != null && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <InvestmentScore score={listing.investmentScore} />
              </div>
            )}

            <div className="border-t pt-6 mt-6">
              <h4 className="font-semibold mb-4">Contacter le professionnel</h4>
              <div className="space-y-4">
                <Textarea 
                  placeholder="Bonjour, je suis intéressé par ce bien..." 
                  className="resize-none" 
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button className="w-full gap-2" size="lg" onClick={handleSendLead} disabled={createLead.isPending || !message.trim()}>
                  <Send className="h-4 w-4" /> {createLead.isPending ? "Envoi..." : "Envoyer une demande"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}