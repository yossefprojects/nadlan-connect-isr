import { useRef, useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Listing } from "@workspace/api-client-react";
import { InvestmentScore } from "./investment-score";
import { MapPin, Maximize, Home as HomeIcon, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/layout/language-provider";

interface ListingCardProps {
  listing: Listing;
  showStatus?: boolean;
  onRemove?: () => void;
  isRemoving?: boolean;
}

const CITY_LABELS: Record<string, string> = {
  tlv: "Tel Aviv",
  jer: "Jérusalem",
  hfa: "Haïfa",
  bs: "Beer-Sheva",
  nat: "Netanya",
  ash: "Ashdod",
};

export function ListingCard({ listing, showStatus, onRemove, isRemoving }: ListingCardProps) {
  const { t, dir } = useLanguage();

  const galleryImages =
    listing.galleryImageUrls && listing.galleryImageUrls.length > 0
      ? listing.galleryImageUrls
      : listing.coverImageUrl
        ? [listing.coverImageUrl]
        : [];
  const [activeImage, setActiveImage] = useState(0);
  const currentImage = galleryImages[Math.min(activeImage, galleryImages.length - 1)];
  const hasMultiple = galleryImages.length > 1;

  const stepImage = (delta: number) => {
    const count = galleryImages.length;
    if (count === 0) return;
    setActiveImage((prev) => ((prev + delta) % count + count) % count);
  };

  const goToImage = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const count = galleryImages.length;
    setActiveImage(((index % count) + count) % count);
  };

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);
  const SWIPE_THRESHOLD = 40;

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    swipedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      swipedRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || !hasMultiple) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < SWIPE_THRESHOLD) return;
    swipedRef.current = true;
    const swipeLeft = dx < 0;
    const forward = dir === "rtl" ? !swipeLeft : swipeLeft;
    stepImage(forward ? 1 : -1);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (swipedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      swipedRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasMultiple) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation();
      stepImage(dir === "rtl" ? 1 : -1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      stepImage(dir === "rtl" ? -1 : 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      e.stopPropagation();
      setActiveImage(0);
    } else if (e.key === "End") {
      e.preventDefault();
      e.stopPropagation();
      setActiveImage(galleryImages.length - 1);
    }
  };

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
        <div
          className="relative aspect-[4/3] overflow-hidden bg-muted touch-pan-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C9A84C]"
          role={hasMultiple ? "group" : undefined}
          aria-label={hasMultiple ? listing.title : undefined}
          aria-roledescription={hasMultiple ? "carousel" : undefined}
          tabIndex={hasMultiple ? 0 : undefined}
          onTouchStart={hasMultiple ? handleTouchStart : undefined}
          onTouchMove={hasMultiple ? handleTouchMove : undefined}
          onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
          onClickCapture={hasMultiple ? handleClickCapture : undefined}
          onKeyDown={hasMultiple ? handleKeyDown : undefined}
        >
          {currentImage ? (
            <img
              src={`/api/storage${currentImage}`}
              alt={listing.title}
              draggable={false}
              className="object-cover w-full h-full select-none group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
              <HomeIcon className="h-10 w-10 opacity-20" />
            </div>
          )}
          {hasMultiple && (
            <>
              <button
                type="button"
                aria-label={t("card.prevPhoto")}
                title={t("card.prevPhoto")}
                onClick={(e) => goToImage(e, activeImage - 1)}
                className="absolute top-1/2 left-2 rtl:left-auto rtl:right-2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-primary shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5 rtl:hidden" />
                <ChevronRight className="h-5 w-5 hidden rtl:block" />
              </button>
              <button
                type="button"
                aria-label={t("card.nextPhoto")}
                title={t("card.nextPhoto")}
                onClick={(e) => goToImage(e, activeImage + 1)}
                className="absolute top-1/2 right-2 rtl:right-auto rtl:left-2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-primary shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronRight className="h-5 w-5 rtl:hidden" />
                <ChevronLeft className="h-5 w-5 hidden rtl:block" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {galleryImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={t("card.goToPhoto").replace("{n}", String(i + 1))}
                    onClick={(e) => goToImage(e, i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === Math.min(activeImage, galleryImages.length - 1)
                        ? "w-4 bg-white"
                        : "w-1.5 bg-white/60 hover:bg-white/90"
                    }`}
                  />
                ))}
              </div>
            </>
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
          {onRemove && (
            <button
              type="button"
              aria-label={t("card.removeFavorite")}
              title={t("card.removeFavorite")}
              disabled={isRemoving}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-3 right-3 rtl:right-auto rtl:left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Heart className="h-5 w-5 fill-current" />
            </button>
          )}
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