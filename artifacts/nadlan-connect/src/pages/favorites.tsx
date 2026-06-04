import { useGetMyFavorites } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";
import { useLanguage } from "@/components/layout/language-provider";

export default function Favorites() {
  const { data: favorites, isLoading } = useGetMyFavorites();
  const { t } = useLanguage();

  return (
    <div className="container py-8 max-w-6xl">
      <h1 className="font-serif text-3xl font-bold text-primary mb-2">{t("favorites.title")}</h1>
      <p className="text-muted-foreground mb-8">{t("favorites.subtitle")}</p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-[400px] bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : favorites?.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <h3 className="text-xl font-medium mb-2">{t("favorites.empty.title")}</h3>
          <p className="text-muted-foreground">{t("favorites.empty.subtitle")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites?.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
