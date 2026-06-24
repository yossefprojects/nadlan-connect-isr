import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useRegisterPromoteur, useRegisterAgence } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/layout/language-provider";
import { Building2, Handshake, Search, Home, Check, CheckCircle2, Eye, EyeOff, Loader2, ChevronLeft } from "lucide-react";

const NAVY = "hsl(var(--foreground))";
const SEA = "hsl(var(--sea))";

// 4 selectable cards. Internally there are only 3 roles: "vaad" and "tzayad"
// are two labels for the same role (apporteur / introducer), per the model.
type CardId = "promoteur" | "agent" | "vaad" | "tzayad";
type RoleId = "promoteur" | "agence" | "apporteur";
type PlanId = "free" | "starter" | "pro";
type FieldKey =
  | "firstName" | "lastName" | "email" | "phone"
  | "companyName" | "companyNumber" | "licenseNumber"
  | "ville" | "nbProgrammes" | "nbAgents" | "website";

const CARD_ROLE: Record<CardId, RoleId> = {
  promoteur: "promoteur",
  agent: "agence",
  vaad: "apporteur",
  tzayad: "apporteur",
};

// Default plan per card.
const DEFAULT_PLAN: Record<CardId, PlanId> = {
  promoteur: "free",
  agent: "pro",
  vaad: "starter",
  tzayad: "starter",
};

const SPECIALTIES = [
  "residentiel_neuf",
  "investissement",
  "luxe",
  "tama38",
  "diaspora_francophone",
  "commercial",
] as const;
type SpecialtyId = (typeof SPECIALTIES)[number];

const STRENGTH_COLORS = ["#dc2626", "#f97316", "#eab308", "#16a34a"];

function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const inputBase =
  "w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-sea";
const labelCls = "block text-[12px] uppercase tracking-[0.05em] text-muted-foreground mb-1.5";

