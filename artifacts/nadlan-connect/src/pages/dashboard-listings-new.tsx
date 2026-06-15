import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateListing, useAddListingImage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@workspace/object-storage-web";
import { Loader2, ImagePlus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/components/layout/language-provider";
import { ListingPhotoGrid, type PhotoItem } from "@/components/listing-photo-grid";
import { CITIES } from "@/data/villes";

interface PendingPhoto extends PhotoItem {
  file: File;
}

export default function DashboardListingsNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createListing = useCreateListing();
  const addListingImage = useAddListingImage();
  const { t } = useLanguage();

  const programIdParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("programId")
      : null;
  const programId = programIdParam ? Number(programIdParam) : undefined;
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ville: "",
    quartier: "",
    surface: "",
    nbPieces: "",
    etage: "",
    price: "",
    type: "resale" as "resale" | "new_development"
  });

  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [createdListingId, setCreatedListingId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => {
      console.log("Uploaded successfully", res);
    },
  });

  const setPhotoStatus = (key: string, status: PhotoItem["status"]) =>
    setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, status } : p)));

  const setPhotoProgress = (key: string, progress: number) =>
    setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, progress } : p)));

  const handleAddPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added = Array.from(files).map((file, i) => ({
      key: `${Date.now()}-${i}-${file.name}`,
      url: URL.createObjectURL(file),
      file
    }));
    setPhotos((prev) => [...prev, ...added]);
  };

  const handleReorder = (next: PhotoItem[]) => {
    setPhotos((prev) =>
      next.map((p) => prev.find((x) => x.key === p.key)!).filter(Boolean)
    );
  };

  const handleDeletePhoto = (key: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.key !== key);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.ville || !formData.surface || !formData.nbPieces || !formData.price) {
      toast({ title: t("listingForm.fillRequired"), variant: "destructive" });
      return;
    }

    try {
      let listingId = createdListingId;
      if (listingId == null) {
        const listing = await createListing.mutateAsync({
          data: {
            title: formData.title,
            description: formData.description,
            ville: formData.ville,
            quartier: formData.quartier,
            surface: Number(formData.surface),
            nbPieces: Number(formData.nbPieces),
            etage: formData.etage ? Number(formData.etage) : undefined,
            price: Number(formData.price),
            type: formData.type,
            ...(programId != null ? { programId } : {})
          }
        });
        listingId = listing.id;
        setCreatedListingId(listingId);
      }

      const toUpload = photos.filter((p) => p.status !== "done");
      let position = photos.length - toUpload.length;
      let processed = 0;
      let failures = 0;
      setUploadProgress({ done: 0, total: toUpload.length });

      for (const photo of toUpload) {
        setPhotoStatus(photo.key, "uploading");
        setPhotoProgress(photo.key, 0);
        try {
          const uploadRes = await uploadFile(photo.file, {
            onProgress: (pct) => setPhotoProgress(photo.key, pct),
          });
          if (!uploadRes?.objectPath) throw new Error("upload failed");
          await addListingImage.mutateAsync({
            listingId,
            data: { url: uploadRes.objectPath, position: position++ }
          });
          setPhotoStatus(photo.key, "done");
        } catch {
          failures++;
          setPhotoStatus(photo.key, "error");
        } finally {
          processed++;
          setUploadProgress({ done: processed, total: toUpload.length });
        }
      }

      setUploadProgress(null);

      if (failures > 0) {
        toast({ title: t("listingForm.someUploadsFailed"), variant: "destructive" });
        return;
      }

      toast({ title: t("listingForm.created") });
      setLocation("/dashboard");
    } catch (err) {
      setUploadProgress(null);
      toast({ title: t("listingForm.createError"), variant: "destructive" });
    }
  };

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="font-serif text-3xl font-bold text-primary mb-8">{t("listingForm.newTitle")}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("listingForm.fieldTitle")}</label>
            <Input 
              dir="auto"
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder={t("listingForm.titlePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("listingForm.fieldType")}</label>
            <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resale">{t("listingType.resale")}</SelectItem>
                <SelectItem value="new_development">{t("listingType.new_development")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("listingForm.fieldCity")}</label>
            <Select value={formData.ville} onValueChange={(val) => setFormData({...formData, ville: val})}>
              <SelectTrigger>
                <SelectValue placeholder={t("listingForm.cityPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{t(`city.${c}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("listingForm.fieldQuartier")}</label>
            <Input 
              dir="auto"
              value={formData.quartier} 
              onChange={e => setFormData({...formData, quartier: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("listingForm.fieldSurface")}</label>
            <Input 
              type="number"
              value={formData.surface} 
              onChange={e => setFormData({...formData, surface: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("listingForm.fieldRooms")}</label>
            <Input 
              type="number" step="0.5"
              value={formData.nbPieces} 
              onChange={e => setFormData({...formData, nbPieces: e.target.value})} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("listingForm.fieldFloor")}</label>
            <Input 
              type="number"
              value={formData.etage} 
              onChange={e => setFormData({...formData, etage: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("listingForm.fieldPrice")}</label>
            <Input 
              type="number"
              value={formData.price} 
              onChange={e => setFormData({...formData, price: e.target.value})} 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("listingForm.fieldDescription")}</label>
          <Textarea 
            dir="auto"
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
            rows={5}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("listingForm.fieldPhotos")}</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("add-photos-input")?.click()}
            >
              <ImagePlus className="me-2 h-4 w-4" />
              {t("listingForm.addPhotos")}
            </Button>
            <input
              id="add-photos-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleAddPhotos(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("listingForm.photosHint")}</p>
          {uploadProgress && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t("listingForm.uploadingProgress")
                  .replace("{done}", String(uploadProgress.done))
                  .replace("{total}", String(uploadProgress.total))}
              </p>
              <Progress
                value={uploadProgress.total ? (uploadProgress.done / uploadProgress.total) * 100 : 0}
              />
            </div>
          )}
          <ListingPhotoGrid
            photos={photos}
            onReorder={handleReorder}
            onDelete={handleDeletePhoto}
            disabled={uploadProgress !== null}
          />
        </div>

        <div className="pt-4 border-t flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => setLocation("/dashboard")}>{t("listingForm.cancel")}</Button>
          <Button type="submit" disabled={createListing.isPending || isUploading || uploadProgress !== null}>
            {(createListing.isPending || isUploading || uploadProgress !== null) && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("listingForm.create")}
          </Button>
        </div>
      </form>
    </div>
  );
}