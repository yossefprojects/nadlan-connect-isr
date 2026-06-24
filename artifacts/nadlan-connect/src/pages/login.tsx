import { useState, useEffect, type FormEvent } from "react";
import { useLocation, Link } from "wouter";
import { getMyProfile } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/components/layout/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const NAVY = "#1A3A5C";
const GOLD = "#C9A84C";

function pathForRole(role: string | null | undefined): string {
  switch (role) {
    case "developer":
      return "/dashboard/promoteur";
    case "agent":
      // Agences only have access to the projects a promoteur entrusts to them.
      return "/demolition/reventes";
    case "introducer":
      // Apporteurs manage their own published projects and the offers received.
      return "/demolition/mes-projets";
    case "admin":
      return "/dashboard/admin";
    default:
      return "/";
  }
}

export default function Login() {
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
        const profile = await getMyProfile().catch(() => null);
        setLocation(pathForRole(profile?.role));
      } else {
        await register({ email: email.trim(), password, fullName: fullName.trim() });
        setLocation("/");
      }
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        setError(t("login.emailExists"));
      } else if (status === 400 || status === 401) {
        setError(t("login.failedDesc"));
      } else {
        setError(t("login.genericError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-[85vh] flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: "#F8F7F4" }}
    >
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div
            className="mx-auto mb-2 h-12 w-1 rounded-full"
            style={{ backgroundColor: GOLD }}
          />
          <CardTitle
            className="font-serif text-3xl"
            style={{ color: NAVY }}
          >
            {mode === "login" ? t("login.title") : t("login.registerTitle")}
          </CardTitle>
          <CardDescription>
            {mode === "login" ? t("login.subtitle") : t("login.registerSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("login.fullName")}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("login.fullNamePlaceholder")}
                  required
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.emailPh")}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? t("login.passwordHint") : "••••••••"}
                required
                minLength={mode === "register" ? 8 : undefined}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full text-white border-0"
              style={{ backgroundColor: GOLD }}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? t("login.submitLogin") : t("login.submitRegister")}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <button
                type="button"
                className="hover:underline"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
              >
                {t("login.noAccount")}{" "}
                <span style={{ color: NAVY }} className="font-medium">
                  {t("login.registerTitle")}
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="hover:underline"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
              >
                {t("login.haveAccount")}{" "}
                <span style={{ color: NAVY }} className="font-medium">
                  {t("login.submitLogin")}
                </span>
              </button>
            )}
          </div>

          <div
            className="rounded-xl border p-4 space-y-3"
            style={{ borderColor: GOLD, backgroundColor: "rgba(201,168,76,0.07)" }}
          >
            <p
              className="text-center text-sm font-semibold"
              style={{ color: NAVY }}
            >
              {t("login.proPrompt")}
            </p>
            <Link
              href="/auth/register"
              className="flex items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors"
              style={{ borderColor: NAVY, color: NAVY }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = NAVY;
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = NAVY;
              }}
            >
              {t("home.partnerCta")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
