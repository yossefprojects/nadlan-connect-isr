import { useState } from "react";
import { Star, GripVertical, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/layout/language-provider";

export interface PhotoItem {
  key: string;
  url: string;
  /** undefined / "done" = ready. "uploading" and "error" are transient batch states. */
  status?: "uploading" | "error" | "done";
}

interface Props {
  photos: PhotoItem[];
  onReorder: (next: PhotoItem[]) => void;
  onDelete: (key: string) => void;
  disabled?: boolean;
}

export function ListingPhotoGrid({ photos, onReorder, onDelete, disabled }: Props) {
  const { t } = useLanguage();
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= photos.length ||
      to >= photos.length
    )
      return;
    if (photos[to]?.status) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onReorder(next);
  };

  if (photos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("listingForm.noPhotos")}</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {photos.map((photo, index) => {
        const isUploading = photo.status === "uploading";
        const isError = photo.status === "error";
        const interactive = !disabled && !isUploading && !isError;

        return (
          <div
            key={photo.key}
            draggable={interactive}
            onDragStart={() => interactive && setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) move(dragIndex, index);
              setDragIndex(null);
            }}
            onDragEnd={() => setDragIndex(null)}
            className={`group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted ${
              dragIndex === index ? "opacity-50" : ""
            } ${interactive ? "cursor-move" : ""} ${
              isError ? "border-destructive ring-1 ring-destructive" : ""
            }`}
          >
            <img
              src={photo.url}
              alt=""
              className={`h-full w-full object-cover ${
                isUploading || isError ? "opacity-40" : ""
              }`}
              draggable={false}
            />

            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs font-medium text-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>{t("listingForm.photoUploading")}</span>
              </div>
            )}

            {isError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2 text-center text-xs font-medium text-destructive">
                <AlertCircle className="h-6 w-6" />
                <span>{t("listingForm.photoFailed")}</span>
              </div>
            )}

            {index === 0 && !isUploading && !isError && (
              <span className="absolute top-2 start-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                <Star className="h-3 w-3 fill-current" /> {t("listingForm.cover")}
              </span>
            )}

            {interactive && (
              <div className="absolute top-2 end-2 opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="h-5 w-5 text-white drop-shadow" />
              </div>
            )}

            {isError && (
              <div className="absolute top-2 end-2">
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => onDelete(photo.key)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {interactive && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                {index !== 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 text-xs"
                    onClick={() => move(index, 0)}
                  >
                    <Star className="me-1 h-3 w-3" /> {t("listingForm.setCover")}
                  </Button>
                ) : (
                  <span />
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => onDelete(photo.key)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
