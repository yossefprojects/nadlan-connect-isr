import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Listing } from "@workspace/api-client-react";
import { InvestmentScore } from "./investment-score";
import { MapPin, Maximize, Home as HomeIcon } from "lucide-react";
import { useLanguage } from "@/components/layout/language-provider";

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
  const { t } = useLanguage();
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const cityLabel = CITY_LABELS[listing.ville] || listing.ville;

  return (
    <Link href={`/listings/${listing.slug}`}>
      <Card className="overflow-hidden cursor-pointer group h-full flex flex-col rounded-[10px] border-[0.5px] border-[#E5E7EB] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:border-[#C9A84C] hover:shadow-[0_4px_16px_rgba(26,58,92,0.12)]">
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
          <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 flex gap-2">
            <Badge variant="secondary" className="bg-white/90 text-primary hover:bg-white backdrop-blur-sm shadow-sm font-semibold">
              {listing.type === "new_development" ? t("listings.newDev") : t("listings.resale")}
            </Badge>
            {showStatus && listing.status !== "published" && (
              <Badge variant="outline" className="bg-background/90 backdrop-blur-sm shadow-sm">
                {listing.status === "draft" ? t("card.draft") : listing.status === "sold" ? t("card.sold") : t("card.archived")}
              </Badge>
            )}
          </div>
        </div>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 dir="auto" className="font-serif text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
                {listing.title}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {cityLabel}{listing.quartier ? <>, <span dir="auto">{listing.quartier}</span></> : ""}
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
              <span>{listing.nbPieces} {t("card.rooms")}</span>
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
                {t("card.estimation")}: {formatPrice(listing.estimatedPrice)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}