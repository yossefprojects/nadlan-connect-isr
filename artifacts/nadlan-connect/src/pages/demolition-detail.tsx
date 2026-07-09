import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  useGetDemolitionListing,
  useListDemolitionOffers,
  useCreateDemolitionOffer,
  getGetDemolitionListingQueryKey,
  getListDemolitionOffersQueryKey,
  customFetch,
} from "@workspace/api-client-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { useLanguage } from "@/components/layout/language-provider";
import { ListingLocationMap } from "@/components/listing-location-map";
import {
  Building2, MapPin, Calendar, Layers, FileText, Mail, Phone, User,
  Loader2, ArrowLeft, Coins, Clock, Send, Award, ShieldCheck, Trophy,
  Lock, Handshake, CheckCircle2,
} from "lucide-react";

function projectTypeLabel(t: (k: string) => string, pt: string) {
  if (pt === "tama38") return t("demo.projectType.tama38");
  if (pt === "pinui_binui") return t("demo.projectType.pinui_binui");
  return t("demo.projectType.both");
}

function standingLabel(t: (k: string) => string, s: string | null | undefined) {
  if (s === "high_end") return t("demo.standing.high_end");
  if (s === "luxury") return t("demo.standing.luxury");
  return t("demo.standing.standard");
}

function scoreColor(score: number) {
  if (score >= 75) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (score >= 50) return "bg-score-mid/15 text-score-mid border-score-mid/30";
  return "bg-orange-100 text-orange-800 border-orange-200";
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-foreground" dir="auto">{value}</div>
    </div>
  );
}

