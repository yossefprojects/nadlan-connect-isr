import { Link, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useLanguage } from "@/components/layout/language-provider";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, Loader2, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";

const NAVY = "#0D1B3E";
const GOLD = "#C9A84C";

type SubStatus = { active: boolean; plan: string | null; currentPeriodEnd: string | null };

const CONTENT = {
  fr: {
    title: "Mon abonnement",
    subtitle: "Paiement sécurisé par carte, Apple Pay ou Google Pay.",
    activeTitle: "Abonnement actif",
    renew: "Prochain renouvellement",
    freeTitle: "Votre accès est gratuit",
    freeDesc: "Aucun abonnement n'est nécessaire pour votre profil.",
    subscribe: "S'abonner",
    perMonth: "/mois",
    secure: "Vous ne saisissez jamais votre carte chez nous — paiement géré par PayPlus.",
    merciTitle: "Merci !",
    merciDesc: "Votre paiement est en cours de confirmation. Votre accès sera activé dans un instant.",
    back: "Retour à l'accueil",
    echec: "Le paiement n'a pas abouti. Vous pouvez réessayer ci-dessous.",
    error: "Une erreur est survenue. Réessayez.",
    notConfigured: "Le paiement en ligne n'est pas encore activé. Réessayez bientôt.",
    recommended: "Recommandé",
    plans: {
      developer: [
        { key: "promoteur_pro", name: "Pro", price: "490", recommended: true, features: ["Accès aux projets luxueux", "Mise en avant prioritaire", "Badge Pro vérifié"] },
      ],
      introducer: [
        { key: "apporteur_3projets", name: "3 projets", price: "499", recommended: false, features: ["Publication de 3 projets", "Offres des promoteurs", "Sans engagement"] },
        { key: "apporteur_illimite", name: "Illimité", price: "990", recommended: true, features: ["Projets illimités", "Offres des promoteurs", "Mise en avant prioritaire", "Sans engagement"] },
      ],
    },
  },
  en: {
    title: "My subscription",
    subtitle: "Secure payment by card, Apple Pay or Google Pay.",
    activeTitle: "Subscription active",
    renew: "Next renewal",
    freeTitle: "Your access is free",
    freeDesc: "No subscription is required for your profile.",
    subscribe: "Subscribe",
    perMonth: "/mo",
    secure: "You never enter your card on our site — payment handled by PayPlus.",
    merciTitle: "Thank you!",
    merciDesc: "Your payment is being confirmed. Your access will be activated shortly.",
    back: "Back to home",
    echec: "The payment did not go through. You can try again below.",
    error: "Something went wrong. Please try again.",
    notConfigured: "Online payment isn't enabled yet. Please try again soon.",
    recommended: "Recommended",
    plans: {
      developer: [
        { key: "promoteur_pro", name: "Pro", price: "490", recommended: true, features: ["Access to luxury projects", "Priority placement", "Verified Pro badge"] },
      ],
      introducer: [
        { key: "apporteur_3projets", name: "3 projects", price: "499", recommended: false, features: ["Publish 3 projects", "Offers from developers", "No commitment"] },
        { key: "apporteur_illimite", name: "Unlimited", price: "990", recommended: true, features: ["Unlimited projects", "Offers from developers", "Priority placement", "No commitment"] },
      ],
    },
  },
  he: {
    title: "המנוי שלי",
    subtitle: "תשלום מאובטח בכרטיס, Apple Pay או Google Pay.",
    activeTitle: "המנוי פעיל",
    renew: "חידוש הבא",
    freeTitle: "הגישה שלכם חינמית",
    freeDesc: "אין צורך במנוי עבור הפרופיל שלכם.",
    subscribe: "להרשמה",
    perMonth: "/חודש",
    secure: "פרטי הכרטיס לעולם לא נשמרים אצלנו — התשלום מנוהל על ידי PayPlus.",
    merciTitle: "תודה!",
    merciDesc: "התשלום בתהליך אישור. הגישה שלכם תופעל בקרוב.",
    back: "חזרה לדף הבית",
    echec: "התשלום לא הושלם. אפשר לנסות שוב למטה.",
    error: "אירעה שגיאה. נסו שוב.",
    notConfigured: "התשלום המקוון עדיין לא פעיל. נסו שוב בקרוב.",
    recommended: "מומלץ",
    plans: {
      developer: [
        { key: "promoteur_pro", name: "Pro", price: "490", recommended: true, features: ["גישה לפרויקטים יוקרתיים", "מיקום מועדף", "תג Pro מאומת"] },
      ],
      introducer: [
        { key: "apporteur_3projets", name: "3 פרויקטים", price: "499", recommended: false, features: ["פרסום 3 פרויקטים", "הצעות מיזמים", "ללא התחייבות"] },
        { key: "apporteur_illimite", name: "ללא הגבלה", price: "990", recommended: true, features: ["פרויקטים ללא הגבלה", "הצעות מיזמים", "מיקום מועדף", "ללא התחייבות"] },
      ],
    },
  },
} as const;

