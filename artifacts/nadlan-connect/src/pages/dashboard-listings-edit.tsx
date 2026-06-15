import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { 
  useGetListing, 
  getGetListingQueryKey,
  useUpdateListing,
  useAddListingImage,
  useDeleteListingImage,
  useReorderListingImages,
  useDeleteListing
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@workspace/object-storage-web";
import { Loader2, Trash2, ImagePlus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/language-provider";
import { CITIES } from "@/data/villes";
import { ListingPhotoGrid, type PhotoItem } from "@/components/listing-photo-grid";

interface PendingUpload extends PhotoItem {
  file: File;
}

export default function DashboardListingsEdit() {
  const [, params] = useRoute("/dashboard/listings/:id/edit");
  const listingId = params?.id ? parseInt(params.id, 10) : 0;

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  
  const { data: detail, isLoading } = useGetListing(String(listingId), {
    query: { enabled: !!listingId, queryKey: getGetListingQueryKey(String(listingId)) }
  });
  
  const updateListing = useUpdateListing();
  const addListingImage = useAddListingImage();
  const deleteListingImage = useDeleteListingImage();
  const reorderListingImages = useReorderListingImages();
  const deleteListing = useDeleteListing();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ville: "",
    quartier: "",
    surface: "",
    nbPieces: "",
    etage: "",
    price: "",
    type: "resale" as any,
    status: "draft" as any
  });

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    if (detail?.listing) {
      setFormData({
        title: detail.listing.title,
        description: detail.listing.description || "",
        ville: detail.listing.ville,
        quartier: detail.listing.quartier || "",
        surface: detail.listing.surface.toString(),
        nbPieces: detail.listing.nbPieces.toString(),
        etage: detail.listing.etage ? detail.listing.etage.toString() : "",
        price: detail.listing.price.toString(),
        type: detail.listing.type,
        status: detail.listing.status
      });
    }
    if (detail?.images) {
      setPhotos(
        [...detail.images]
          .sort((a, b) => a.position - b.position)
          .map((img) => ({ key: String(img.id), url: img.url }))
      );
    }
  }, [detail]);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => console.log("Uploaded successfully", res),
  });

  const persistOrder = async (next: PhotoItem[]) => {
    const serverNext = next.filter((p) => !p.key.startsWith("up-"));
    const previous = photos;
    setPhotos(serverNext);
    try {
      await reorderListingImages.mutateAsync({
        listingId,
        data: { imageIds: serverNext.map((p) => Number(p.key)) }
      });
      queryClient.invalidateQueries({ queryKey: getGetListingQueryKey(String(listingId)) });
    } catch {
      setPhotos(previous);
      toast({ title: t("listingForm.reorderError"), variant: "destructive" });
    }
  };

  const handleDeletePhoto = async (key: string) => {
    if (key.startsWith("up-")) {
      setUploads((prev) => {
        const target = prev.find((u) => u.key === key);
        if (target) URL.revokeObjectURL(target.url);
        return prev.filter((u) => u.key !== key);
      });
      return;
    }
    const previous = photos;
    setPhotos(photos.filter((p) => p.key !== key));
    try {
      await deleteListingImage.mutateAsync({ listingId, imageId: Number(key) });
      queryClient.invalidateQueries({ queryKey: getGetListingQueryKey(String(listingId)) });
    } catch {
      setPhotos(previous);
      toast({ title: t("listingForm.deletePhotoError"), variant: "destructive" });
    }
  };

  const uploadOne = async (item: PendingUpload, position: number): Promise<boolean> => {
    setUploads((prev) => prev.map((u) => (u.key === item.key ? { ...u, status: "uploading" } : u)));
    try {
      const uploadRes = await uploadFile(item.file);
      if (!uploadRes?.objectPath) throw new Error("upload failed");
      await addListingImage.mutateAsync({
        listingId,
        data: { url: uploadRes.objectPath, position }
      });
      setUploads((prev) => prev.map((u) => (u.key === item.key ? { ...u, status: "done" } : u)));
      return true;
    } catch {
      setUploads((prev) => prev.map((u) => (u.key === item.key ? { ...u, status: "error" } : u)));
      return false;
    }
  };

  const handleAddPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const batch: PendingUpload[] = Array.from(files).map((file, i) => ({
      key: `up-${Date.now()}-${i}`,
      url: URL.createObjectURL(file),
      file,
      status: "uploading"
    }));
    setUploads((prev) => [...prev, ...batch]);

    let position = photos.length;
    let processed = 0;
    let failures = 0;
    setUploadProgress({ done: 0, total: batch.length });

    for (const item of batch) {
      const ok = await uploadOne(item, position);
      if (ok) position++;
      else failures++;
      processed++;
      setUploadProgress({ done: processed, total: batch.length });
    }

    setUploadProgress(null);
    await queryClient.invalidateQueries({ queryKey: getGetListingQueryKey(String(listingId)) });
    setUploads((prev) => {
      prev.filter((u) => u.status === "done").forEach((u) => URL.revokeObjectURL(u.url));
      return prev.filter((u) => u.status === "error");
    });

    if (failures > 0) {
      toast({ title: t("listingForm.someUploadsFailed"), variant: "destructive" });
    }
  };

  const handleRetryPhoto = async (key: string) => {
    const item = uploads.find((u) => u.key === key && u.status === "error");
    if (!item) return;

    setUploadProgress({ done: 0, total: 1 });
    const ok = await uploadOne(item, photos.length);
    setUploadProgress({ done: 1, total: 1 });

    setUploadProgress(null);
    await queryClient.invalidateQueries({ queryKey: getGetListingQueryKey(String(listingId)) });

    if (ok) {
      setUploads((prev) => {
        const target = prev.find((u) => u.key === key);
        if (target) URL.revokeObjectURL(target.url);
        return prev.filter((u) => u.key !== key);
      });
    } else {
      toast({ title: t("listingForm.someUploadsFailed"), variant: "destructive" });
    }
  };

  const displayPhotos: PhotoItem[] = [...photos, ...uploads];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.ville || !formData.surface || !formData.nbPieces || !formData.price) {
      toast({ title: t("listingForm.fillRequired"), variant: "destructive" });
      return;
    }

    try {
      await updateListing.mutateAsync({
        listingId,
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
          status: formData.status
        }
      });

      queryClient.invalidateQueries({ queryKey: getGetListingQueryKey(String(listingId)) });
      toast({ title: t("listingForm.updated") });
      setLocation("/dashboard");
    } catch (err) {
      toast({ title: t("listingForm.updateError"), variant: "destructive" });
    }
  };

  const handleDelete = () => {
    if (confirm(t("listingForm.confirmDelete"))) {
      deleteListing.mutate({ listingId }, {
        onSuccess: () => {
          toast({ title: t("listingForm.deleted") });
          setLocation("/dashboard");
        }
      });
    }
  };

  if (isLoading) return <div className="p-8">{t("common.loading")}</div>;

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl font-bold text-primary">{t("listingForm.editTitle")}</h1>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteListing.isPending}>
          <Trash2 className="h-4 w-4 me-2" /> {t("listingForm.delete")}
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("listingForm.fieldTitle")}</label>
            <Input 
              dir="auto"
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
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
                <SelectValue />
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

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">{t("listingForm.fieldStatus")}</label>
            <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("status.draft")}</SelectItem>
                <SelectItem value="published">{t("status.published")}</SelectItem>
                <SelectItem value="sold">{t("status.sold")}</SelectItem>
                <SelectItem value="archived">{t("status.archived")}</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={uploadProgress !== null}
              onClick={() => document.getElementById("add-photos-input")?.click()}
            >
              {uploadProgress !== null ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="me-2 h-4 w-4" />
              )}
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
            photos={displayPhotos}
            onReorder={persistOrder}
            onDelete={handleDeletePhoto}
            onRetry={handleRetryPhoto}
            disabled={reorderListingImages.isPending || deleteListingImage.isPending || uploadProgress !== null}
          />
        </div>

        <div className="pt-4 border-t flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => setLocation("/dashboard")}>{t("listingForm.cancel")}</Button>
          <Button type="submit" disabled={updateListing.isPending || isUploading}>
            {(updateListing.isPending || isUploading) && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("listingForm.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}