export default function DemolitionDetail() {
  const params = useParams();
  const listingId = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const { isAuthenticated, role } = useUserRole();
  const queryClient = useQueryClient();

  const { data: detail, isLoading } = useGetDemolitionListing(listingId, {
    query: {
      queryKey: getGetDemolitionListingQueryKey(listingId),
      enabled: Number.isFinite(listingId),
    },
  });

  // The offers endpoint authorizes exactly the owner or an admin. A validated
  // promoter also gets contact details revealed, so gate offers on owner/admin
  // explicitly (via isOwner) rather than on the presence of contact fields.
  const isOwner = Boolean(detail?.listing.isOwner);
  const isAdmin = role === "admin";
  const canViewOffers = isAuthenticated && (isOwner || isAdmin);
  const isDeveloper = role === "developer";

  const { data: offers } = useListDemolitionOffers(listingId, {
    query: {
      queryKey: getListDemolitionOffersQueryKey(listingId),
      enabled: Number.isFinite(listingId) && Boolean(canViewOffers),
    },
  });

  const createOffer = useCreateDemolitionOffer();

  // Owner accepts an offer → locks the listing, rejects the others and opens the
  // winner's introduction. Called via customFetch (endpoint not in the generated
  // client). The connection/address-reveal flow then proceeds via admin.
  const acceptOffer = useMutation({
    mutationFn: (offerId: number) =>
      customFetch(
        `/demolition/listings/${listingId}/offers/${offerId}/accept`,
        { method: "POST" },
      ),
    onSuccess: () => {
      toast({ title: t("demo.offer.acceptedToast") });
      queryClient.invalidateQueries({ queryKey: getListDemolitionOffersQueryKey(listingId) });
      queryClient.invalidateQueries({ queryKey: getGetDemolitionListingQueryKey(listingId) });
    },
    onError: () => toast({ title: t("demo.offer.acceptError"), variant: "destructive" }),
  });

  const handleAcceptOffer = (offerId: number) => {
    if (!window.confirm(t("demo.offer.confirmAccept"))) return;
    acceptOffer.mutate(offerId);
  };

  // --- Resale mandate: the winning promoter mandates an agence to resell the
  // acquired project (fields/endpoints are not in the generated client). ---
  const resaleListing = detail?.listing as
    | { isWinningPromoter?: boolean; resaleAgentId?: string | null; status?: string }
    | undefined;
  const canMandateResale =
    Boolean(resaleListing?.isWinningPromoter) &&
    resaleListing?.status === "offer_locked";
  const [selectedAgent, setSelectedAgent] = useState("");
  const { data: agences } = useQuery({
    queryKey: ["demolition-agences"],
    queryFn: () =>
      customFetch<
        Array<{
          id: string;
          name: string;
          ville: string | null;
          specialties: string[];
          verified: boolean;
        }>
      >(`/demolition/agences`, { method: "GET" }),
    enabled: canMandateResale && !resaleListing?.resaleAgentId,
  });
  const mandateResale = useMutation({
    mutationFn: (agentId: string) =>
      customFetch(`/demolition/listings/${listingId}/resale`, {
        method: "POST",
        body: JSON.stringify({ agentId }),
      }),
    onSuccess: () => {
      toast({ title: t("demo.resale.mandatedToast") });
      setSelectedAgent("");
      queryClient.invalidateQueries({
        queryKey: getGetDemolitionListingQueryKey(listingId),
      });
    },
    onError: () =>
      toast({ title: t("demo.resale.error"), variant: "destructive" }),
  });

  const [offerForm, setOfferForm] = useState({
    // Financial
    pricePerUnit: "",
    newUnitArea: "",
    newUnitsOffer: "",
    estimatedDeliveredValue: "",
    // Qualitative
    standing: "standard",
    materials: "",
    floors: "",
    parkingPerUnit: "",
    elevator: false,
    bikeStorage: false,
    gym: false,
    lobby: false,
    replacementHousing: false,
    replacementHousingQuality: "",
    // Timeline & security
    constructionDurationMonths: "",
    startDelayMonths: "",
    bankGuarantee: false,
    projectReferences: "",
    message: "",
  });

  const nf = new Intl.NumberFormat(locale);

  const resetOfferForm = () =>
    setOfferForm({
      pricePerUnit: "",
      newUnitArea: "",
      newUnitsOffer: "",
      estimatedDeliveredValue: "",
      standing: "standard",
      materials: "",
      floors: "",
      parkingPerUnit: "",
      elevator: false,
      bikeStorage: false,
      gym: false,
      lobby: false,
      replacementHousing: false,
      replacementHousingQuality: "",
      constructionDurationMonths: "",
      startDelayMonths: "",
      bankGuarantee: false,
      projectReferences: "",
      message: "",
    });

  const submitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: t("demo.offerForm.loginRequired"), variant: "destructive" });
      setLocation("/auth/login");
      return;
    }
    if (!isDeveloper) {
      toast({ title: t("demo.offerForm.devOnly"), variant: "destructive" });
      return;
    }
    try {
      await createOffer.mutateAsync({
        listingId,
        data: {
          pricePerUnit: Number(offerForm.pricePerUnit),
          newUnitArea: Number(offerForm.newUnitArea),
          newUnitsOffer: Number(offerForm.newUnitsOffer),
          estimatedDeliveredValue: Number(offerForm.estimatedDeliveredValue),
          standing: offerForm.standing as "standard" | "high_end" | "luxury",
          materials: offerForm.materials.trim() || null,
          floors: Number(offerForm.floors),
          parkingPerUnit: Number(offerForm.parkingPerUnit),
          elevator: offerForm.elevator,
          bikeStorage: offerForm.bikeStorage,
          gym: offerForm.gym,
          lobby: offerForm.lobby,
          replacementHousing: offerForm.replacementHousing,
          replacementHousingQuality:
            offerForm.replacementHousingQuality.trim() || null,
          constructionDurationMonths: Number(offerForm.constructionDurationMonths),
          startDelayMonths: Number(offerForm.startDelayMonths),
          bankGuarantee: offerForm.bankGuarantee,
          projectReferences: offerForm.projectReferences.trim() || null,
          message: offerForm.message.trim() || null,
        },
      });
      toast({ title: t("demo.offerForm.success") });
      resetOfferForm();
      queryClient.invalidateQueries({ queryKey: getGetDemolitionListingQueryKey(listingId) });
      queryClient.invalidateQueries({ queryKey: getListDemolitionOffersQueryKey(listingId) });
    } catch {
      toast({ title: t("demo.offerForm.error"), variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F7F4]">
        <Loader2 className="h-8 w-8 animate-spin text-sea" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F7F4]">
        <p className="text-muted-foreground">{t("demo.detail.notFound")}</p>
        <Link href="/demolition/listings">
          <Button variant="outline">{t("demo.browse")}</Button>
        </Link>
      </div>
    );
  }

  const { listing, documents } = detail;
  const resale = listing as typeof listing & {
    isWinningPromoter?: boolean;
    resaleAgentId?: string | null;
    resaleStatus?: string | null;
    resaleAgentName?: string | null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sea/10 blur-[120px]" />
        <div className="container relative py-10 md:py-14">
          <Link href="/demolition/listings">
            <button className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t("demo.browse")}
            </button>
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-sea/30 bg-sea-soft px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-sea">
            <Building2 className="h-3.5 w-3.5" />
            {projectTypeLabel(t, listing.projectType)}
          </div>
          <h1 className="mt-5 font-serif text-3xl font-medium text-foreground md:text-4xl" dir="auto">
            {listing.isAddressRevealed && listing.address
              ? listing.address
              : listing.neighborhood
                ? `${listing.neighborhood}, ${listing.city}`
                : listing.city}
          </h1>
          <div className="mt-2 flex items-center gap-1.5 text-muted-foreground" dir="auto">
            <MapPin className="h-4 w-4" />
            {listing.city}
          </div>
          {!listing.isAddressRevealed && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
              <Lock className="h-3 w-3" />
              {t("demo.privacy.addressHidden")}
            </div>
          )}
        </div>
      </div>

      <div className="container grid grid-cols-1 gap-8 py-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Characteristics */}
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-foreground">{t("demo.detail.characteristics")}</h2>
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sea/10">
                  <Layers className="h-5 w-5 text-sea" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("demo.units")}</div>
                  <div className="font-semibold text-foreground">{listing.units}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sea/10">
                  <Calendar className="h-5 w-5 text-sea" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("demo.builtIn")}</div>
                  <div className="font-semibold text-foreground">{listing.buildYear}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sea/10">
                  <Building2 className="h-5 w-5 text-sea" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("demo.filter.projectType")}</div>
                  <div className="font-semibold text-foreground">{projectTypeLabel(t, listing.projectType)}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Location */}
          {(listing.approxLat != null && listing.approxLng != null) && (
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-xl font-bold text-foreground">{t("demo.detail.location")}</h2>
                {listing.isAddressRevealed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t("demo.privacy.exactShown")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1 text-[11px] font-semibold text-foreground/70">
                    <Lock className="h-3.5 w-3.5" />
                    {t("demo.privacy.approxOnly")}
                  </span>
                )}
              </div>
              {listing.neighborhood && (
                <p className="mt-2 text-sm text-muted-foreground" dir="auto">
                  {t("demo.neighborhood")}: <span className="font-medium text-foreground">{listing.neighborhood}</span>
                </p>
              )}
              <div className="mt-4">
                <ListingLocationMap
                  lat={listing.lat}
                  lng={listing.lng}
                  approxLat={listing.approxLat}
                  approxLng={listing.approxLng}
                  approxRadiusM={listing.approxRadiusM}
                  revealed={listing.isAddressRevealed}
                  exactLabel={listing.address ?? listing.city}
                  approxLabel={t("demo.privacy.approxOnly")}
                />
              </div>
              {!listing.isAddressRevealed && (
                <p className="mt-3 text-xs text-muted-foreground">{t("demo.privacy.mapNotice")}</p>
              )}
            </section>
          )}

          {/* Documents — owner/admin only: photos can reveal the exact building */}
          {canViewOffers && (
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-foreground">{t("demo.detail.documents")}</h2>
            {documents.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("demo.detail.noDocuments")}</p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {documents.map((d) => (
                  <li key={d.id}>
                    <a
                      href={d.url.startsWith("/objects/") ? `/api/storage${d.url}` : d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border bg-[#F8F7F4] px-4 py-3 text-sm transition-colors hover:border-sea/50"
                    >
                      <FileText className="h-5 w-5 shrink-0 text-sea" />
                      <span className="truncate" dir="auto">{d.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
          )}

          {/* Offers (owner or admin only) */}
          {canViewOffers && (
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-foreground">
                {t("demo.detail.offersReceived")} ({offers?.length ?? 0})
              </h2>
              {!offers || offers.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">{t("demo.detail.noOffers")}</p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-muted-foreground">{t("demo.detail.scoreHelp")}</p>
                  <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {offers.map((o, idx) => {
                      const isTop = idx === 0 && offers.length > 1 && (o.score ?? 0) > 0;
                      // `status` is set by the accept flow; generated type predates it.
                      const offerStatus = (o as { status?: string }).status;
                      const yes = t("demo.offerForm.yes");
                      const no = t("demo.offerForm.no");
                      const amenities = [
                        o.elevator && t("demo.offerForm.elevator"),
                        o.bikeStorage && t("demo.offerForm.bikeStorage"),
                        o.gym && t("demo.offerForm.gym"),
                        o.lobby && t("demo.offerForm.lobby"),
                      ].filter(Boolean) as string[];
                      return (
                        <div
                          key={o.id}
                          className={`relative flex flex-col rounded-xl border bg-[#F8F7F4] p-5 ${
                            isTop ? "border-sea ring-1 ring-sea/40" : ""
                          }`}
                        >
                          {isTop && (
                            <div className="absolute -top-3 start-4 inline-flex items-center gap-1 rounded-full bg-sea px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-foreground">
                              <Trophy className="h-3 w-3" />
                              {t("demo.detail.bestOffer")}
                            </div>
                          )}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-foreground" dir="auto">
                                {o.promoterCompany || o.promoterName || o.promoterEmail}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(o.createdAt).toLocaleDateString(locale)}
                              </div>
                            </div>
                            {o.score != null && (
                              <div
                                className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-1.5 ${scoreColor(o.score)}`}
                              >
                                <span className="text-xl font-bold leading-none">{o.score}</span>
                                <span className="text-[10px] font-medium uppercase tracking-wide">
                                  {t("demo.detail.score")}
                                </span>
                              </div>
                            )}
                          </div>

                          {o.score != null && (
                            <div className="mt-3 space-y-1.5">
                              {([
                                ["demo.detail.scoreFinancial", o.scoreFinancial, 40],
                                ["demo.detail.scoreQuality", o.scoreQuality, 30],
                                ["demo.detail.scoreTimeline", o.scoreTimeline, 20],
                                ["demo.detail.scoreReferences", o.scoreReferences, 10],
                              ] as const).map(([key, val, max]) => (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="w-28 shrink-0 text-[11px] text-muted-foreground">{t(key)}</span>
                                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                                    <div
                                      className="h-full rounded-full bg-sea"
                                      style={{ width: `${((val ?? 0) / max) * 100}%` }}
                                    />
                                  </div>
                                  <span className="w-10 shrink-0 text-end text-[11px] font-semibold text-sea">
                                    {val ?? 0}/{max}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 border-t pt-3">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sea">
                              <Coins className="h-3.5 w-3.5" /> {t("demo.offerForm.sectionFinancial")}
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-3">
                              <Field label={t("demo.detail.pricePerUnit")} value={`${nf.format(o.pricePerUnit)} ₪`} />
                              <Field label={t("demo.offerForm.newUnitArea")} value={`${o.newUnitArea} m²`} />
                              <Field label={t("demo.detail.newUnits")} value={String(o.newUnitsOffer)} />
                              <Field label={t("demo.offerForm.estimatedDeliveredValue")} value={`${nf.format(o.estimatedDeliveredValue)} ₪`} />
                            </div>
                          </div>

                          <div className="mt-4 border-t pt-3">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sea">
                              <Award className="h-3.5 w-3.5" /> {t("demo.offerForm.sectionQuality")}
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-3">
                              <Field label={t("demo.offerForm.standing")} value={standingLabel(t, o.standing)} />
                              <Field label={t("demo.offerForm.floors")} value={String(o.floors)} />
                              <Field label={t("demo.offerForm.parkingPerUnit")} value={String(o.parkingPerUnit)} />
                              <Field label={t("demo.offerForm.replacementHousing")} value={o.replacementHousing ? yes : no} />
                              {o.materials && <Field label={t("demo.offerForm.materials")} value={o.materials} />}
                              {o.replacementHousing && o.replacementHousingQuality && (
                                <Field label={t("demo.offerForm.replacementHousingQuality")} value={o.replacementHousingQuality} />
                              )}
                            </div>
                            {amenities.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {amenities.map((a) => (
                                  <span key={a} className="rounded-full bg-sea/10 px-2.5 py-0.5 text-[11px] font-medium text-sea">
                                    {a}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="mt-4 border-t pt-3">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sea">
                              <ShieldCheck className="h-3.5 w-3.5" /> {t("demo.offerForm.sectionTimeline")}
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-3">
                              <Field label={t("demo.offerForm.constructionDurationMonths")} value={`${o.constructionDurationMonths} ${t("demo.offerForm.months")}`} />
                              <Field label={t("demo.offerForm.startDelayMonths")} value={`${o.startDelayMonths} ${t("demo.offerForm.months")}`} />
                              <Field label={t("demo.offerForm.bankGuarantee")} value={o.bankGuarantee ? yes : no} />
                            </div>
                            {o.projectReferences && (
                              <div className="mt-2">
                                <Field label={t("demo.offerForm.projectReferences")} value={o.projectReferences} />
                              </div>
                            )}
                          </div>

                          {o.message && (
                            <p className="mt-3 whitespace-pre-wrap border-t pt-3 text-sm text-muted-foreground" dir="auto">{o.message}</p>
                          )}
                          {o.promoterEmail && (
                            <a
                              href={`mailto:${o.promoterEmail}`}
                              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-sea hover:underline"
                            >
                              <Mail className="h-4 w-4" />
                              {o.promoterEmail}
                            </a>
                          )}

                          {/* Owner action — accept this offer (locks the listing) */}
                          {isOwner && (
                            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
                              {offerStatus === "accepted" ? (
                                <>
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                                    <Award className="h-4 w-4" />
                                    {t("demo.offer.accepted")}
                                  </span>
                                  {o.connectionStatus === "validated" ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                                      <CheckCircle2 className="h-4 w-4" />
                                      {t("demo.connection.validated")}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sea/15 px-3 py-1.5 text-xs font-semibold text-sea">
                                      <Clock className="h-4 w-4" />
                                      {t("demo.connection.pending")}
                                    </span>
                                  )}
                                </>
                              ) : offerStatus === "rejected" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                                  {t("demo.offer.rejected")}
                                </span>
                              ) : listing.status === "active" ? (
                                <Button
                                  size="sm"
                                  disabled={acceptOffer.isPending}
                                  onClick={() => handleAcceptOffer(o.id)}
                                  className="bg-sea text-white hover:opacity-90"
                                >
                                  {acceptOffer.isPending ? (
                                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Award className="me-2 h-4 w-4" />
                                  )}
                                  {t("demo.offer.accept")}
                                </Button>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                                  {t("demo.offer.closedShort")}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resale mandate — the winning promoter mandates an agence to resell */}
          {resale.isWinningPromoter && (listing.status as string) === "offer_locked" && (
            <section className="rounded-2xl border border-sea/40 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-sea" />
                <h2 className="font-serif text-lg font-bold text-foreground">{t("demo.resale.title")}</h2>
              </div>
              {resale.resaleAgentId ? (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span dir="auto">
                    {t("demo.resale.mandated")}
                    {resale.resaleAgentName ? ` — ${resale.resaleAgentName}` : ""}
                  </span>
                </div>
              ) : (
                <>
                  <p className="mt-1 text-xs text-muted-foreground">{t("demo.resale.subtitle")}</p>
                  {!agences || agences.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">{t("demo.resale.noAgences")}</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                        <SelectTrigger><SelectValue placeholder={t("demo.resale.choose")} /></SelectTrigger>
                        <SelectContent>
                          {agences.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              <span dir="auto">
                                {a.name}{a.ville ? ` — ${a.ville}` : ""}{a.verified ? " ✓" : ""}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        disabled={!selectedAgent || mandateResale.isPending}
                        onClick={() => mandateResale.mutate(selectedAgent)}
                        className="w-full bg-sea text-white hover:opacity-90"
                      >
                        {mandateResale.isPending ? (
                          <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Handshake className="me-2 h-4 w-4" />
                        )}
                        {t("demo.resale.mandate")}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* Contact (owner/admin only) */}
          {(listing.ownerEmail || listing.ownerPhone) && (
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-foreground">{t("demo.detail.contact")}</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-3" dir="auto">
                  <User className="h-4 w-4 text-sea" />
                  {listing.ownerName}
                </div>
                {listing.ownerEmail && (
                  <a href={`mailto:${listing.ownerEmail}`} className="flex items-center gap-3 hover:text-sea">
                    <Mail className="h-4 w-4 text-sea" />
                    {listing.ownerEmail}
                  </a>
                )}
                {listing.ownerPhone && (
                  <a href={`tel:${listing.ownerPhone}`} className="flex items-center gap-3 hover:text-sea">
                    <Phone className="h-4 w-4 text-sea" />
                    {listing.ownerPhone}
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Offer form (developer only) — hidden once the listing is locked/closed */}
          {isDeveloper && listing.status !== "active" ? (
            <section className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Lock className="h-4 w-4" />
                {t("demo.offerForm.noLongerAvailable")}
              </div>
            </section>
          ) : isDeveloper ? (
            <section className="rounded-2xl border border-sea/40 bg-card p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-foreground">{t("demo.offerForm.title")}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t("demo.offerForm.subtitle")}</p>
              <form onSubmit={submitOffer} className="mt-4 space-y-5">
                {/* Financial */}
                <fieldset className="space-y-3">
                  <legend className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sea">
                    <Coins className="h-3.5 w-3.5" /> {t("demo.offerForm.sectionFinancial")}
                  </legend>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("demo.offerForm.pricePerUnit")}</label>
                    <Input type="number" min="0" required value={offerForm.pricePerUnit}
                      onChange={(e) => setOfferForm({ ...offerForm, pricePerUnit: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("demo.offerForm.newUnitArea")}</label>
                    <Input type="number" min="0" required value={offerForm.newUnitArea}
                      onChange={(e) => setOfferForm({ ...offerForm, newUnitArea: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("demo.offerForm.newUnits")}</label>
                    <Input type="number" min="0" required value={offerForm.newUnitsOffer}
                      onChange={(e) => setOfferForm({ ...offerForm, newUnitsOffer: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("demo.offerForm.estimatedDeliveredValue")}</label>
                    <Input type="number" min="0" required value={offerForm.estimatedDeliveredValue}
                      onChange={(e) => setOfferForm({ ...offerForm, estimatedDeliveredValue: e.target.value })} />
                  </div>
                </fieldset>

                {/* Qualitative */}
                <fieldset className="space-y-3 border-t pt-4">
                  <legend className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sea">
                    <Award className="h-3.5 w-3.5" /> {t("demo.offerForm.sectionQuality")}
                  </legend>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("demo.offerForm.standing")}</label>
                    <Select value={offerForm.standing}
                      onValueChange={(v) => setOfferForm({ ...offerForm, standing: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">{t("demo.standing.standard")}</SelectItem>
                        <SelectItem value="high_end">{t("demo.standing.high_end")}</SelectItem>
                        <SelectItem value="luxury">{t("demo.standing.luxury")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{t("demo.offerForm.floors")}</label>
                      <Input type="number" min="0" required value={offerForm.floors}
                        onChange={(e) => setOfferForm({ ...offerForm, floors: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{t("demo.offerForm.parkingPerUnit")}</label>
                      <Input type="number" min="0" step="1" required value={offerForm.parkingPerUnit}
                        onChange={(e) => setOfferForm({ ...offerForm, parkingPerUnit: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("demo.offerForm.materials")}</label>
                    <Input value={offerForm.materials} dir="auto"
                      onChange={(e) => setOfferForm({ ...offerForm, materials: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ["elevator", offerForm.elevator],
                      ["bikeStorage", offerForm.bikeStorage],
                      ["gym", offerForm.gym],
                      ["lobby", offerForm.lobby],
                    ] as const).map(([key, val]) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={val}
                          onCheckedChange={(c) => setOfferForm({ ...offerForm, [key]: c === true })} />
                        {t(`demo.offerForm.${key}`)}
                      </label>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={offerForm.replacementHousing}
                      onCheckedChange={(c) => setOfferForm({ ...offerForm, replacementHousing: c === true })} />
                    {t("demo.offerForm.replacementHousing")}
                  </label>
                  {offerForm.replacementHousing && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{t("demo.offerForm.replacementHousingQuality")}</label>
                      <Input value={offerForm.replacementHousingQuality} dir="auto"
                        onChange={(e) => setOfferForm({ ...offerForm, replacementHousingQuality: e.target.value })} />
                    </div>
                  )}
                </fieldset>

                {/* Timeline & security */}
                <fieldset className="space-y-3 border-t pt-4">
                  <legend className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sea">
                    <ShieldCheck className="h-3.5 w-3.5" /> {t("demo.offerForm.sectionTimeline")}
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{t("demo.offerForm.constructionDurationMonths")}</label>
                      <Input type="number" min="0" required value={offerForm.constructionDurationMonths}
                        onChange={(e) => setOfferForm({ ...offerForm, constructionDurationMonths: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{t("demo.offerForm.startDelayMonths")}</label>
                      <Input type="number" min="0" required value={offerForm.startDelayMonths}
                        onChange={(e) => setOfferForm({ ...offerForm, startDelayMonths: e.target.value })} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={offerForm.bankGuarantee}
                      onCheckedChange={(c) => setOfferForm({ ...offerForm, bankGuarantee: c === true })} />
                    {t("demo.offerForm.bankGuarantee")}
                  </label>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("demo.offerForm.projectReferences")}</label>
                    <Textarea rows={2} dir="auto" value={offerForm.projectReferences}
                      onChange={(e) => setOfferForm({ ...offerForm, projectReferences: e.target.value })} />
                  </div>
                </fieldset>

                <div className="space-y-1.5 border-t pt-4">
                  <label className="text-sm font-medium">{t("demo.offerForm.message")}</label>
                  <Textarea rows={3} dir="auto" value={offerForm.message}
                    onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })} />
                </div>
                <Button type="submit" disabled={createOffer.isPending}
                  className="w-full bg-sea text-white hover:opacity-90">
                  {createOffer.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Send className="me-2 h-4 w-4" />}
                  {createOffer.isPending ? t("demo.offerForm.submitting") : t("demo.offerForm.submit")}
                </Button>
              </form>
            </section>
          ) : !canViewOffers ? (
            <section className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
              {isAuthenticated ? t("demo.offerForm.devOnly") : t("demo.offerForm.loginRequired")}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
