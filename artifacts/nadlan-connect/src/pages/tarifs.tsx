import { Link } from "wouter";
import { useLanguage } from "@/components/layout/language-provider";
import { Building2, Handshake, Home, Search, Check, ArrowRight } from "lucide-react";

const NAVY = "#0F2235";
const GOLD = "#C9A84C";

// Hebrew uses the gershayim ״ (U+05F4), never an ASCII quote, inside strings.
const CONTENT = {
  fr: {
    badge: "Tarifs",
    title: "Nos offres",
    subtitle: "Promoteurs, agents, responsables d'immeuble, chasseurs de biens — choisissez votre profil. Tout est sans engagement.",
    cta: "Devenir partenaire",
    roles: [
      { icon: Building2, name: "Promoteur (יזם)", desc: "Vous construisez et achetez des projets.", price: "0", per: "", note: "Commission uniquement à la transaction (voir CGV)", features: ["Accès gratuit à la plateforme", "Faire des offres sur les projets", "Aucun abonnement"] },
      { icon: Handshake, name: "Agent immobilier (מתווך)", desc: "Agent agréé — vous revendez les biens.", price: "300", per: "/mois", note: "Sans engagement", features: ["Mandats de revente des promoteurs", "Visibilité sur la plateforme", "Aucune commission sur les ventes"] },
      { icon: Home, name: "Responsable d'immeuble (ועד בית)", desc: "Vous référencez votre immeuble.", price: "1000", per: "/an", note: "Sans engagement", features: ["Référencement de votre immeuble", "Offres des promoteurs", "Mise en relation sécurisée"] },
      { icon: Search, name: "Chasseur de biens (צייד נכסים)", desc: "Vous dénichez des biens pour les promoteurs.", price: "1000", per: "/an", note: "Sans engagement", features: ["Publication de vos biens", "Offres des promoteurs", "Mise en relation sécurisée"] },
    ],
  },
  en: {
    badge: "Pricing",
    title: "Our offers",
    subtitle: "Developers, agents, building managers, property hunters — pick your profile. Everything is commitment-free.",
    cta: "Become a partner",
    roles: [
      { icon: Building2, name: "Developer (יזם)", desc: "You build and buy projects.", price: "0", per: "", note: "Commission only on transactions (see GTS)", features: ["Free access to the platform", "Make offers on projects", "No subscription"] },
      { icon: Handshake, name: "Real estate agent (מתווך)", desc: "Licensed agent — you resell properties.", price: "300", per: "/mo", note: "No commitment", features: ["Resale mandates from developers", "Visibility on the platform", "No commission on sales"] },
      { icon: Home, name: "Building manager (ועד בית)", desc: "You list your building.", price: "1000", per: "/yr", note: "No commitment", features: ["List your building", "Offers from developers", "Secure introductions"] },
      { icon: Search, name: "Property hunter (צייד נכסים)", desc: "You find properties for developers.", price: "1000", per: "/yr", note: "No commitment", features: ["Publish your properties", "Offers from developers", "Secure introductions"] },
    ],
  },
  he: {
    badge: "מחירון",
    title: "המסלולים שלנו",
    subtitle: "יזמים, מתווכים, ועדי בית, ציידי נכסים — בחרו את הפרופיל שלכם. הכול ללא התחייבות.",
    cta: "הצטרפות כשותף",
    roles: [
      { icon: Building2, name: "יזם", desc: "אתם בונים ורוכשים פרויקטים.", price: "0", per: "", note: "עמלה רק בעת עסקה (ראו תנאי מכר)", features: ["גישה חינם לפלטפורמה", "הגשת הצעות על פרויקטים", "ללא מנוי"] },
      { icon: Handshake, name: "מתווך נדל״ן", desc: "מתווך מורשה — אתם מוכרים נכסים.", price: "300", per: "/חודש", note: "ללא התחייבות", features: ["מנדטי מכירה מיזמים", "נראות בפלטפורמה", "ללא עמלה על מכירות"] },
      { icon: Home, name: "ועד בית", desc: "אתם מפרסמים את הבניין שלכם.", price: "1000", per: "/שנה", note: "ללא התחייבות", features: ["פרסום הבניין שלכם", "הצעות מיזמים", "חיבור מאובטח"] },
      { icon: Search, name: "צייד נכסים", desc: "אתם מאתרים נכסים עבור יזמים.", price: "1000", per: "/שנה", note: "ללא התחייבות", features: ["פרסום הנכסים שלכם", "הצעות מיזמים", "חיבור מאובטח"] },
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
          <Link href="/auth/register" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0A1628] transition-transform hover:-translate-y-0.5">
            {L.cta}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {L.roles.map((role) => {
            const Icon = role.icon;
            return (
              <div key={role.name} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#1A3A5C]/10">
                  <Icon className="h-5 w-5 text-[#1A3A5C]" />
                </div>
                <h2 className="font-serif text-lg font-bold leading-tight text-[#0F2235]" dir="auto">{role.name}</h2>
                <p className="mt-1 text-[13px] text-muted-foreground" dir="auto">{role.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold" style={{ color: NAVY }}>{role.price}<Shekel /></span>
                  {role.per && <span className="text-xs text-muted-foreground">{role.per}</span>}
                </div>
                {role.note && <div className="mt-0.5 text-[11px] font-medium" style={{ color: GOLD }} dir="auto">{role.note}</div>}
                <ul className="mt-4 flex-1 space-y-1.5 border-t pt-4">
                  {role.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[13px]" dir="auto">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: NAVY, color: NAVY }}>
                  {L.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
