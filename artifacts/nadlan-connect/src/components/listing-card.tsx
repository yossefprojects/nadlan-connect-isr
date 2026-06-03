import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Listing } from "@workspace/api-client-react";
import { InvestmentScore } from "./investment-score";
import { MapPin, Maximize, Home as HomeIcon } from "lucide-react";

interface ListingCardProps {
  listing: Listing;
  showStatus?: boolean;
}

const CITY_LABELS: Record<string, string> = {
  tlv: "Tel Aviv",
  jer: "Jérusalem",
  hfa: "Haïfa",
  bs: "Beer-Sheva",
  nat: "Netanya",
  ash: "Ashdod",
};

export function ListingCard({ listing, showStatus }: ListingCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const cityLabel = CITY_LABELS[listing.ville] || listing.ville;

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="overflow-hidden cursor-pointer hover-elevate transition-all duration-300 group h-full flex flex-col border-border/50 hover:border-primary/20">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {listing.coverImageUrl ? (
            <img
              src={`/api/storage${listing.coverImageUrl}`}
              alt={listing.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
              <HomeIcon className="h-10 w-10 opacity-20" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="secondary" className="bg-white/90 text-primary hover:bg-white backdrop-blur-sm shadow-sm font-semibold">
              {listing.type === "new_development" ? "Neuf" : "Revente"}
            </Badge>
            {showStatus && listing.status !== "published" && (
              <Badge variant="outline" className="bg-background/90 backdrop-blur-sm shadow-sm">
                {listing.status === "draft" ? "Brouillon" : listing.status === "sold" ? "Vendu" : "Archivé"}
              </Badge>
            )}
          </div>
        </div>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
                {listing.title}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {cityLabel}{listing.quartier ? `, ${listing.quartier}` : ""}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-end">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Maximize className="h-4 w-4 text-primary/70" />
              <span>{listing.surface} m²</span>
            </div>
            <div className="flex items-center gap-1">
              <HomeIcon className="h-4 w-4 text-primary/70" />
              <span>{listing.nbPieces} pièces</span>
            </div>
          </div>

          {listing.investmentScore != null && (
            <div className="mb-4">
              <InvestmentScore score={listing.investmentScore} />
            </div>
          )}

          <div className="mt-auto">
            <div className="text-xl font-bold text-foreground">
              {formatPrice(listing.price)}
            </div>
            {listing.estimatedPrice != null && listing.estimatedPrice > listing.price && (
              <div className="text-xs font-medium text-emerald-600 mt-1">
                Estimation: {formatPrice(listing.estimatedPrice)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}