import {
  useGetMyFavorites,
  useRemoveFavorite,
  useAddFavorite,
  getGetMyFavoritesQueryKey,
  type Listing,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/layout/language-provider";

export default function Favorites() {
  const { data: favorites, isLoading } = useGetMyFavorites();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const removeFavorite = useRemoveFavorite();
  const addFavorite = useAddFavorite();

  const handleUndo = (listing: Listing) => {
    const queryKey = getGetMyFavoritesQueryKey();
    queryClient.setQueryData<Listing[]>(queryKey, old => {
      if (!old) return old;
      if (old.some(l => l.id === listing.id)) return old;
      return [listing, ...old];
    });
    addFavorite.mutate(
      { listingId: listing.id },
      {
        onError: () => {
          queryClient.setQueryData<Listing[]>(queryKey, old =>
            old?.filter(l => l.id !== listing.id)
          );
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey });
        },
      }
    );
  };

  const handleRemove = (listing: Listing) => {
    const queryKey = getGetMyFavoritesQueryKey();
    const previous = queryClient.getQueryData<Listing[]>(queryKey);
    queryClient.setQueryData<Listing[]>(queryKey, old =>
      old?.filter(l => l.id !== listing.id)
    );
    removeFavorite.mutate(
      { listingId: listing.id },
      {
        onSuccess: () => {
          toast({
            title: t("favorites.removed"),
            action: (
              <ToastAction
                altText={t("favorites.undo")}
                onClick={() => handleUndo(listing)}
              >
                {t("favorites.undo")}
              </ToastAction>
            ),
          });
        },
        onError: () => {
          if (previous) {
            queryClient.setQueryData(queryKey, previous);
          }
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey });
        },
      }
    );
  };

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
          <p className="text-muted-foreground mb-6">{t("favorites.empty.subtitle")}</p>
          <Link href="/listings">
            <Button>{t("favorites.empty.cta")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites?.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onRemove={() => handleRemove(listing)}
              isRemoving={removeFavorite.isPending && removeFavorite.variables?.listingId === listing.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
