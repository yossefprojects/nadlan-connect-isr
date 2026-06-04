import { useState } from "react";
import { Link } from "wouter";
import { useRegisterAgence } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/layout/language-provider";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";

const GOLD = "#C9A84C";

const PLANS = [
  { id: "starter", name: "Starter", price: "490₪" },
  { id: "pro", name: "Pro", price: "990₪" },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

const SPECIALTIES = [
  { id: "residentiel_neuf", label: "Résidentiel neuf" },
  { id: "investissement", label: "Investissement" },
  { id: "luxe", label: "Luxe" },
  { id: "tama38", label: "TAMA 38" },
  { id: "diaspora_francophone", label: "Diaspora francophone" },
  { id: "commercial", label: "Commercial" },
] as const;

type SpecialtyId = (typeof SPECIALTIES)[number]["id"];

export default function RegisterAgence() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const register = useRegisterAgence();
  const [submitted, setSubmitted] = useState(false);
  const [specialties, setSpecialties] = useState<SpecialtyId[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    licenseNumber: "",
    ville: "",
    nbAgents: "",
    plan: "starter" as PlanId,
    password: "",
    cgu: false,
  });

  const toggleSpecialty = (id: SpecialtyId) => {
    setSpecialties((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.companyName ||
      !form.licenseNumber ||
      !form.ville ||
      !form.nbAgents ||
      !form.password
    ) {
      toast({ title: t("proRegister.fillRequired"), variant: "destructive" });
      return;
    }
    if (form.password.length < 8) {
      toast({ title: t("proRegister.passwordMin"), variant: "destructive" });
      return;
    }
    if (!form.cgu) {
      toast({ title: t("proRegister.acceptCgu"), variant: "destructive" });
      return;
    }

    try {
      await register.mutateAsync({
        data: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          companyName: form.companyName,
          licenseNumber: form.licenseNumber,
          ville: form.ville,
          nbAgents: Number(form.nbAgents),
          specialties,
          plan: form.plan,
          password: form.password,
          cguAccepted: form.cgu,
        },
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      toast({
        title:
          status === 409
            ? t("proRegister.emailExists")
            : t("proRegister.genericError"),
        variant: "destructive",
      });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 flex flex-col items-center gap-4">
            <CheckCircle2 className="h-14 w-14 text-green-600" />
            <h1 className="font-serif text-2xl text-primary">Compte créé — vérification sous 24h</h1>
            <p className="text-muted-foreground">
              Merci ! Nous vérifions votre licence Risha'yon et activerons votre accès sous 24 heures.
            </p>
            <Button asChild className="mt-2" style={{ backgroundColor: GOLD }}>
              <Link href="/">Retour à l'accueil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full" style={{ backgroundColor: `${GOLD}1A` }}>
              <KeyRound className="h-6 w-6" style={{ color: GOLD }} />
            </div>
            <div>
              <CardTitle className="font-serif text-2xl text-primary">Inscription Agence</CardTitle>
              <CardDescription>Accédez aux programmes neufs et aux acheteurs qualifiés.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Prénom *</label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom *</label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom agence *</label>
                <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Numéro de licence Risha'yon *</label>
                <Input
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Ce numéro est obligatoire pour exercer en Israël (loi 5756-1996). Il sera vérifié
                  manuellement avant l'activation de votre compte.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ville *</label>
                <Input value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre d'agents *</label>
                <Input
                  type="number"
                  min={0}
                  value={form.nbAgents}
                  onChange={(e) => setForm({ ...form, nbAgents: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Spécialités</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SPECIALTIES.map((spec) => (
                  <label
                    key={spec.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/40"
                  >
                    <Checkbox
                      checked={specialties.includes(spec.id)}
                      onCheckedChange={() => toggleSpecialty(spec.id)}
                    />
                    <span className="text-sm">{spec.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Choix du plan *</label>
              <div className="grid grid-cols-2 gap-4">
                {PLANS.map((plan) => {
                  const selected = form.plan === plan.id;
                  return (
                    <button
                      type="button"
                      key={plan.id}
                      onClick={() => setForm({ ...form, plan: plan.id })}
                      className="rounded-xl border-2 p-4 text-left transition-colors"
                      style={
                        selected
                          ? { borderColor: GOLD, backgroundColor: `${GOLD}0D` }
                          : { borderColor: "hsl(var(--border))" }
                      }
                    >
                      <div className="font-semibold text-primary">{plan.name}</div>
                      <div className="text-2xl font-bold text-primary">{plan.price}</div>
                      <div className="text-xs text-muted-foreground">/ mois</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mot de passe *</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="8 caractères minimum"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={form.cgu}
                onCheckedChange={(v) => setForm({ ...form, cgu: v === true })}
                className="mt-0.5"
              />
              <span className="text-sm text-muted-foreground">
                J'accepte les conditions générales d'utilisation (CGU). *
              </span>
            </label>

            <Button
              type="submit"
              size="lg"
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: GOLD }}
              disabled={register.isPending}
            >
              {register.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accéder aux programmes
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Vous êtes un promoteur ?{" "}
              <Link href="/auth/register/promoteur" className="text-primary underline">
                Inscription Promoteur
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
