import { useRoute } from "wouter";
import { 
  useGetListing, getGetListingQueryKey,
  useAddFavorite, useRemoveFavorite, getGetMyFavoritesQueryKey,
  useCreateLead,
  useGetMyFavorites,
  useApplyForMandate, getGetMyMandatesQueryKey,
  useGetMyMandates,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useUserRole } from "@/hooks/use-user-role";
import { InvestmentScore } from "@/components/investment-score";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Maximize, Home, Heart, Send, Bot, ExternalLink, Check, Handshake, FileText, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SIMULATOR_URL = "https://israel-simzip.replit.app/";

const VILLE_LABELS: Record<string, string> = {
  tlv: "Tel Aviv",
  jer: "Jérusalem",
  hfa: "Haïfa",
  bs: "Beer-Sheva",
  nat: "Netanya",
  ash: "Ashdod",
};

export default function ListingDetail() {
  const [, params] = useRoute("/listings/:id");
  const listingId = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: detail, isLoading } = useGetListing(listingId, {
    query: { enabled: !!listingId, queryKey: getGetListingQueryKey(listingId) }
  });
  const { data: favorites } = useGetMyFavorites();
  const isFavorited = favorites?.some(f => f.listingId === listingId) || false;
  
  const { isAuthenticated } = useAuth();
  const { role } = useUserRole();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const createLead = useCreateLead();
  const applyForMandate = useApplyForMandate();

  const { data: myMandates } = useGetMyMandates({ query: { enabled: isAuthenticated && role === "agent" } });
  const existingMandate = myMandates?.find(m => m.listingId === listingId);

  const [message, setMessage] = useState("");
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSent, setAiSent] = useState(false);

  // Mandate form state
  const [showMandateForm, setShowMandateForm] = useState(false);
  const [exclusive, setExclusive] = useState(false);
  const [mandateNote, setMandateNote] = useState("");
  const [justificationUrl, setJustificationUrl] = useState("");

  const toggleFavorite = () => {
    if (!isAuthenticated) {
      toast({ title: "Connectez-vous pour ajouter aux favoris", variant: "destructive" });
      return;
    }
    if (isFavorited) {
      removeFavorite.mutate({ data: { listingId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyFavoritesQueryKey() });
          toast({ title: "Retiré des favoris" });
        }
      });
    } else {
      addFavorite.mutate({ data: { listingId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyFavoritesQueryKey() });
          toast({ title: "Ajouté aux favoris" });
        }
      });
    }
  };

  const handleSendLead = () => {
    if (!isAuthenticated) {
      toast({ title: "Connectez-vous pour contacter l'agent", variant: "destructive" });
      return;
    }
    createLead.mutate({ data: { listingId, message } }, {
      onSuccess: () => {
        toast({ title: "Message envoyé avec succès" });
        setMessage("");
      }
    });
  };

  const handleApplyMandate = () => {
    applyForMandate.mutate(
      { listingId, data: { exclusive, note: mandateNote || undefined, justificationUrl: justificationUrl || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyMandatesQueryKey() });
          setShowMandateForm(false);
          toast({ title: "Candidature envoyée !", description: "Le promoteur examinera votre demande." });
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
          toast({ title: "Erreur", description: message, variant: "destructive" });
        }
      }
    );
  };

  const handleSendToSimulator = () => {
    if (!detail) return;
    const listing = detail.listing;

    const params = new URLSearchParams({
      ville: listing.ville,
      villeLabel: VILLE_LABELS[listing.ville] ?? listing.ville,
      surface: String(listing.surface),
      nbPieces: String(listing.nbPieces),
      prix: String(listing.price),
      type: listing.type,
      titre: listing.title,
      ...(listing.quartier ? { quartier: listing.quartier } : {}),
      ...(listing.etage != null ? { etage: String(listing.etage) } : {}),
      source: "nadlanconnect",
    });

    const simulatorUrl = `${SIMULATOR_URL}?${params.toString()}`;
    const win = window.open(simulatorUrl, "_blank", "noopener,noreferrer");

    if (win) {
      const payload = {
        type: "NADLAN_LISTING",
        listing: {
          ville: listing.ville,
          villeLabel: VILLE_LABELS[listing.ville] ?? listing.ville,
          quartier: listing.quartier ?? null,
          surface: listing.surface,
          nbPieces: listing.nbPieces,
          etage: listing.etage ?? null,
          prix: listing.price,
          prixEstime: listing.estimatedPrice ?? null,
          scoreInvestissement: listing.investmentScore ?? null,
          type: listing.type,
          titre: listing.title,
          description: listing.description ?? null,
        },
      };

      let attempts = 0;
      const sendMessage = () => {
        if (attempts >= 5 || win.closed) return;
        try { win.postMessage(payload, SIMULATOR_URL); } catch { /* cross-origin */ }
        attempts++;
        setTimeout(sendMessage, 1500);
      };
      setTimeout(sendMessage, 1000);
    }

    setAiSent(true);
    setShowAiModal(false);
    toast({
      title: "Bien envoyé au simulateur",
      description: "Le simulateur s'est ouvert dans un nouvel onglet avec les données du bien.",
    });
  };

  if (isLoading) return <div className="p-8 text-center">Chargement...</div>;
  if (!detail) return <div className="p-8 text-center">Propriété introuvable.</div>;

  const listing = detail.listing;

  const mandateStatusColor: Record<string, string> = {
    pending: "border-amber-200 text-amber-700 bg-amber-50",
    approved: "border-emerald-200 text-emerald-700 bg-emerald-50",
    rejected: "border-red-200 text-red-700 bg-red-50",
  };
  const mandateStatusLabel: Record<string, string> = {
    pending: "En attente",
    approved: "Approuvé",
    rejected: "Refusé",
  };

  return (
    <div className="container py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-xl overflow-hidden aspect-video bg-muted relative">
            {listing.coverImageUrl ? (
              <img src={`/api/storage${listing.coverImageUrl}`} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Home className="h-12 w-12 opacity-20" />
              </div>
            )}
            <div className="absolute top-4 right-4">
              <Button variant="secondary" size="icon" className="rounded-full bg-white/90 hover:bg-white text-primary" onClick={toggleFavorite}>
                <Heart className={`h-5 w-5 ${isFavorited ? "fill-primary" : ""}`} />
              </Button>
            </div>
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="secondary" className="bg-white/90 text-primary hover:bg-white">
                {listing.type === "new_development" ? "Neuf" : "Revente"}
              </Badge>
            </div>
          </div>
          
          <div>
            <h1 className="font-serif text-4xl font-bold text-primary mb-2">{listing.title}</h1>
            <p className="text-muted-foreground flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" /> {listing.ville}{listing.quartier ? `, ${listing.quartier}` : ""}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-6 py-6 border-y">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg text-primary"><Maximize className="h-6 w-6" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Surface</div>
                <div className="font-semibold text-lg">{listing.surface} m²</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg text-primary"><Home className="h-6 w-6" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Pièces</div>
                <div className="font-semibold text-lg">{listing.nbPieces}</div>
              </div>
            </div>
          </div>

          {/* Agent: Devenir mandataire */}
          {isAuthenticated && role === "agent" && listing.type === "new_development" && (
            <div className="rounded-xl border-2 border-[#1A3A5C]/20 bg-[#1A3A5C]/5 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#1A3A5C]/10 flex items-center justify-center">
                  <Handshake className="h-6 w-6 text-[#1A3A5C]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary mb-1">Devenir mandataire sur ce projet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Postulez auprès du promoteur pour commercialiser ce programme neuf — avec ou sans exclusivité.
                  </p>

                  {existingMandate ? (
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={mandateStatusColor[existingMandate.status] ?? ""}>
                        {mandateStatusLabel[existingMandate.status] ?? existingMandate.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {existingMandate.exclusive ? "Exclusivité demandée" : "Sans exclusivité"}
                      </span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowMandateForm(true)}
                      className="bg-[#1A3A5C] hover:bg-[#142d47] text-white"
                    >
                      <Handshake className="h-4 w-4 mr-2" />
                      Postuler comme mandataire
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Simulator CTA */}
          <div className="rounded-xl border-2 border-dashed border-[#C9A84C]/40 bg-[#C9A84C]/5 p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#C9A84C]/15 flex items-center justify-center">
              <Bot className="h-6 w-6 text-[#C9A84C]" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-semibold text-primary mb-1">Analyser avec le simulateur IA</h4>
              <p className="text-sm text-muted-foreground">
                Envoyez ce bien au simulateur immobilier israélien pour obtenir une estimation détaillée, un bilan locatif et une analyse d'investissement.
              </p>
            </div>
            <Button
              onClick={() => setShowAiModal(true)}
              className="flex-shrink-0 gap-2 bg-[#C9A84C] hover:bg-[#b8963e] text-white"
            >
              {aiSent ? <Check className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              {aiSent ? "Envoyé ✓" : "Analyser"}
            </Button>
          </div>
          
          <div>
            <h3 className="font-serif text-2xl font-bold text-primary mb-4">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {listing.description || "Aucune description fournie."}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-primary mb-2">
              ₪{listing.price.toLocaleString("he-IL")}
            </div>
            {listing.estimatedPrice && (
              <div className="text-sm font-medium text-emerald-600 mb-6">
                Estimation du marché: ₪{listing.estimatedPrice.toLocaleString("he-IL")}
              </div>
            )}
            
            {listing.investmentScore != null && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <InvestmentScore score={listing.investmentScore} />
              </div>
            )}

            <div className="border-t pt-6 mt-6">
              <h4 className="font-semibold mb-4">Contacter le professionnel</h4>
              <div className="space-y-4">
                <Textarea 
                  placeholder="Bonjour, je suis intéressé par ce bien..." 
                  className="resize-none" 
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleSendLead}
                  disabled={createLead.isPending || !message.trim()}
                >
                  <Send className="h-4 w-4" />
                  {createLead.isPending ? "Envoi..." : "Envoyer une demande"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandate Application Modal */}
      <Dialog open={showMandateForm} onOpenChange={setShowMandateForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-primary">
              <Handshake className="h-5 w-5 text-[#1A3A5C]" />
              Candidature mandataire
            </DialogTitle>
            <DialogDescription>
              Remplissez ce formulaire pour proposer vos services au promoteur de ce projet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Exclusivity toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
              <div>
                <div className="font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-[#C9A84C]" />
                  Mandat exclusif
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vous seriez le seul agent autorisé à vendre ce projet
                </p>
              </div>
              <Switch checked={exclusive} onCheckedChange={setExclusive} />
            </div>

            {/* Note / motivation */}
            <div className="space-y-2">
              <Label htmlFor="mandate-note">Présentation & motivation</Label>
              <Textarea
                id="mandate-note"
                placeholder="Décrivez votre expérience, votre réseau d'acquéreurs, et pourquoi vous êtes le bon partenaire pour ce projet..."
                rows={4}
                value={mandateNote}
                onChange={(e) => setMandateNote(e.target.value)}
              />
            </div>

            {/* Justification document */}
            <div className="space-y-2">
              <Label htmlFor="justification-url" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Justificatif professionnel
              </Label>
              <p className="text-xs text-muted-foreground">
                Lien vers votre carte professionnelle ou attestation FNAIM (hébergez le document et collez l'URL)
              </p>
              <input
                id="justification-url"
                type="url"
                placeholder="https://..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={justificationUrl}
                onChange={(e) => setJustificationUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowMandateForm(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1 gap-2 bg-[#1A3A5C] hover:bg-[#142d47] text-white"
              onClick={handleApplyMandate}
              disabled={applyForMandate.isPending}
            >
              <Send className="h-4 w-4" />
              {applyForMandate.isPending ? "Envoi..." : "Envoyer ma candidature"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Simulator Modal */}
      <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-primary">
              <Bot className="h-5 w-5 text-[#C9A84C]" />
              Envoyer au simulateur IA
            </DialogTitle>
            <DialogDescription>
              Les données suivantes seront transmises au simulateur immobilier israélien :
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bien</span>
              <span className="font-medium text-right max-w-[60%] truncate">{listing.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ville</span>
              <span className="font-medium">{VILLE_LABELS[listing.ville] ?? listing.ville}{listing.quartier ? ` — ${listing.quartier}` : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Surface</span>
              <span className="font-medium">{listing.surface} m²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pièces</span>
              <span className="font-medium">{listing.nbPieces}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prix</span>
              <span className="font-medium">₪{listing.price.toLocaleString("he-IL")}</span>
            </div>
            {listing.estimatedPrice && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimation marché</span>
                <span className="font-medium text-emerald-600">₪{listing.estimatedPrice.toLocaleString("he-IL")}</span>
              </div>
            )}
            {listing.investmentScore != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score investissement</span>
                <span className="font-semibold text-[#C9A84C]">{listing.investmentScore}/100</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowAiModal(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1 gap-2 bg-[#C9A84C] hover:bg-[#b8963e] text-white"
              onClick={handleSendToSimulator}
            >
              <ExternalLink className="h-4 w-4" />
              Ouvrir le simulateur
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
