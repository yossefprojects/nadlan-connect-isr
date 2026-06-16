import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateDemolitionListing } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@workspace/object-storage-web";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/components/layout/language-provider";
import { Loader2, Building2, FileText, X, Camera } from "lucide-react";

const COMMISSION = Number(import.meta.env.VITE_DEMOLITION_COMMISSION_NIS ?? 500);

export default function DemolitionNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const createListing = useCreateDemolitionListing();

  const [form, setForm] = useState({
    address: "",
    city: "",
    neighborhood: "",
    units: "",
    buildYear: "",
    projectType: "tama38" as "tama38" | "pinui_binui" | "both",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
  });
  const [docs, setDocs] = useState<File[]>([]);
  const [accepted, setAccepted] = useState(false);

  const { uploadFile, isUploading } = useUpload({
    onError: () => toast({ title: t("demo.new.uploadError"), variant: "destructive" }),
  });

  const commissionLabel = new Intl.NumberFormat(
    language === "he" ? "he-IL" : language === "en" ? "en-US" : "fr-FR",
  ).format(COMMISSION) + " ₪";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: t("demo.new.loginRequired"), variant: "destructive" });
      setLocation("/auth/login");
      return;
    }
    if (!form.address || !form.city || !form.units || !form.buildYear || !form.ownerName || !form.ownerEmail || !form.ownerPhone) {
      toast({ title: t("demo.new.fillRequired"), variant: "destructive" });
      return;
    }
    if (!accepted) {
      toast({ title: t("demo.new.mustAccept"), variant: "destructive" });
      return;
    }

    try {
      const uploaded: { url: string; name: string; position: number }[] = [];
      for (let i = 0; i < docs.length; i++) {
        const res = await uploadFile(docs[i]);
        if (res?.objectPath) {
          uploaded.push({ url: res.objectPath, name: docs[i].name, position: i });
        }
      }

      await createListing.mutateAsync({
        data: {
          address: form.address,
          city: form.city,
          neighborhood: form.neighborhood.trim() || null,
          units: Number(form.units),
          buildYear: Number(form.buildYear),
          projectType: form.projectType,
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          ownerPhone: form.ownerPhone,
          documents: uploaded,
        },
      });

      toast({ title: t("demo.new.success") });
      setLocation("/demolition/listings");
    } catch {
      toast({ title: t("demo.new.error"), variant: "destructive" });
    }
  };

  const busy = createListing.isPending || isUploading;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0F2235] to-[#1A3A5C]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#C9A84C]/20 blur-[120px]" />
        <div className="container relative py-12 md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C9A84C]">
            <Building2 className="h-3.5 w-3.5" />
            {t("demo.badge")}
          </div>
          <h1 className="mt-5 font-serif text-3xl font-bold text-white md:text-4xl">{t("demo.new.title")}</h1>
          <p className="mt-3 max-w-xl text-base text-white/60">{t("demo.new.subtitle")}</p>
        </div>
      </div>

      <div className="container max-w-3xl py-10">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("demo.new.address")} *</label>
            <Input dir="auto" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <p className="text-xs text-muted-foreground">{t("demo.new.addressPrivacy")}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("demo.new.city")} *</label>
              <Input dir="auto" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("demo.new.neighborhood")}</label>
              <Input dir="auto" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder={t("demo.new.neighborhoodPlaceholder")} />
              <p className="text-xs text-muted-foreground">{t("demo.new.neighborhoodHelp")}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("demo.new.projectType")} *</label>
              <Select value={form.projectType} onValueChange={(v: any) => setForm({ ...form, projectType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tama38">{t("demo.projectType.tama38")}</SelectItem>
                  <SelectItem value="pinui_binui">{t("demo.projectType.pinui_binui")}</SelectItem>
                  <SelectItem value="both">{t("demo.projectType.both")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("demo.new.units")} *</label>
              <Input type="number" min="1" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("demo.new.buildYear")} *</label>
              <Input type="number" value={form.buildYear} onChange={(e) => setForm({ ...form, buildYear: e.target.value })} placeholder="1975" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("demo.new.ownerName")} *</label>
              <Input dir="auto" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("demo.new.ownerEmail")} *</label>
              <Input type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("demo.new.ownerPhone")} *</label>
              <Input type="tel" value={form.ownerPhone} onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("demo.new.documents")}</label>
            <Input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => setDocs(Array.from(e.target.files ?? []))}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="sm:hidden"
              onClick={() => document.getElementById("demo-capture-input")?.click()}
            >
              <Camera className="me-2 h-4 w-4" />
              {t("listingForm.takePhoto")}
            </Button>
            <input
              id="demo-capture-input"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setDocs((d) => [...d, ...files]);
                e.target.value = "";
              }}
            />
            {docs.length > 0 && (
              <ul className="mt-2 space-y-1">
                {docs.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 text-[#1A3A5C]" />
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      className="ms-auto text-muted-foreground hover:text-red-500"
                      onClick={() => setDocs(docs.filter((_, j) => j !== i))}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/5 p-5">
            <h3 className="font-serif text-lg font-bold text-[#0F2235]">{t("demo.new.commissionTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("demo.new.commissionDesc").replace("{amount}", commissionLabel)}
            </p>
            <label className="mt-4 flex items-start gap-3">
              <Checkbox checked={accepted} onCheckedChange={(c) => setAccepted(c === true)} className="mt-0.5" />
              <span className="text-sm font-medium">{t("demo.new.acceptTerms")}</span>
            </label>
          </div>

          <div className="flex justify-end gap-4 border-t pt-4">
            <Button variant="outline" type="button" onClick={() => setLocation("/demolition/listings")}>
              {t("listingForm.cancel")}
            </Button>
            <Button type="submit" disabled={busy} className="bg-[#1A3A5C] text-white hover:bg-[#2A5080]">
              {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {busy ? t("demo.new.submitting") : t("demo.new.submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
