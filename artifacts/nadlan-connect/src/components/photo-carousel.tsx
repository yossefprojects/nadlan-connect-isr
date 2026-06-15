import { useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/layout/language-provider";

interface PhotoCarouselProps {
  images: string[];
  alt: string;
  placeholder: ReactNode;
  className?: string;
  imgClassName?: string;
}

export function PhotoCarousel({
  images,
  alt,
  placeholder,
  className,
  imgClassName,
}: PhotoCarouselProps) {
  const { t, dir } = useLanguage();

  const [activeImage, setActiveImage] = useState(0);
  const currentImage =
    images.length > 0 ? images[Math.min(activeImage, images.length - 1)] : undefined;
  const hasMultiple = images.length > 1;

  const stepImage = (delta: number) => {
    const count = images.length;
    if (count === 0) return;
    setActiveImage((prev) => ((((prev + delta) % count) + count) % count));
  };

  const goToImage = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const count = images.length;
    if (count === 0) return;
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
      setActiveImage(images.length - 1);
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-muted touch-pan-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C9A84C] ${className ?? ""}`}
      role={hasMultiple ? "group" : undefined}
      aria-label={hasMultiple ? alt : undefined}
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
          alt={alt}
          draggable={false}
          className={`object-cover w-full h-full select-none ${imgClassName ?? ""}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
          {placeholder}
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
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={t("card.goToPhoto").replace("{n}", String(i + 1))}
                onClick={(e) => goToImage(e, i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === Math.min(activeImage, images.length - 1)
                    ? "w-4 bg-white"
                    : "w-1.5 bg-white/60 hover:bg-white/90"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
