import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { 
  useGetListing, 
  getGetListingQueryKey,
  useUpdateListing,
  useAddListingImage,
  useDeleteListing
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@workspace/object-storage-web";
import { Loader2, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function DashboardListingsEdit() {
  const [, params] = useRoute("/dashboard/listings/:id/edit");
  const listingId = params?.id ? parseInt(params.id, 10) : 0;

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: detail, isLoading } = useGetListing(String(listingId), {
    query: { enabled: !!listingId, queryKey: getGetListingQueryKey(String(listingId)) }
  });
  
  const updateListing = useUpdateListing();
  const addListingImage = useAddListingImage();
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
  }, [detail]);

  const [coverFile, setCoverFile] = useState<File | null>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => console.log("Uploaded successfully", res),
    onError: () => toast({ title: "Erreur lors du téléchargement de l'image", variant: "destructive" })
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.ville || !formData.surface || !formData.nbPieces || !formData.price) {
      toast({ title: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
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

      if (coverFile) {
        const uploadRes = await uploadFile(coverFile);
        if (uploadRes?.objectPath) {
          await addListingImage.mutateAsync({
            listingId,
            data: {
              url: uploadRes.objectPath,
              position: 0
            }
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: getGetListingQueryKey(String(listingId)) });
      toast({ title: "Propriété mise à jour" });
      setLocation("/dashboard");
    } catch (err) {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    }
  };

  const handleDelete = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette propriété ?")) {
      deleteListing.mutate({ listingId }, {
        onSuccess: () => {
          toast({ title: "Propriété supprimée" });
          setLocation("/dashboard");
        }
      });
    }
  };

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl font-bold text-primary">Modifier la Propriété</h1>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteListing.isPending}>
          <Trash2 className="h-4 w-4 mr-2" /> Supprimer
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Titre *</label>
            <Input 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Type *</label>
            <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resale">Revente</SelectItem>
                <SelectItem value="new_development">Neuf</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Ville *</label>
            <Select value={formData.ville} onValueChange={(val) => setFormData({...formData, ville: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tlv">Tel Aviv</SelectItem>
                <SelectItem value="jer">Jérusalem</SelectItem>
                <SelectItem value="hfa">Haïfa</SelectItem>
                <SelectItem value="bs">Beer-Sheva</SelectItem>
                <SelectItem value="nat">Netanya</SelectItem>
                <SelectItem value="ash">Ashdod</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Quartier</label>
            <Input 
              value={formData.quartier} 
              onChange={e => setFormData({...formData, quartier: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Surface (m²) *</label>
            <Input 
              type="number"
              value={formData.surface} 
              onChange={e => setFormData({...formData, surface: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre de pièces *</label>
            <Input 
              type="number" step="0.5"
              value={formData.nbPieces} 
              onChange={e => setFormData({...formData, nbPieces: e.target.value})} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Étage</label>
            <Input 
              type="number"
              value={formData.etage} 
              onChange={e => setFormData({...formData, etage: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Prix (₪) *</label>
            <Input 
              type="number"
              value={formData.price} 
              onChange={e => setFormData({...formData, price: e.target.value})} 
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Statut</label>
            <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="sold">Vendu</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Nouvelle photo principale (remplace l'existante)</label>
          <Input 
            type="file" 
            accept="image/*"
            onChange={e => setCoverFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="pt-4 border-t flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => setLocation("/dashboard")}>Annuler</Button>
          <Button type="submit" disabled={updateListing.isPending || isUploading}>
            {(updateListing.isPending || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}