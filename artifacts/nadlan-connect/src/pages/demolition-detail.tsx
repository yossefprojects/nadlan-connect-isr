import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  useGetDemolitionListing,
  useListDemolitionOffers,
  useCreateDemolitionOffer,
  getGetDemolitionListingQueryKey,
  getListDemolitionOffersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { useLanguage } from "@/components/layout/language-provider";
import {
  Building2, MapPin, Calendar, Layers, FileText, Mail, Phone, User,
  Loader2, ArrowLeft, Coins, Clock, Send,
} from "lucide-react";

function projectTypeLabel(t: (k: string) => string, pt: string) {
  if (pt === "tama38") return t("demo.projectType.tama38");
  if (pt === "pinui_binui") return t("demo.projectType.pinui_binui");
  return t("demo.projectType.both");
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

  const isOwner =
    isAuthenticated && detail?.listing.ownerEmail != null; // owner-only fields only returned to owner/admin
  const isDeveloper = role === "developer";

  const { data: offers } = useListDemolitionOffers(listingId, {
    query: {
      queryKey: getListDemolitionOffersQueryKey(listingId),
      enabled: Number.isFinite(listingId) && Boolean(isOwner),
    },
  });

  const createOffer = useCreateDemolitionOffer();
  const [offerForm, setOfferForm] = useState({
    pricePerUnit: "",
    newUnitsOffer: "",
    timeline: "",
    message: "",
  });

  const nf = new Intl.NumberFormat(locale);

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
          newUnitsOffer: Number(offerForm.newUnitsOffer),
          timeline: offerForm.timeline,
          message: offerForm.message,
        },
      });
      toast({ title: t("demo.offerForm.success") });
      setOfferForm({ pricePerUnit: "", newUnitsOffer: "", timeline: "", message: "" });
      queryClient.invalidateQueries({ queryKey: getGetDemolitionListingQueryKey(listingId) });
      queryClient.invalidateQueries({ queryKey: getListDemolitionOffersQueryKey(listingId) });
    } catch {
      toast({ title: t("demo.offerForm.error"), variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F7F4]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A3A5C]" />
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

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0F2235] to-[#1A3A5C]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#C9A84C]/20 blur-[120px]" />
        <div className="container relative py-10 md:py-14">
          <Link href="/demolition/listings">
            <button className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t("demo.browse")}
            </button>
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C9A84C]">
            <Building2 className="h-3.5 w-3.5" />
            {projectTypeLabel(t, listing.projectType)}
          </div>
          <h1 className="mt-5 font-serif text-3xl font-bold text-white md:text-4xl" dir="auto">{listing.address}</h1>
          <div className="mt-2 flex items-center gap-1.5 text-white/60" dir="auto">
            <MapPin className="h-4 w-4" />
            {listing.city}
          </div>
        </div>
      </div>

      <div className="container grid grid-cols-1 gap-8 py-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Characteristics */}
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-[#0F2235]">{t("demo.detail.characteristics")}</h2>
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A3A5C]/10">
                  <Layers className="h-5 w-5 text-[#1A3A5C]" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("demo.units")}</div>
                  <div className="font-semibold text-[#0F2235]">{listing.units}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A3A5C]/10">
                  <Calendar className="h-5 w-5 text-[#1A3A5C]" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("demo.builtIn")}</div>
                  <div className="font-semibold text-[#0F2235]">{listing.buildYear}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A3A5C]/10">
                  <Building2 className="h-5 w-5 text-[#1A3A5C]" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("demo.filter.projectType")}</div>
                  <div className="font-semibold text-[#0F2235]">{projectTypeLabel(t, listing.projectType)}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Documents */}
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-[#0F2235]">{t("demo.detail.documents")}</h2>
            {documents.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("demo.detail.noDocuments")}</p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {documents.map((d) => (
                  <li key={d.id}>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border bg-[#F8F7F4] px-4 py-3 text-sm transition-colors hover:border-[#C9A84C]/50"
                    >
                      <FileText className="h-5 w-5 shrink-0 text-[#1A3A5C]" />
                      <span className="truncate" dir="auto">{d.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Offers (owner only) */}
          {isOwner && (
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-[#0F2235]">
                {t("demo.detail.offersReceived")} ({offers?.length ?? 0})
              </h2>
              {!offers || offers.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">{t("demo.detail.noOffers")}</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {offers.map((o) => (
                    <div key={o.id} className="rounded-xl border bg-[#F8F7F4] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-semibold text-[#0F2235]" dir="auto">
                          {o.promoterCompany || o.promoterName || o.promoterEmail}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString(locale)}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div>
                          <div className="text-xs text-muted-foreground">{t("demo.detail.pricePerUnit")}</div>
                          <div className="font-semibold text-[#1A3A5C]">{nf.format(o.pricePerUnit)} ₪</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">{t("demo.detail.newUnits")}</div>
                          <div className="font-semibold text-[#1A3A5C]">{o.newUnitsOffer}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">{t("demo.detail.timeline")}</div>
                          <div className="font-semibold text-[#1A3A5C]">{o.timeline}</div>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground" dir="auto">{o.message}</p>
                      {o.promoterEmail && (
                        <a
                          href={`mailto:${o.promoterEmail}`}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#C9A84C] hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          {o.promoterEmail}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact (owner/admin only) */}
          {(listing.ownerEmail || listing.ownerPhone) && (
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-[#0F2235]">{t("demo.detail.contact")}</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-3" dir="auto">
                  <User className="h-4 w-4 text-[#1A3A5C]" />
                  {listing.ownerName}
                </div>
                {listing.ownerEmail && (
                  <a href={`mailto:${listing.ownerEmail}`} className="flex items-center gap-3 hover:text-[#C9A84C]">
                    <Mail className="h-4 w-4 text-[#1A3A5C]" />
                    {listing.ownerEmail}
                  </a>
                )}
                {listing.ownerPhone && (
                  <a href={`tel:${listing.ownerPhone}`} className="flex items-center gap-3 hover:text-[#C9A84C]">
                    <Phone className="h-4 w-4 text-[#1A3A5C]" />
                    {listing.ownerPhone}
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Offer form (developer only) */}
          {isDeveloper ? (
            <section className="rounded-2xl border border-[#C9A84C]/40 bg-card p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-[#0F2235]">{t("demo.offerForm.title")}</h2>
              <form onSubmit={submitOffer} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium">
                    <Coins className="h-3.5 w-3.5 text-[#1A3A5C]" />
                    {t("demo.offerForm.pricePerUnit")}
                  </label>
                  <Input type="number" min="0" required value={offerForm.pricePerUnit}
                    onChange={(e) => setOfferForm({ ...offerForm, pricePerUnit: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium">
                    <Layers className="h-3.5 w-3.5 text-[#1A3A5C]" />
                    {t("demo.offerForm.newUnits")}
                  </label>
                  <Input type="number" min="0" required value={offerForm.newUnitsOffer}
                    onChange={(e) => setOfferForm({ ...offerForm, newUnitsOffer: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium">
                    <Clock className="h-3.5 w-3.5 text-[#1A3A5C]" />
                    {t("demo.offerForm.timeline")}
                  </label>
                  <Input required value={offerForm.timeline}
                    onChange={(e) => setOfferForm({ ...offerForm, timeline: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("demo.offerForm.message")}</label>
                  <Textarea rows={4} required dir="auto" value={offerForm.message}
                    onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })} />
                </div>
                <Button type="submit" disabled={createOffer.isPending}
                  className="w-full bg-[#1A3A5C] text-white hover:bg-[#2A5080]">
                  {createOffer.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Send className="me-2 h-4 w-4" />}
                  {createOffer.isPending ? t("demo.offerForm.submitting") : t("demo.offerForm.submit")}
                </Button>
              </form>
            </section>
          ) : !isOwner ? (
            <section className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
              {isAuthenticated ? t("demo.offerForm.devOnly") : t("demo.offerForm.loginRequired")}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