export default function Abonnement() {
  const { language } = useLanguage();
  const L = CONTENT[language] ?? CONTENT.fr;
  const { role, isAuthenticated } = useUserRole();
  const { toast } = useToast();
  const [merci] = useRoute("/abonnement/merci");
  const failed =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("status") === "echec";

  const { data: sub } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => customFetch<SubStatus>("/payments/subscription", { method: "GET" }),
    enabled: isAuthenticated && !merci,
  });

  const checkout = useMutation({
    mutationFn: (plan: string) =>
      customFetch<{ url: string }>("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (err: unknown) => {
      const status = (err as { status?: number })?.status;
      toast({ title: status === 503 ? L.notConfigured : L.error, variant: "destructive" });
    },
  });

  const plans = (L.plans as Record<string, ReadonlyArray<{ key: string; name: string; price: string; recommended: boolean; features: readonly string[] }>>)[role ?? ""] ?? null;
  const Shekel = () => <span style={{ fontFamily: "Arial, 'Segoe UI', sans-serif" }}>₪</span>;

  return (
    <div className="min-h-[85vh] px-5 py-12" style={{ backgroundColor: "#F7F5F0" }}>
      <div className="mx-auto max-w-3xl">
        {merci ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm" style={{ border: "0.5px solid rgba(0,0,0,0.08)" }}>
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
            <h1 className="mt-4 font-serif text-2xl" style={{ color: NAVY }}>{L.merciTitle}</h1>
            <p className="mt-2 text-muted-foreground">{L.merciDesc}</p>
            <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-lg px-5 text-sm font-medium text-white" style={{ backgroundColor: NAVY }}>
              {L.back}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-serif text-3xl" style={{ color: NAVY }}>{L.title}</h1>
            <p className="mt-1 text-muted-foreground">{L.subtitle}</p>

            {failed && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{L.echec}</div>
            )}

            {sub?.active ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex items-center gap-2 font-semibold text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" /> {L.activeTitle}
                </div>
                {sub.currentPeriodEnd && (
                  <p className="mt-1 text-sm text-emerald-700">
                    {L.renew} : {new Date(sub.currentPeriodEnd).toLocaleDateString(language)}
                  </p>
                )}
              </div>
            ) : !plans ? (
              <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm" style={{ border: "0.5px solid rgba(0,0,0,0.08)" }}>
                <h2 className="font-medium" style={{ color: NAVY }}>{L.freeTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{L.freeDesc}</p>
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {plans.map((plan) => (
                    <div key={plan.key} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm" style={{ border: plan.recommended ? `2px solid ${GOLD}` : "0.5px solid rgba(0,0,0,0.12)" }}>
                      {plan.recommended && (
                        <span className="mb-2 inline-block w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: GOLD, color: NAVY }}>
                          {L.recommended}
                        </span>
                      )}
                      <div className="text-sm font-medium" style={{ color: NAVY }}>{plan.name}</div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-3xl font-bold" style={{ color: NAVY }}>{plan.price}<Shekel /></span>
                        <span className="text-xs text-muted-foreground">{L.perMonth}</span>
                      </div>
                      <ul className="mt-4 flex-1 space-y-1.5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-1.5 text-[13px]">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button onClick={() => checkout.mutate(plan.key)} disabled={checkout.isPending} className="mt-5 w-full text-white" style={{ backgroundColor: NAVY }}>
                        {checkout.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <CreditCard className="me-2 h-4 w-4" />}
                        {L.subscribe}
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0" /> {L.secure}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