// Role-specific copy (FR / EN / HE). Common field labels reuse the global i18n.
// NB: Hebrew uses the gershayim ״ (U+05F4), never an ASCII quote, inside strings.
const CONTENT = {
  fr: {
    title: "Devenir partenaire",
    subtitle: "Choisissez votre profil, puis complétez votre inscription.",
    chooseRole: "Vous êtes :",
    roles: {
      promoteur: { name: "Promoteur", desc: "Vous construisez et commercialisez des programmes neufs." },
      agent: { name: "Agent immobilier", desc: "Agent agréé (Risha'yon) — vous commercialisez et revendez des biens." },
      vaad: { name: "Responsable d'immeuble (ועד בית)", desc: "Vous représentez votre immeuble et le référencez pour la rénovation urbaine (Tama 38 / Pinui-Binui)." },
      tzayad: { name: "Chasseur de biens (צייד נכסים)", desc: "Vous dénichez des biens et opportunités à proposer aux promoteurs." },
    },
    companyName: { promoteur: "Nom de la société", agent: "Nom de l'agence", vaad: "Nom de l'immeuble / copropriété (optionnel)", tzayad: "Société (optionnel)" },
    licenseNumber: "Numéro de licence (Risha'yon)",
    licenseHelp: "Licence de courtier obligatoire pour un agent immobilier en Israël (loi 5756-1996). Vérifiée avant l'activation.",
    submit: { promoteur: "Créer mon compte promoteur", agent: "Créer mon compte agent immobilier", vaad: "Créer mon compte responsable d'immeuble", tzayad: "Créer mon compte chasseur de biens" },
    successText: "Votre demande est enregistrée. Nous la vérifions et activons votre accès sous 24 heures.",
    plans: {
      promoteur: [
        { id: "free", name: "Accès gratuit", price: "0", per: "", note: "Commission au succès (voir CGV)", recommended: false,
          features: ["Accès gratuit à la plateforme", "Publication de vos programmes", "Réception de leads acheteurs", "Commission uniquement à la transaction (CGV)"] },
      ],
      agent: [
        { id: "pro", name: "Abonnement agent", price: "290", per: "/mois", note: "Sans engagement", recommended: true,
          features: ["Profil agent vérifié (Risha'yon)", "Mandats de revente des promoteurs", "Visibilité sur la plateforme", "Aucune commission sur les ventes"] },
      ],
      vaad: [
        { id: "starter", name: "Abonnement annuel", price: "990", per: "/an", note: "Sans engagement", recommended: true,
          features: ["Référencement de votre immeuble", "Offres des promoteurs", "Mise en relation sécurisée"] },
      ],
      tzayad: [
        { id: "starter", name: "Abonnement annuel", price: "990", per: "/an", note: "Sans engagement", recommended: true,
          features: ["Publication de vos biens dénichés", "Offres des promoteurs", "Mise en relation sécurisée"] },
      ],
    },
  },
  en: {
    title: "Become a partner",
    subtitle: "Pick your profile, then complete your registration.",
    chooseRole: "You are:",
    roles: {
      promoteur: { name: "Developer", desc: "You build and sell new developments." },
      agent: { name: "Real estate agent", desc: "Licensed agent (Risha'yon) — you market and resell properties." },
      vaad: { name: "Building manager (ועד בית)", desc: "You represent your building and list it for urban renewal (Tama 38 / Pinui-Binui)." },
      tzayad: { name: "Property hunter (צייד נכסים)", desc: "You find properties and opportunities to offer to developers." },
    },
    companyName: { promoteur: "Company name", agent: "Agency name", vaad: "Building / association name (optional)", tzayad: "Company (optional)" },
    licenseNumber: "Licence number (Risha'yon)",
    licenseHelp: "A broker licence is required for a real estate agent in Israel (law 5756-1996). Verified before activation.",
    submit: { promoteur: "Create my developer account", agent: "Create my agent account", vaad: "Create my building-manager account", tzayad: "Create my property-hunter account" },
    successText: "Your application has been received. We verify it and activate your access within 24 hours.",
    plans: {
      promoteur: [
        { id: "free", name: "Free access", price: "0", per: "", note: "Success commission (see GTS)", recommended: false,
          features: ["Free access to the platform", "Publish your developments", "Receive buyer leads", "Commission only on transactions (GTS)"] },
      ],
      agent: [
        { id: "pro", name: "Agent subscription", price: "290", per: "/mo", note: "No commitment", recommended: true,
          features: ["Verified agent profile (Risha'yon)", "Resale mandates from developers", "Visibility on the platform", "No commission on sales"] },
      ],
      vaad: [
        { id: "starter", name: "Annual subscription", price: "990", per: "/yr", note: "No commitment", recommended: true,
          features: ["List your building", "Offers from developers", "Secure introductions"] },
      ],
      tzayad: [
        { id: "starter", name: "Annual subscription", price: "990", per: "/yr", note: "No commitment", recommended: true,
          features: ["Publish the properties you find", "Offers from developers", "Secure introductions"] },
      ],
    },
  },
  he: {
    title: "הצטרפות כשותף",
    subtitle: "בחרו את הפרופיל שלכם והשלימו את ההרשמה.",
    chooseRole: "אתם:",
    roles: {
      promoteur: { name: "יזם", desc: "אתם בונים ומשווקים פרויקטים חדשים." },
      agent: { name: "מתווך נדל״ן", desc: "מתווך מורשה (רישיון תיווך) — אתם משווקים ומוכרים נכסים." },
      vaad: { name: "ועד בית", desc: "אתם מייצגים את הבניין שלכם ומפרסמים אותו להתחדשות עירונית (תמ״א 38 / פינוי-בינוי)." },
      tzayad: { name: "צייד נכסים", desc: "אתם מאתרים נכסים והזדמנויות עבור יזמים." },
    },
    companyName: { promoteur: "שם החברה", agent: "שם הסוכנות", vaad: "שם הבניין / הוועד (אופציונלי)", tzayad: "חברה (אופציונלי)" },
    licenseNumber: "מספר רישיון תיווך",
    licenseHelp: "רישיון תיווך נדרש למתווך נדל״ן בישראל (חוק התשנ״ו-1996). יאומת לפני הפעלת החשבון.",
    submit: { promoteur: "פתיחת חשבון יזם", agent: "פתיחת חשבון מתווך", vaad: "פתיחת חשבון ועד בית", tzayad: "פתיחת חשבון צייד נכסים" },
    successText: "הבקשה התקבלה. אנו מאמתים אותה ומפעילים את הגישה תוך 24 שעות.",
    plans: {
      promoteur: [
        { id: "free", name: "גישה חינם", price: "0", per: "", note: "עמלה בעת עסקה (ראו תנאי מכר)", recommended: false,
          features: ["גישה חינם לפלטפורמה", "פרסום הפרויקטים שלכם", "קבלת לידים של קונים", "עמלה רק בעת עסקה (תנאי מכר)"] },
      ],
      agent: [
        { id: "pro", name: "מנוי מתווך", price: "290", per: "/חודש", note: "ללא התחייבות", recommended: true,
          features: ["פרופיל מתווך מאומת (רישיון)", "מנדטי מכירה מיזמים", "נראות בפלטפורמה", "ללא עמלה על מכירות"] },
      ],
      vaad: [
        { id: "starter", name: "מנוי שנתי", price: "990", per: "/שנה", note: "ללא התחייבות", recommended: true,
          features: ["פרסום הבניין שלכם", "הצעות מיזמים", "חיבור מאובטח"] },
      ],
      tzayad: [
        { id: "starter", name: "מנוי שנתי", price: "990", per: "/שנה", note: "ללא התחייבות", recommended: true,
          features: ["פרסום הנכסים שאיתרתם", "הצעות מיזמים", "חיבור מאובטח"] },
      ],
    },
  },
} as const;

