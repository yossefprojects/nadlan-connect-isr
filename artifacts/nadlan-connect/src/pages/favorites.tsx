import { useGetMyFavorites, getGetMyFavoritesQueryKey } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";

export default function Favorites() {
  const { data: favorites, isLoading } = useGetMyFavorites();

  return (
    <div className="container py-8 max-w-6xl">
      <h1 className="font-serif text-3xl font-bold text-primary mb-2">Mes Favoris</h1>
      <p className="text-muted-foreground mb-8">Retrouvez les biens immobiliers que vous avez sauvegardés.</p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-[400px] bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : favorites?.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <h3 className="text-xl font-medium mb-2">Aucun favori</h3>
          <p className="text-muted-foreground">Vous n'avez pas encore sauvegardé de propriétés.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Note: In a real implementation we would fetch the actual listing details for the favorites, 
              but since the API for favorites just returns ids, we map them if we had the full listings.
              For this mockup we assume favorites come with listing data or we fetch them. 
              Let's display a placeholder notice for the mock. */}
          <div className="col-span-full text-center p-8 bg-muted/20 rounded-lg">
            Les favoris sont sauvegardés (IDs: {favorites?.map(f => f.listingId).join(", ")}).
          </div>
        </div>
      )}
    </div>
  );
}