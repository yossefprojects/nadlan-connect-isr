import { Link } from "wouter";
import { useLanguage } from "@/components/layout/language-provider";
import { Building2, Search, Handshake, Check, ArrowRight } from "lucide-react";

const NAVY = "#0F2235";
const GOLD = "#C9A84C";

const CONTENT = {
  fr: {
    badge: "Tarifs",
    title: "Nos offres",
    subtitle:
      "Promoteurs, apporteurs d'affaires, agences — l'inscription est gratuite. Passez Pro quand vous voulez, sans engagement.",
    cta: "Devenir partenaire",
    perMonth: "/mois",
    recommended: "Recommandé",
    roles: [
      { icon: Building2, name: "Promoteur", desc: "Trouvez des projets, faites des offres, construisez.", plans: [
        { name: "Gratuit", price: "0", recommended: false, features: ["Profil vérifié", "Accès au marché", "Faire des offres"] },
        { name: "Pro", price: "490", per: true, recommended: true, features: ["Tout le plan Gratuit", "Accès aux projets luxueux", "Mise en avant prioritaire"] },
      ] },
      { icon: Search, name: "Apporteur d'affaires", desc: "Publiez des projets, recevez des offres des promoteurs.", plans: [
        { name: "3 projets", price: "499", per: true, recommended: false, features: ["Publication de 3 projets", "Offres des promoteurs", "Sans engagement"] },
        { name: "Illimité", price: "990", per: true, recommended: true, features: ["Projets illimités", "Mise en avant prioritaire", "Sans engagement"] },
      ] },
      { icon: Handshake, name: "Agence immobilière", desc: "Recevez des mandats de revente des promoteurs.", plans: [
        { name: "Gratuit", price: "0", recommended: false, features: ["Inscription gratuite", "Mandats de revente", "Commission sur les ventes"] },
      ] },
    ],
  },
  en: {
    badge: "Pricing",
    title: "Our offers",
    subtitle:
      "Developers, business introducers, agencies — signing up is free. Go Pro whenever you like, no commitment.",
    cta: "Become a partner",
    perMonth: "/mo",
    recommended: "Recommended",
    roles: [
      { icon: Building2, name: "Developer", desc: "Find projects, make offers, build.", plans: [
        { name: "Free", price: "0", recommended: false, features: ["Verified profile", "Market access", "Make offers"] },
        { name: "Pro", price: "490", per: true, recommended: true, features: ["Everything in Free", "Access to luxury projects", "Priority placement"] },
      ] },
      { icon: Search, name: "Business introducer", desc: "Publish projects, receive offers from developers.", plans: [
        { name: "3 projects", price: "499", per: true, recommended: false, features: ["Publish 3 projects", "Offers from developers", "No commitment"] },
        { name: "Unlimited", price: "990", per: true, recommended: true, features: ["Unlimited projects", "Priority placement", "No commitment"] },
      ] },
      { icon: Handshake, name: "Real estate agency", desc: "Receive resale mandates from developers.", plans: [
        { name: "Free", price: "0", recommended: false, features: ["Free registration", "Resale mandates", "Commission on sales"] },
      ] },
    ],
  },
  he: {
    badge: "מחירון",
    title: "המסלולים שלנו",
    subtitle:
      "יזמים, מתווכי עסקאות, סוכנויות — ההרשמה חינמית. שדרגו ל-Pro מתי שתרצו, ללא התחייבות.",
    cta: "הצטרפות כשותף",
    perMonth: "/חודש",
    recommended: "מומלץ",
    roles: [
      { icon: Building2, name: "יזם", desc: "מצאו פרויקטים, הגישו הצעות, בנו.", plans: [
        { name: "חינם", price: "0", recommended: false, features: ["פרופיל מאומת", "גישה לשוק", "הגשת הצעות"] },
        { name: "Pro", price: "490", per: true, recommended: true, features: ["כל מה שבחינם", "גישה לפרויקטים יוקרתיים", "מיקום מועדף"] },
      ] },
      { icon: Search, name: "מתווך עסקאות", desc: "פרסמו פרויקטים, קבלו הצעות מיזמים.", plans: [
        { name: "3 פרויקטים", price: "499", per: true, recommended: false, features: ["פרסום 3 פרויקטים", "הצעות מיזמים", "ללא התחייבות"] },
        { name: "ללא הגבלה", price: "990", per: true, recommended: true, features: ["פרויקטים ללא הגבלה", "מיקום מועדף", "ללא התחייבות"] },
      ] },
      { icon: Handshake, name: "סוכנות נדל\"ן", desc: "קבלו מנדטי מכירה מיזמים.", plans: [
        { name: "חינם", price: "0", recommended: false, features: ["הרשמה חינמית", "מנדטי מכירה", "עמלה על מכירות"] },
      ] },
    ],
  },
} as const;

export default function Tarifs() {
  const { language } = useLanguage();
  const L = CONTENT[language] ?? CONTENT.fr;
  const Shekel = () => <span style={{ fontFamily: "Arial, 'Segoe UI', sans-serif" }}>₪</span>;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0F2235] to-[#1A3A5C]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#C9A84C]/20 blur-[120px]" />
        <div className="container relative py-12 text-center md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C9A84C]">
            {L.badge}
          </div>
          <h1 className="mt-5 font-serif text-3xl font-bold text-white md:text-5xl">{L.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/60">{L.subtitle}</p>
          <Link
            href="/auth/register"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0A1628] transition-transform hover:-translate-y-0.5"
          >
            {L.cta}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>

      <div className="container space-y-12 py-12">
        {L.roles.map((role) => {
          const Icon = role.icon;
          return (
            <section key={role.name}>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1A3A5C]/10">
                  <Icon className="h-5 w-5 text-[#1A3A5C]" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#0F2235]">{role.name}</h2>
                  <p className="text-sm text-muted-foreground">{role.desc}</p>
                </div>
              </div>
              <div className={`grid gap-4 ${role.plans.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : "max-w-md"}`}>
                {role.plans.map((plan) => (
                  <div
                    key={plan.name}
                    className="flex flex-col rounded-2xl bg-white p-6 shadow-sm"
                    style={{ border: plan.recommended ? `2px solid ${GOLD}` : "0.5px solid rgba(0,0,0,0.12)" }}
                  >
                    {plan.recommended && (
                      <span className="mb-2 inline-block w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: GOLD, color: NAVY }}>
                        {L.recommended}
                      </span>
                    )}
                    <div className="text-sm font-medium" style={{ color: NAVY }}>{plan.name}</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-3xl font-bold" style={{ color: NAVY }}>{plan.price}<Shekel /></span>
                      {"per" in plan && plan.per && <span className="text-xs text-muted-foreground">{L.perMonth}</span>}
                    </div>
                    <ul className="mt-4 flex-1 space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[13px]">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <div className="rounded-3xl bg-gradient-to-br from-[#0A1628] to-[#1A3A5C] p-10 text-center">
          <h2 className="font-serif text-2xl font-bold text-white">{L.title}</h2>
          <Link
            href="/auth/register"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0A1628] transition-transform hover:-translate-y-0.5"
          >
            {L.cta}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