export default function RegisterPro() {
  const { t, language } = useLanguage();
  const L = CONTENT[language] ?? CONTENT.fr;
  const { toast } = useToast();
  const registerPromoteur = useRegisterPromoteur();
  const registerAgence = useRegisterAgence();

  // Preselect from the path (legacy links /auth/register/agence|apporteur).
  const [, agenceRoute] = useRoute("/auth/register/agence");
  const [, apporteurRoute] = useRoute("/auth/register/apporteur");
  const initialCard: CardId = apporteurRoute ? "tzayad" : agenceRoute ? "agent" : "promoteur";
  const [card, setCard] = useState<CardId>(initialCard);
  const role: RoleId = CARD_ROLE[card];

  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [specialties, setSpecialties] = useState<SpecialtyId[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    companyNumber: "",
    licenseNumber: "",
    ville: "",
    nbProgrammes: "",
    nbAgents: "",
    website: "",
    plan: DEFAULT_PLAN[initialCard] as PlanId,
    password: "",
    cgu: false,
  });

  // Two-step wizard: choose a role first, then fill the form.
  const [showForm, setShowForm] = useState(false);

  const isPending = registerPromoteur.isPending || registerAgence.isPending;
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key as string] ? { ...e, [key]: false } : e));
  };
  const toggleSpecialty = (id: SpecialtyId) =>
    setSpecialties((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, boolean> = {};
    if (!form.firstName) errs.firstName = true;
    if (!form.lastName) errs.lastName = true;
    if (!form.email) errs.email = true;
    if (!form.ville) errs.ville = true;
    if (!form.password) errs.password = true;
    if (role === "promoteur") {
      if (!form.companyName) errs.companyName = true;
      if (!form.companyNumber) errs.companyNumber = true;
      if (!form.nbProgrammes) errs.nbProgrammes = true;
    } else if (role === "agence") {
      if (!form.companyName) errs.companyName = true;
      if (!form.licenseNumber) errs.licenseNumber = true;
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast({ title: t("proRegister.fillRequired"), variant: "destructive" });
      return;
    }
    if (form.password.length < 8) {
      setErrors({ password: true });
      toast({ title: t("proRegister.passwordMin"), variant: "destructive" });
      return;
    }
    if (!form.cgu) {
      setErrors({ cgu: true });
      toast({ title: t("proRegister.acceptCgu"), variant: "destructive" });
      return;
    }
    setErrors({});

    try {
      if (role === "promoteur") {
        await registerPromoteur.mutateAsync({
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
      } else {
        await registerAgence.mutateAsync({
          data: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone || undefined,
            companyName: form.companyName || undefined,
            licenseNumber: role === "agence" ? form.licenseNumber : undefined,
            ville: form.ville,
            nbAgents: form.nbAgents ? Number(form.nbAgents) : undefined,
            specialties,
            profileType: role === "apporteur" ? "apporteur" : "agence",
            plan: form.plan,
            password: form.password,
            cguAccepted: form.cgu,
          },
        });
      }
      setSubmitted(true);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      toast({
        title: status === 409 ? t("proRegister.emailExists") : t("proRegister.genericError"),
        variant: "destructive",
      });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-5" style={{ backgroundColor: "#F7F5F0" }}>
        <div
          className="w-full max-w-[480px] bg-white text-center px-8 py-10 flex flex-col items-center gap-4"
          style={{ borderRadius: "14px", border: "0.5px solid rgba(0,0,0,0.08)" }}
        >
          <CheckCircle2 className="h-14 w-14 text-green-600" />
          <h2 className="font-serif text-2xl" style={{ color: NAVY }}>{t("proRegister.successTitle")}</h2>
          <p className="text-muted-foreground">{L.successText}</p>
          <Link href="/" className="mt-2 inline-flex h-11 items-center rounded-lg px-5 text-sm font-medium text-white" style={{ backgroundColor: NAVY }}>
            {t("proRegister.backHome")}
          </Link>
        </div>
      </div>
    );
  }

  const score = passwordScore(form.password);
  const strengthColor = STRENGTH_COLORS[Math.max(0, score - 1)];
  const inputCls = (key: string) => `${inputBase} ${errors[key] ? "border-[#dc2626] focus:border-[#dc2626]" : ""}`;

  const field = (
    key: FieldKey,
    label: string,
    opts: { type?: string; placeholder?: string; autoComplete?: string; required?: boolean; help?: string } = {},
  ) => (
    <div>
      <label htmlFor={key} className={labelCls}>{label}{opts.required ? " *" : ""}</label>
      <input
        id={key}
        name={key}
        type={opts.type ?? "text"}
        {...(opts.type === "number" ? { min: 0 } : {})}
        autoComplete={opts.autoComplete}
        placeholder={opts.placeholder}
        className={inputCls(key)}
        value={form[key]}
        onChange={(e) => setField(key, e.target.value)}
      />
      {errors[key] ? (
        <p className="mt-1 text-[12px] text-[#dc2626]">{t("proRegister.fieldRequired")}</p>
      ) : opts.help ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{opts.help}</p>
      ) : null}
    </div>
  );

  const CARD_OPTIONS: { id: CardId; icon: typeof Building2 }[] = [
    { id: "promoteur", icon: Building2 },
    { id: "agent", icon: Handshake },
    { id: "vaad", icon: Home },
    { id: "tzayad", icon: Search },
  ];

  const plans = L.plans[card] as readonly {
    id: PlanId; name: string; price: string; per: string; note: string;
    recommended: boolean; features: readonly string[];
  }[];

  return (
    <div className="py-10 px-5 flex justify-center" style={{ backgroundColor: "#F7F5F0", minHeight: "100vh" }}>
      <div className="w-full max-w-[520px] bg-white p-8 max-[480px]:p-5" style={{ borderRadius: "14px", border: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div className="font-serif text-lg mb-4 flex items-center gap-2">
          <svg viewBox="0 0 56 56" className="h-10 w-10 shrink-0 nc-logo" aria-hidden="true">
            <rect width="56" height="56" rx="14" fill="#F7F5F0" stroke="#0E1B2A" strokeOpacity="0.14" />
        <circle className="nc-sun" cx="28" cy="10" r="8" fill="#E2761A" />
            <rect className="nc-tower" x="9" y="11" width="19" height="38" rx="3" fill="#0E1B2A" />
            <rect className="nc-tower nc-tower-2" x="27" y="20" width="19" height="29" rx="3" fill="#0F7B6C" />
            <g fill="#F7F5F0"><circle cx="14.5" cy="20" r="1.9" /><circle cx="22.5" cy="20" r="1.9" /><circle cx="14.5" cy="30" r="1.9" /><circle cx="22.5" cy="30" r="1.9" /><circle cx="14.5" cy="40" r="1.9" /><circle cx="22.5" cy="40" r="1.9" /></g>
            <g fill="#fff"><circle cx="32.5" cy="30" r="1.9" /><circle cx="40.5" cy="30" r="1.9" /><circle cx="32.5" cy="40" r="1.9" /><circle cx="40.5" cy="40" r="1.9" /></g>
          </svg>
          <span style={{ color: NAVY }}>Nadlan<span style={{ color: SEA }}>Connect</span></span>
        </div>
        <h1 className="text-[20px] font-medium mb-1.5" style={{ color: NAVY }}>{L.title}</h1>
        <p className="text-[13px] text-muted-foreground mb-6">{L.subtitle}</p>

        {/* Step 1 — role chooser (with price) */}
        {!showForm && (
          <div>
            <span className={labelCls}>{L.chooseRole} *</span>
            <div className="grid grid-cols-1 gap-2.5 mb-5">
              {CARD_OPTIONS.map(({ id, icon: Icon }) => {
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => { setCard(id); setField("plan", DEFAULT_PLAN[id]); setShowForm(true); }}
                    className="flex items-center gap-3 rounded-xl p-3.5 text-start transition-colors hover:border-sea"
                    style={{ border: "0.5px solid rgba(0,0,0,0.15)", background: "#fff" }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "hsl(var(--sea-soft))" }}>
                      <Icon className="h-4 w-4" style={{ color: "hsl(var(--sea))" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold" style={{ color: NAVY }}>{L.roles[id].name}</div>
                      <div className="text-[12px] text-muted-foreground leading-snug">{L.roles[id].desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-[13px] text-muted-foreground">
              <Link href="/auth/login" className="underline" style={{ color: SEA }}>{t("login.haveAccount")}</Link>
            </p>
          </div>
        )}

        {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <button type="button" onClick={() => setShowForm(false)} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {L.roles[card].name}
          </button>
          {field("firstName", t("proRegister.firstName"), { required: true, autoComplete: "given-name" })}
          {field("lastName", t("proRegister.lastName"), { required: true, autoComplete: "family-name" })}
          {field("email", t("proRegister.email"), { required: true, type: "email", autoComplete: "email" })}
          {field("phone", t("proRegister.phone"), { type: "tel", autoComplete: "tel" })}

          {field("companyName", L.companyName[card], { required: role !== "apporteur", autoComplete: "organization" })}

          {role === "promoteur" && (
            <>
              {field("companyNumber", t("proRegister.promoteur.companyNumber"), {
                required: true,
                placeholder: t("proRegister.promoteur.companyNumberPlaceholder"),
                help: t("proRegister.promoteur.companyNumberHelp"),
              })}
              {field("nbProgrammes", t("proRegister.promoteur.nbProgrammes"), { required: true, type: "number" })}
              {field("website", t("proRegister.promoteur.website"), { placeholder: "https://", type: "url", autoComplete: "url" })}
            </>
          )}

          {role === "agence" && field("licenseNumber", L.licenseNumber, { required: true, help: L.licenseHelp })}

          {role !== "promoteur" && (
            <>
              {field("nbAgents", t("proRegister.agence.nbAgents"), { type: "number" })}
              <div>
                <span className={labelCls}>{t("proRegister.agence.specialties")}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SPECIALTIES.map((spec) => (
                    <label key={spec} className="flex items-center gap-2.5 rounded-lg p-2.5 cursor-pointer" style={{ border: "0.5px solid rgba(0,0,0,0.15)" }}>
                      <input type="checkbox" checked={specialties.includes(spec)} onChange={() => toggleSpecialty(spec)} className="h-4 w-4" style={{ accentColor: SEA }} />
                      <span className="text-sm">{t(`proRegister.specialty.${spec}`)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {field("ville", t("proRegister.ville"), { required: true, autoComplete: "address-level2" })}

          <div>
            <span className={labelCls}>{t("proRegister.choosePlan")} *</span>
            <div className={plans.length > 1 ? "grid grid-cols-1 min-[480px]:grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
              {plans.map((plan) => {
                const selected = form.plan === plan.id;
                return (
                  <button type="button" key={plan.id} onClick={() => setField("plan", plan.id)} aria-pressed={selected} className="text-start transition-colors"
                    style={{ borderRadius: "10px", padding: "20px", position: "relative", background: selected ? "#F7F5F0" : "#fff",
                      border: selected ? "2px solid hsl(var(--foreground))" : plan.recommended ? "2px solid hsl(var(--sea))" : "0.5px solid rgba(0,0,0,0.12)" }}>
                    {plan.recommended && (
                      <span style={{ position: "absolute", top: 0, insetInlineEnd: 0, background: SEA, color: NAVY, fontSize: "11px", borderRadius: "0 10px 0 8px", padding: "4px 10px" }}>
                        {t("proRegister.recommended")}
                      </span>
                    )}
                    <div className="text-[14px] font-medium" style={{ color: NAVY }}>{plan.name}</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-[24px] font-semibold" style={{ color: NAVY }}>{plan.price}<span style={{ fontFamily: "Arial, 'Segoe UI', sans-serif" }}>₪</span></span>
                      {plan.per && <span className="text-xs text-muted-foreground">{plan.per}</span>}
                    </div>
                    {plan.note && <div className="mt-0.5 text-[11px] font-medium" style={{ color: SEA }}>{plan.note}</div>}
                    <ul className="mt-3 space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[12px]">
                          <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#16a34a" }} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="password" className={labelCls}>{t("proRegister.password")} *</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password"
                className={`${inputCls("password")} pe-10`} value={form.password} onChange={(e) => setField("password", e.target.value)} />
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? t("proRegister.hidePassword") : t("proRegister.showPassword")} className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2 flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i < score ? strengthColor : "rgba(0,0,0,0.1)" }} />
              ))}
            </div>
            {errors.password ? (
              <p className="mt-1 text-[12px] text-[#dc2626]">{t("proRegister.passwordMin")}</p>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">{t("proRegister.passwordPlaceholder")}</p>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={form.cgu} onChange={(e) => setField("cgu", e.target.checked)} className="mt-0.5 h-4 w-4" style={{ accentColor: SEA }} />
            <span className="text-[13px] text-muted-foreground">
              {t("proRegister.cguPrefix")}{" "}
              <Link href="/cgu" className="underline" style={{ color: SEA }}>{t("proRegister.cguLink")}</Link>
              {" "}{t("proRegister.cguAnd")}{" "}
              <Link href="/cgv" className="underline" style={{ color: SEA }}>{t("proRegister.cgvLink")}</Link> *
            </span>
          </label>

          <button type="submit" disabled={isPending}
            className="w-full flex items-center justify-center rounded-lg text-[15px] font-medium text-white bg-primary hover:bg-ink-2 transition-colors disabled:opacity-60" style={{ height: "46px" }}>
            {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {L.submit[card]}
          </button>

          <p className="text-center text-[13px] text-muted-foreground">
            <Link href="/auth/login" className="underline" style={{ color: SEA }}>{t("login.haveAccount")}</Link>
          </p>
        </form>
        )}
      </div>
    </div>
  );
}
