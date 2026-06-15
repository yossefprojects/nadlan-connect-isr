import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useRegisterPromoteur, useRegisterAgence } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/layout/language-provider";
import { Building2, Handshake, Search, Check, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

const NAVY = "#0D1B3E";
const GOLD = "#C9A84C";

type RoleId = "promoteur" | "agence" | "apporteur";
type PlanId = "free" | "starter" | "pro";
type FieldKey =
  | "firstName" | "lastName" | "email" | "phone"
  | "companyName" | "companyNumber" | "licenseNumber"
  | "ville" | "nbProgrammes" | "nbAgents" | "website";

// Default plan selected for each role (the role's first/cheapest tier).
const DEFAULT_PLAN: Record<RoleId, PlanId> = {
  promoteur: "free",
  apporteur: "starter",
  agence: "free",
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
  "w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#C9A84C]";
const labelCls = "block text-[12px] uppercase tracking-[0.05em] text-muted-foreground mb-1.5";

// Role-specific copy (FR / EN / HE). Common field labels reuse the global i18n.
const CONTENT = {
  fr: {
    title: "Devenir partenaire",
    subtitle: "Choisissez votre profil, puis complétez votre inscription.",
    chooseRole: "Vous êtes :",
    roles: {
      promoteur: { name: "Promoteur", desc: "Vous construisez et commercialisez des programmes neufs." },
      agence: { name: "Agence immobilière", desc: "Agence agréée avec licence תיווך (Risha'yon)." },
      apporteur: { name: "Apporteur d'affaires", desc: "Vous dénichez des biens et opportunités — sans licence." },
    },
    companyName: { promoteur: "Nom de la société", agence: "Nom de l'agence", apporteur: "Société (optionnel)" },
    licenseNumber: "Numéro de licence (Risha'yon)",
    licenseHelp: "Licence de courtier obligatoire pour une agence en Israël (loi 5756-1996). Vérifiée avant l'activation.",
    submit: { promoteur: "Créer mon compte promoteur", agence: "Créer mon compte agence", apporteur: "Créer mon compte apporteur" },
    successText: "Votre demande est enregistrée. Nous la vérifions et activons votre accès sous 24 heures.",
    plans: {
      promoteur: [
        { id: "free", name: "Gratuit", price: "0", per: "", note: "", recommended: false,
          features: ["Profil promoteur vérifié", "Publication de vos programmes", "Réception de leads acheteurs"] },
        { id: "pro", name: "Pro", price: "490", per: "/mois", note: "", recommended: true,
          features: ["Tout le plan Gratuit", "Accès aux projets luxueux", "Mise en avant prioritaire", "Badge Pro vérifié"] },
      ],
      apporteur: [
        { id: "starter", name: "3 projets", price: "499", per: "", note: "Sans engagement", recommended: false,
          features: ["Publication de 3 projets", "Offres des promoteurs", "Mise en relation sécurisée"] },
        { id: "pro", name: "Illimité", price: "990", per: "", note: "Sans engagement", recommended: true,
          features: ["Projets illimités", "Offres des promoteurs", "Mise en relation sécurisée", "Mise en avant prioritaire"] },
      ],
      agence: [
        { id: "free", name: "Gratuit", price: "0", per: "", note: "", recommended: false,
          features: ["Inscription 100% gratuite", "Accès aux projets sur mandat d'un promoteur", "Commission sur les reventes"] },
      ],
    },
  },
  en: {
    title: "Become a partner",
    subtitle: "Pick your profile, then complete your registration.",
    chooseRole: "You are:",
    roles: {
      promoteur: { name: "Developer", desc: "You build and sell new developments." },
      agence: { name: "Real estate agency", desc: "Licensed agency with a Risha'yon licence." },
      apporteur: { name: "Business introducer", desc: "You find properties and opportunities — no licence needed." },
    },
    companyName: { promoteur: "Company name", agence: "Agency name", apporteur: "Company (optional)" },
    licenseNumber: "Licence number (Risha'yon)",
    licenseHelp: "A broker licence is required for an agency in Israel (law 5756-1996). Verified before activation.",
    submit: { promoteur: "Create my developer account", agence: "Create my agency account", apporteur: "Create my introducer account" },
    successText: "Your application has been received. We verify it and activate your access within 24 hours.",
    plans: {
      promoteur: [
        { id: "free", name: "Free", price: "0", per: "", note: "", recommended: false,
          features: ["Verified developer profile", "Publish your developments", "Receive buyer leads"] },
        { id: "pro", name: "Pro", price: "490", per: "/mo", note: "", recommended: true,
          features: ["Everything in Free", "Access to luxury projects", "Priority placement", "Verified Pro badge"] },
      ],
      apporteur: [
        { id: "starter", name: "3 projects", price: "499", per: "", note: "No commitment", recommended: false,
          features: ["Publish 3 projects", "Offers from developers", "Secure introductions"] },
        { id: "pro", name: "Unlimited", price: "990", per: "", note: "No commitment", recommended: true,
          features: ["Unlimited projects", "Offers from developers", "Secure introductions", "Priority placement"] },
      ],
      agence: [
        { id: "free", name: "Free", price: "0", per: "", note: "", recommended: false,
          features: ["100% free registration", "Project access only via a developer mandate", "Commission on resales"] },
      ],
    },
  },
  he: {
    title: "הצטרפות כשותף",
    subtitle: "בחרו את הפרופיל שלכם והשלימו את ההרשמה.",
    chooseRole: "אתם:",
    roles: {
      promoteur: { name: "יזם", desc: "אתם בונים ומשווקים פרויקטים חדשים." },
      agence: { name: "סוכנות נדל\"ן", desc: "סוכנות מורשית עם רישיון תיווך." },
      apporteur: { name: "צייד נכסים", desc: "אתם מאתרים נכסים והזדמנויות — ללא צורך ברישיון." },
    },
    companyName: { promoteur: "שם החברה", agence: "שם הסוכנות", apporteur: "חברה (אופציונלי)" },
    licenseNumber: "מספר רישיון תיווך",
    licenseHelp: "רישיון תיווך נדרש לסוכנות בישראל (חוק התשנ\"ו-1996). יאומת לפני הפעלת החשבון.",
    submit: { promoteur: "פתיחת חשבון יזם", agence: "פתיחת חשבון סוכנות", apporteur: "פתיחת חשבון צייד" },
    successText: "הבקשה התקבלה. אנו מאמתים אותה ומפעילים את הגישה תוך 24 שעות.",
    plans: {
      promoteur: [
        { id: "free", name: "חינם", price: "0", per: "", note: "", recommended: false,
          features: ["פרופיל יזם מאומת", "פרסום הפרויקטים שלכם", "קבלת לידים של קונים"] },
        { id: "pro", name: "Pro", price: "490", per: "/חודש", note: "", recommended: true,
          features: ["כל מה שכלול בחינם", "גישה לפרויקטים יוקרתיים", "מיקום מועדף", "תג Pro מאומת"] },
      ],
      apporteur: [
        { id: "starter", name: "3 פרויקטים", price: "499", per: "", note: "ללא התחייבות", recommended: false,
          features: ["פרסום 3 פרויקטים", "הצעות מיזמים", "חיבור מאובטח"] },
        { id: "pro", name: "ללא הגבלה", price: "990", per: "", note: "ללא התחייבות", recommended: true,
          features: ["פרויקטים ללא הגבלה", "הצעות מיזמים", "חיבור מאובטח", "מיקום מועדף"] },
      ],
      agence: [
        { id: "free", name: "חינם", price: "0", per: "", note: "", recommended: false,
          features: ["הרשמה חינמית לחלוטין", "גישה לפרויקטים רק על פי מנדט מיזם", "עמלה על מכירות חוזרות"] },
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

  // Preselect the role from the path (legacy links /auth/register/promoteur|agence).
  const [, agenceRoute] = useRoute("/auth/register/agence");
  const [, apporteurRoute] = useRoute("/auth/register/apporteur");
  const initialRole: RoleId = apporteurRoute ? "apporteur" : agenceRoute ? "agence" : "promoteur";
  const [role, setRole] = useState<RoleId>(initialRole);

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
    plan: DEFAULT_PLAN[initialRole] as PlanId,
    password: "",
    cgu: false,
  });

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
          <h1 className="font-serif text-2xl" style={{ color: NAVY }}>{t("proRegister.successTitle")}</h1>
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

  const ROLE_OPTIONS: { id: RoleId; icon: typeof Building2 }[] = [
    { id: "promoteur", icon: Building2 },
    { id: "apporteur", icon: Search },
    { id: "agence", icon: Handshake },
  ];

  const plans = L.plans[role] as readonly {
    id: PlanId; name: string; price: string; per: string; note: string;
    recommended: boolean; features: readonly string[];
  }[];

  return (
    <div className="py-10 px-5 flex justify-center" style={{ backgroundColor: "#F7F5F0", minHeight: "100vh" }}>
      <div className="w-full max-w-[520px] bg-white p-8 max-[480px]:p-5" style={{ borderRadius: "14px", border: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div className="font-serif text-lg mb-4" style={{ color: NAVY }}>
          Nadlan<span style={{ color: GOLD }}>Connect</span>
        </div>
        <h1 className="text-[20px] font-medium mb-1.5" style={{ color: NAVY }}>{L.title}</h1>
        <p className="text-[13px] text-muted-foreground mb-6">{L.subtitle}</p>

        {/* Role selector */}
        <span className={labelCls}>{L.chooseRole} *</span>
        <div className="grid grid-cols-1 gap-2.5 mb-6">
          {ROLE_OPTIONS.map(({ id, icon: Icon }) => {
            const selected = role === id;
            return (
              <button
                type="button"
                key={id}
                onClick={() => { setRole(id); setField("plan", DEFAULT_PLAN[id]); }}
                aria-pressed={selected}
                className="flex items-start gap-3 rounded-xl p-3.5 text-start transition-colors"
                style={{ border: selected ? "2px solid #0D1B3E" : "0.5px solid rgba(0,0,0,0.15)", background: selected ? "#F7F5F0" : "#fff" }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: selected ? GOLD : "#EEE9DD" }}>
                  <Icon className="h-4 w-4" style={{ color: NAVY }} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold" style={{ color: NAVY }}>{L.roles[id].name}</div>
                  <div className="text-[12px] text-muted-foreground leading-snug">{L.roles[id].desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {field("firstName", t("proRegister.firstName"), { required: true, autoComplete: "given-name" })}
          {field("lastName", t("proRegister.lastName"), { required: true, autoComplete: "family-name" })}
          {field("email", t("proRegister.email"), { required: true, type: "email", autoComplete: "email" })}
          {field("phone", t("proRegister.phone"), { type: "tel", autoComplete: "tel" })}

          {field("companyName", L.companyName[role], { required: role !== "apporteur", autoComplete: "organization" })}

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
                      <input type="checkbox" checked={specialties.includes(spec)} onChange={() => toggleSpecialty(spec)} className="h-4 w-4" style={{ accentColor: GOLD }} />
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
                      border: selected ? "2px solid #0D1B3E" : plan.recommended ? "2px solid #C9A84C" : "0.5px solid rgba(0,0,0,0.12)" }}>
                    {plan.recommended && (
                      <span style={{ position: "absolute", top: 0, insetInlineEnd: 0, background: GOLD, color: NAVY, fontSize: "11px", borderRadius: "0 10px 0 8px", padding: "4px 10px" }}>
                        {t("proRegister.recommended")}
                      </span>
                    )}
                    <div className="text-[14px] font-medium" style={{ color: NAVY }}>{plan.name}</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-[24px] font-semibold" style={{ color: NAVY }}>{plan.price}<span style={{ fontFamily: "Arial, 'Segoe UI', sans-serif" }}>₪</span></span>
                      {plan.per && <span className="text-xs text-muted-foreground">{plan.per}</span>}
                    </div>
                    {plan.note && <div className="mt-0.5 text-[11px] font-medium" style={{ color: GOLD }}>{plan.note}</div>}
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
            <input type="checkbox" checked={form.cgu} onChange={(e) => setField("cgu", e.target.checked)} className="mt-0.5 h-4 w-4" style={{ accentColor: GOLD }} />
            <span className="text-[13px] text-muted-foreground">
              {t("proRegister.cguPrefix")}{" "}
              <Link href="/cgu" className="underline" style={{ color: GOLD }}>{t("proRegister.cguLink")}</Link>
              {" "}{t("proRegister.cguAnd")}{" "}
              <Link href="/cgv" className="underline" style={{ color: GOLD }}>{t("proRegister.cgvLink")}</Link> *
            </span>
          </label>

          <button type="submit" disabled={isPending}
            className="w-full flex items-center justify-center rounded-lg text-[15px] font-medium text-white bg-[#0D1B3E] hover:bg-[#1a2f5e] transition-colors disabled:opacity-60" style={{ height: "46px" }}>
            {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {L.submit[role]}
          </button>

          <p className="text-center text-[13px] text-muted-foreground">
            <Link href="/auth/login" className="underline" style={{ color: GOLD }}>{t("login.haveAccount")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
