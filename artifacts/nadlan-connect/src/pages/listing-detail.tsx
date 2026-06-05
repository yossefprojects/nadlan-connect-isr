import { useRoute, useLocation } from "wouter";
import { 
  useGetListing, getGetListingQueryKey,
  useAddFavorite, useRemoveFavorite, getGetMyFavoritesQueryKey,
  useCreateLead,
  useGetMyFavorites,
  useApplyForMandate, getGetMyMandatesQueryKey,
  useGetMyMandates,
} from "@workspace/api-client-react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useJsonLd } from "@/hooks/use-json-ld";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { useLanguage } from "@/components/layout/language-provider";
import { InvestmentScore } from "@/components/investment-score";
import { DocumentManager } from "@/components/documents/document-manager";
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
import { MapPin, Maximize, Home, Heart, Send, Bot, ExternalLink, Check, Handshake, FileText, Star, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SIMULATOR_URL = "https://simmoisrael.com/";

const VILLE_LABELS: Record<string, string> = {
  tlv: "Tel Aviv",
  jer: "Jérusalem",
  hfa: "Haïfa",
  bs: "Beer-Sheva",
  nat: "Netanya",
  ash: "Ashdod",
};

export default function ListingDetail() {
  const [, params] = useRoute("/listings/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug ?? "";

  const { data: detail, isLoading } = useGetListing(slug, {
    query: { enabled: !!slug, queryKey: getGetListingQueryKey(slug) }
  });
  const listingId = detail?.listing.id ?? 0;
  const { data: favorites } = useGetMyFavorites();
  const isFavorited = favorites?.some(f => f.id === listingId) || false;
  
  const { isAuthenticated } = useAuth();
  const { role } = useUserRole();
  const { t, locale } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const createLead = useCreateLead();
  const applyForMandate = useApplyForMandate();

  const metaListing = detail?.listing;
  const metaVilleLabel = metaListing ? (VILLE_LABELS[metaListing.ville] ?? metaListing.ville) : undefined;
  const canonicalUrl = metaListing?.slug ? `${window.location.origin}/listings/${metaListing.slug}` : undefined;
  const coverImageUrl = metaListing?.coverImageUrl ? `${window.location.origin}/api/storage${metaListing.coverImageUrl}` : undefined;
  usePageMeta({
    title: metaListing ? `${metaListing.title} — ${metaVilleLabel} | NadlanConnect` : undefined,
    description: metaListing
      ? `${metaListing.title} à ${metaVilleLabel} — ${metaListing.surface} m², ${metaListing.price.toLocaleString("fr-FR")} ₪. Score d'investissement : ${metaListing.investmentScore ?? "—"}/100. Découvrez ce bien sur NadlanConnect.`
      : undefined,
    image: coverImageUrl,
    url: canonicalUrl,
  });

  useJsonLd(
    metaListing && canonicalUrl
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "RealEstateListing",
              "@id": canonicalUrl,
              name: metaListing.title,
              description: metaListing.description ?? undefined,
              url: canonicalUrl,
              ...(coverImageUrl ? { image: coverImageUrl } : {}),
              floorSize: {
                "@type": "QuantitativeValue",
                value: metaListing.surface,
                unitCode: "MTK",
              },
              numberOfRooms: metaListing.nbPieces,
              address: {
                "@type": "PostalAddress",
                addressLocality: metaVilleLabel,
                ...(metaListing.quartier ? { addressRegion: metaListing.quartier } : {}),
                addressCountry: "IL",
              },
              offers: {
                "@type": "Offer",
                price: metaListing.price,
                priceCurrency: "ILS",
                availability: "https://schema.org/InStock",
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "NadlanConnect",
                  item: window.location.origin,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Biens immobiliers",
                  item: `${window.location.origin}/listings`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: metaListing.title,
                  item: canonicalUrl,
                },
              ],
            },
          ],
        }
      : null
  );

  const { data: myMandates } = useGetMyMandates({ query: { enabled: isAuthenticated && role === "agent", queryKey: getGetMyMandatesQueryKey() } });
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
      toast({ title: t("detail.loginFavorite"), variant: "destructive" });
      return;
    }
    if (isFavorited) {
      removeFavorite.mutate({ listingId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyFavoritesQueryKey() });
          toast({ title: t("detail.removedFavorite") });
        }
      });
    } else {
      addFavorite.mutate({ listingId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyFavoritesQueryKey() });
          toast({ title: t("detail.addedFavorite") });
        }
      });
    }
  };

  const handleSendLead = () => {
    if (!isAuthenticated) {
      toast({ title: t("detail.loginContact"), variant: "destructive" });
      return;
    }
    createLead.mutate({ data: { listingId, message } }, {
      onSuccess: () => {
        toast({ title: t("detail.messageSent") });
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
          toast({ title: t("detail.mandateSent"), description: t("detail.mandateSentDesc") });
        },
        onError: () => {
          toast({ title: t("detail.error"), description: t("detail.sendError"), variant: "destructive" });
        }
      }
    );
  };

  type ListingData = NonNullable<typeof detail>["listing"];
  const buildSimulatorPrompt = (listing: ListingData) => {
    const villeLabel = VILLE_LABELS[listing.ville] ?? listing.ville;
    const typeLabel = listing.type === "new_development" ? "programme neuf" : "revente";
    const loc = [villeLabel, listing.quartier].filter(Boolean).join(", ");
    const etageStr = listing.etage != null ? `, étage ${listing.etage}` : "";
    const prixStr = listing.price.toLocaleString("fr-FR");
    const estimStr = listing.estimatedPrice
      ? ` — estimation de marché : ${listing.estimatedPrice.toLocaleString("fr-FR")} ₪`
      : "";
    const scoreStr = listing.investmentScore != null
      ? ` — score d'investissement NadlanConnect : ${listing.investmentScore}/100`
      : "";
    const descStr = listing.description ? ` Description : ${listing.description}` : "";

    return `${listing.title} — ${loc}, ${listing.surface} m², ${listing.nbPieces} pièces${etageStr}, type ${typeLabel}. Prix d'acquisition : ${prixStr} ₪${estimStr}${scoreStr}.${descStr}`;
  };

  const handleEvaluate = () => {
    if (!detail) return;
    const listing = detail.listing;
    const params = new URLSearchParams({
      ville: listing.ville,
      villeLabel: VILLE_LABELS[listing.ville] ?? listing.ville,
      surface: String(listing.surface),
      titre: listing.title,
      prompt: buildSimulatorPrompt(listing),
      ...(listing.quartier ? { quartier: listing.quartier } : {}),
      ...(listing.etage != null ? { etage: String(listing.etage) } : {}),
    });
    setLocation(`/outils/analyse-ia?${params.toString()}`);
  };

  const handleSendToSimulator = () => {
    if (!detail) return;
    const listing = detail.listing;

    const prompt = buildSimulatorPrompt(listing);

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
      prompt,
      source: "nadlanconnect",
    });

    const simulatorUrl = `${SIMULATOR_URL}?${params.toString()}`;
    // Note: must NOT use "noopener" — it nullifies the window reference needed for postMessage
    const win = window.open(simulatorUrl, "_blank");

    if (win) {
      const payload = {
        type: "NADLAN_LISTING",
        prompt,
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
        if (attempts >= 15 || win.closed) return;
        try {
          // Use "*" as targetOrigin so it works from any environment (dev or prod)
          win.postMessage(payload, "*");
        } catch { /* cross-origin */ }
        attempts++;
        setTimeout(sendMessage, 800);
      };
      setTimeout(sendMessage, 600);
    }

    setAiSent(true);
    setShowAiModal(false);
    toast({
      title: t("detail.sentToSim"),
      description: t("detail.sentToSimDesc"),
    });
  };

  if (isLoading) return <div className="p-8 text-center">{t("detail.loading")}</div>;
  if (!detail) return <div className="p-8 text-center">{t("detail.notFound")}</div>;

  const listing = detail.listing;

  const mandateStatusColor: Record<string, string> = {
    pending: "border-amber-200 text-amber-700 bg-amber-50",
    approved: "border-emerald-200 text-emerald-700 bg-emerald-50",
    rejected: "border-red-200 text-red-700 bg-red-50",
  };
  const mandateStatusLabel: Record<string, string> = {
    pending: t("detail.statusPending"),
    approved: t("detail.statusApproved"),
    rejected: t("detail.statusRejected"),
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
                {listing.type === "new_development" ? t("listings.newDev") : t("listings.resale")}
              </Badge>
            </div>
          </div>
          
          <div>
            <h1 dir="auto" className="font-serif text-4xl font-bold text-primary mb-2">{listing.title}</h1>
            <p className="text-muted-foreground flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" /> {listing.ville}{listing.quartier ? <>, <span dir="auto">{listing.quartier}</span></> : ""}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-6 py-6 border-y">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg text-primary"><Maximize className="h-6 w-6" /></div>
              <div>
                <div className="text-sm text-muted-foreground">{t("detail.surface")}</div>
                <div className="font-semibold text-lg">{listing.surface} m²</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg text-primary"><Home className="h-6 w-6" /></div>
              <div>
                <div className="text-sm text-muted-foreground">{t("detail.rooms")}</div>
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
                  <h4 className="font-semibold text-primary mb-1">{t("detail.becomeMandateTitle")}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("detail.becomeMandateDesc")}
                  </p>

                  {existingMandate ? (
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={mandateStatusColor[existingMandate.status] ?? ""}>
                        {mandateStatusLabel[existingMandate.status] ?? existingMandate.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {existingMandate.exclusive ? t("detail.exclusiveRequested") : t("detail.nonExclusive")}
                      </span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowMandateForm(true)}
                      className="bg-[#1A3A5C] hover:bg-[#142d47] text-white"
                    >
                      <Handshake className="h-4 w-4 mr-2" />
                      {t("detail.applyMandate")}
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
              <h4 className="font-semibold text-primary mb-1">{t("detail.simTitle")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("detail.simDesc")}
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
              <Button
                onClick={handleEvaluate}
                variant="outline"
                className="gap-2 border-[#1A3A5C]/30 text-[#1A3A5C] hover:bg-[#1A3A5C]/5"
              >
                <Scale className="h-4 w-4" />
                {t("detail.evaluate")}
              </Button>
              <Button
                onClick={handleSendToSimulator}
                className="gap-2 bg-[#C9A84C] hover:bg-[#b8963e] text-white"
              >
                {aiSent ? <Check className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                {aiSent ? t("detail.sent") : t("detail.analyze")}
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-serif text-2xl font-bold text-primary mb-4">{t("detail.description")}</h3>
            <p dir="auto" className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {listing.description || t("detail.noDescription")}
            </p>
          </div>

          <div>
            <h3 className="font-serif text-2xl font-bold text-primary mb-4">{t("documents.title")}</h3>
            <DocumentManager listingId={listing.id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-primary mb-2">
              ₪{listing.price.toLocaleString(locale)}
            </div>
            {listing.estimatedPrice && (
              <div className="text-sm font-medium text-emerald-600 mb-6">
                {t("detail.marketEstimate")}: ₪{listing.estimatedPrice.toLocaleString(locale)}
              </div>
            )}
            
            {listing.investmentScore != null && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <InvestmentScore score={listing.investmentScore} />
              </div>
            )}

            <div className="border-t pt-6 mt-6">
              <h4 className="font-semibold mb-4">{t("detail.contactPro")}</h4>
              <div className="space-y-4">
                <Textarea 
                  placeholder={t("detail.messagePlaceholder")} 
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
                  {createLead.isPending ? t("detail.sending") : t("detail.sendRequest")}
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
              {t("detail.mandateModalTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("detail.mandateModalDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Exclusivity toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
              <div>
                <div className="font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-[#C9A84C]" />
                  {t("detail.exclusiveMandate")}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("detail.exclusiveMandateDesc")}
                </p>
              </div>
              <Switch checked={exclusive} onCheckedChange={setExclusive} />
            </div>

            {/* Note / motivation */}
            <div className="space-y-2">
              <Label htmlFor="mandate-note">{t("detail.presentation")}</Label>
              <Textarea
                id="mandate-note"
                placeholder={t("detail.presentationPlaceholder")}
                rows={4}
                value={mandateNote}
                onChange={(e) => setMandateNote(e.target.value)}
              />
            </div>

            {/* Justification document */}
            <div className="space-y-2">
              <Label htmlFor="justification-url" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("detail.justification")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("detail.justificationDesc")}
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
              {t("detail.cancel")}
            </Button>
            <Button
              className="flex-1 gap-2 bg-[#1A3A5C] hover:bg-[#142d47] text-white"
              onClick={handleApplyMandate}
              disabled={applyForMandate.isPending}
            >
              <Send className="h-4 w-4" />
              {applyForMandate.isPending ? t("detail.sending") : t("detail.submitMandate")}
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
              {t("detail.simModalTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("detail.simModalDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("detail.property")}</span>
              <span dir="auto" className="font-medium text-right max-w-[60%] truncate">{listing.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("detail.city")}</span>
              <span className="font-medium">{VILLE_LABELS[listing.ville] ?? listing.ville}{listing.quartier ? <> — <span dir="auto">{listing.quartier}</span></> : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("detail.surface")}</span>
              <span className="font-medium">{listing.surface} m²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("detail.rooms")}</span>
              <span className="font-medium">{listing.nbPieces}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("detail.price")}</span>
              <span className="font-medium">₪{listing.price.toLocaleString(locale)}</span>
            </div>
            {listing.estimatedPrice && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("detail.marketEstimateShort")}</span>
                <span className="font-medium text-emerald-600">₪{listing.estimatedPrice.toLocaleString(locale)}</span>
              </div>
            )}
            {listing.investmentScore != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("detail.investmentScore")}</span>
                <span className="font-semibold text-[#C9A84C]">{listing.investmentScore}/100</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowAiModal(false)}>
              {t("detail.cancel")}
            </Button>
            <Button
              className="flex-1 gap-2 bg-[#C9A84C] hover:bg-[#b8963e] text-white"
              onClick={handleSendToSimulator}
            >
              <ExternalLink className="h-4 w-4" />
              {t("detail.openSim")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
