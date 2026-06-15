import { useState } from "react";
import { Link } from "wouter";
import { useRegisterPromoteur } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/layout/language-provider";
import { Check, CheckCircle2, Eye, EyeOff, Loader2, X } from "lucide-react";

const NAVY = "#0D1B3E";
const GOLD = "#C9A84C";

type PlanId = "free" | "pro";
type TextKey =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "companyName"
  | "companyNumber"
  | "ville"
  | "nbProgrammes"
  | "website";

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
const labelCls =
  "block text-[12px] uppercase tracking-[0.05em] text-muted-foreground mb-1.5";

export default function RegisterPromoteur() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const register = useRegisterPromoteur();
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
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
    plan: "free" as PlanId,
    password: "",
    cgu: false,
  });

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key as string] ? { ...e, [key]: false } : e));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, boolean> = {};
    if (!form.firstName) errs.firstName = true;
    if (!form.lastName) errs.lastName = true;
    if (!form.email) errs.email = true;
    if (!form.companyName) errs.companyName = true;
    if (!form.companyNumber) errs.companyNumber = true;
    if (!form.ville) errs.ville = true;
    if (!form.nbProgrammes) errs.nbProgrammes = true;
    if (!form.password) errs.password = true;
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
      <div className="min-h-[80vh] flex items-center justify-center p-5" style={{ backgroundColor: "#F7F5F0" }}>
        <div
          className="w-full max-w-[480px] bg-white text-center px-8 py-10 flex flex-col items-center gap-4"
          style={{ borderRadius: "14px", border: "0.5px solid rgba(0,0,0,0.08)" }}
        >
          <CheckCircle2 className="h-14 w-14 text-green-600" />
          <h1 className="font-serif text-2xl" style={{ color: NAVY }}>{t("proRegister.successTitle")}</h1>
          <p className="text-muted-foreground">{t("proRegister.promoteur.successText")}</p>
          <Link
            href="/"
            className="mt-2 inline-flex h-11 items-center rounded-lg px-5 text-sm font-medium text-white"
            style={{ backgroundColor: NAVY }}
          >
            {t("proRegister.backHome")}
          </Link>
        </div>
      </div>
    );
  }

  const score = passwordScore(form.password);
  const strengthColor = STRENGTH_COLORS[Math.max(0, score - 1)];

  const inputCls = (key: string) =>
    `${inputBase} ${errors[key] ? "border-[#dc2626] focus:border-[#dc2626]" : ""}`;

  const renderField = (
    key: TextKey,
    label: string,
    opts: {
      type?: string;
      placeholder?: string;
      autoComplete?: string;
      required?: boolean;
      help?: string;
    } = {},
  ) => (
    <div>
      <label htmlFor={key} className={labelCls}>
        {label}{opts.required ? " *" : ""}
      </label>
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

  const plans: { id: PlanId; name: string; price: string; recommended: boolean; features: string[] }[] = [
    {
      id: "free",
      name: t("proRegister.planFree"),
      price: "0₪",
      recommended: false,
      features: [
        t("proRegister.plan.free.f1"),
        t("proRegister.plan.free.f2"),
        t("proRegister.plan.free.f3"),
        t("proRegister.plan.free.f4"),
      ],
    },
    {
      id: "pro",
      name: t("proRegister.planPro"),
      price: "49₪",
      recommended: true,
      features: [
        t("proRegister.plan.pro.f1"),
        t("proRegister.plan.pro.f2"),
        t("proRegister.plan.pro.f3"),
        t("proRegister.plan.pro.f4"),
        t("proRegister.plan.pro.f5"),
        t("proRegister.plan.pro.f6"),
      ],
    },
  ];

  return (
    <div className="py-10 px-5 flex justify-center" style={{ backgroundColor: "#F7F5F0", minHeight: "100vh" }}>
      <div
        className="w-full max-w-[480px] bg-white p-8 max-[480px]:p-5"
        style={{ borderRadius: "14px", border: "0.5px solid rgba(0,0,0,0.08)" }}
      >
        <div className="font-serif text-lg mb-4" style={{ color: NAVY }}>
          Nadlan<span style={{ color: GOLD }}>Connect</span>
        </div>
        <h1 className="text-[20px] font-medium mb-1.5" style={{ color: NAVY }}>
          {t("proRegister.promoteur.title")}
        </h1>
        <p className="text-[13px] text-muted-foreground mb-6">{t("proRegister.promoteur.subtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {renderField("companyName", t("proRegister.promoteur.companyName"), { required: true, autoComplete: "organization" })}
          {renderField("firstName", t("proRegister.firstName"), { required: true, autoComplete: "given-name" })}
          {renderField("lastName", t("proRegister.lastName"), { required: true, autoComplete: "family-name" })}
          {renderField("email", t("proRegister.email"), { required: true, type: "email", autoComplete: "email" })}
          {renderField("phone", t("proRegister.phone"), { type: "tel", autoComplete: "tel" })}
          {renderField("companyNumber", t("proRegister.promoteur.companyNumber"), {
            required: true,
            placeholder: t("proRegister.promoteur.companyNumberPlaceholder"),
            help: t("proRegister.promoteur.companyNumberHelp"),
          })}
          {renderField("ville", t("proRegister.ville"), { required: true, autoComplete: "address-level2" })}
          {renderField("nbProgrammes", t("proRegister.promoteur.nbProgrammes"), { required: true, type: "number" })}
          {renderField("website", t("proRegister.promoteur.website"), { placeholder: "https://", type: "url", autoComplete: "url" })}

          <div>
            <span className={labelCls}>{t("proRegister.choosePlan")} *</span>
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
              {plans.map((plan) => {
                const selected = form.plan === plan.id;
                const style: React.CSSProperties = {
                  borderRadius: "10px",
                  padding: "20px",
                  position: "relative",
                  background: selected ? "#F7F5F0" : "#fff",
                  border: selected
                    ? "2px solid #0D1B3E"
                    : plan.id === "pro"
                      ? "2px solid #C9A84C"
                      : "0.5px solid rgba(0,0,0,0.12)",
                };
                return (
                  <button
                    type="button"
                    key={plan.id}
                    onClick={() => setField("plan", plan.id)}
                    aria-pressed={selected}
                    className="text-start transition-colors"
                    style={style}
                  >
                    {plan.recommended && (
                      <span
                        style={{
                          position: "absolute",
                          top: 0,
                          insetInlineEnd: 0,
                          background: GOLD,
                          color: NAVY,
                          fontSize: "11px",
                          borderRadius: "0 10px 0 8px",
                          padding: "4px 10px",
                        }}
                      >
                        {t("proRegister.recommended")}
                      </span>
                    )}
                    <div className="text-[14px] font-medium" style={{ color: NAVY }}>{plan.name}</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-[24px] font-semibold" style={{ color: NAVY }}>{plan.price}</span>
                      {plan.id === "pro" && (
                        <span className="text-xs text-muted-foreground">{t("proRegister.perMonth")}</span>
                      )}
                    </div>
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
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className={`${inputCls("password")} pe-10`}
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? t("proRegister.hidePassword") : t("proRegister.showPassword")}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2 flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full"
                  style={{ background: i < score ? strengthColor : "rgba(0,0,0,0.1)" }}
                />
              ))}
            </div>
            {errors.password ? (
              <p className="mt-1 text-[12px] text-[#dc2626]">{t("proRegister.passwordMin")}</p>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">{t("proRegister.passwordPlaceholder")}</p>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.cgu}
              onChange={(e) => setField("cgu", e.target.checked)}
              className="mt-0.5 h-4 w-4"
              style={{ accentColor: GOLD }}
            />
            <span className="text-[13px] text-muted-foreground">
              {t("proRegister.cguPrefix")}{" "}
              <Link href="/cgu" className="underline" style={{ color: GOLD }}>{t("proRegister.cguLink")}</Link>
              {" "}{t("proRegister.cguAnd")}{" "}
              <Link href="/cgv" className="underline" style={{ color: GOLD }}>{t("proRegister.cgvLink")}</Link> *
            </span>
          </label>
          {errors.cgu && <p className="text-[12px] text-[#dc2626] flex items-center gap-1"><X className="h-3 w-3" />{t("proRegister.acceptCgu")}</p>}

          <button
            type="submit"
            disabled={register.isPending}
            className="w-full flex items-center justify-center rounded-lg text-[15px] font-medium text-white bg-[#0D1B3E] hover:bg-[#1a2f5e] transition-colors disabled:opacity-60"
            style={{ height: "46px" }}
          >
            {register.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("proRegister.promoteur.submit")}
          </button>

          <p className="text-center text-[13px] text-muted-foreground">
            {t("proRegister.promoteur.crossPrompt")}{" "}
            <Link href="/auth/register/agence" className="underline" style={{ color: GOLD }}>
              {t("proRegister.promoteur.crossLink")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
