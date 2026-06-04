import { useState } from "react";
import { Link } from "wouter";
import { useRegisterPromoteur } from "@workspace/api-client-react";
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
import { Building2, CheckCircle2, Loader2 } from "lucide-react";

const NAVY = "#1A3A5C";

const PLANS = [
  { id: "starter", name: "Starter", price: "990₪" },
  { id: "pro", name: "Pro", price: "2490₪" },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

export default function RegisterPromoteur() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const register = useRegisterPromoteur();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    companyNumber: "",
    ville: "",
    nbProgrammes: "",
    website: "",
    plan: "starter" as PlanId,
    password: "",
    cgu: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.companyName ||
      !form.companyNumber ||
      !form.ville ||
      !form.nbProgrammes ||
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
          companyNumber: form.companyNumber,
          ville: form.ville,
          nbProgrammes: Number(form.nbProgrammes),
          website: form.website || undefined,
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
            <h1 className="font-serif text-2xl text-primary">{t("proRegister.successTitle")}</h1>
            <p className="text-muted-foreground">{t("proRegister.promoteur.successText")}</p>
            <Button asChild className="mt-2" style={{ backgroundColor: NAVY }}>
              <Link href="/">{t("proRegister.backHome")}</Link>
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
            <div className="bg-primary/10 p-3 rounded-full">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-serif text-2xl text-primary">{t("proRegister.promoteur.title")}</CardTitle>
              <CardDescription>{t("proRegister.promoteur.subtitle")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("proRegister.firstName")} *</label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("proRegister.lastName")} *</label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("proRegister.email")} *</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("proRegister.phone")}</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("proRegister.promoteur.companyName")} *</label>
                <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("proRegister.promoteur.companyNumber")} *</label>
                <Input
                  value={form.companyNumber}
                  onChange={(e) => setForm({ ...form, companyNumber: e.target.value })}
                  placeholder={t("proRegister.promoteur.companyNumberPlaceholder")}
                />
                <p className="text-xs text-muted-foreground">{t("proRegister.promoteur.companyNumberHelp")}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("proRegister.ville")} *</label>
                <Input value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("proRegister.promoteur.nbProgrammes")} *</label>
                <Input
                  type="number"
                  min={0}
                  value={form.nbProgrammes}
                  onChange={(e) => setForm({ ...form, nbProgrammes: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("proRegister.promoteur.website")}</label>
                <Input
                  placeholder="https://"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("proRegister.choosePlan")} *</label>
              <div className="grid grid-cols-2 gap-4">
                {PLANS.map((plan) => {
                  const selected = form.plan === plan.id;
                  return (
                    <button
                      type="button"
                      key={plan.id}
                      onClick={() => setForm({ ...form, plan: plan.id })}
                      className={`rounded-xl border-2 p-4 text-left transition-colors ${
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="font-semibold text-primary">{plan.name}</div>
                      <div className="text-2xl font-bold text-primary">{plan.price}</div>
                      <div className="text-xs text-muted-foreground">{t("proRegister.perMonth")}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("proRegister.password")} *</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t("proRegister.passwordPlaceholder")}
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={form.cgu}
                onCheckedChange={(v) => setForm({ ...form, cgu: v === true })}
                className="mt-0.5"
              />
              <span className="text-sm text-muted-foreground">{t("proRegister.cgu")} *</span>
            </label>

            <Button
              type="submit"
              size="lg"
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: NAVY }}
              disabled={register.isPending}
            >
              {register.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("proRegister.promoteur.submit")}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t("proRegister.promoteur.crossPrompt")}{" "}
              <Link href="/auth/register/agence" className="text-primary underline">
                {t("proRegister.promoteur.crossLink")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
