import { useState, useEffect, type FormEvent } from "react";
import { useLocation, Link } from "wouter";
import { getMyProfile } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
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
      return "/dashboard/agence";
    case "admin":
      return "/dashboard/admin";
    default:
      return "/";
  }
}

export default function Login() {
  const { isAuthenticated, isLoading, login, register } = useAuth();
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
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
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
            {mode === "login" ? "Connexion" : "Créer un compte"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Accédez à la plateforme premium de l'immobilier israélien."
              : "Rejoignez NadlanConnect en tant qu'acheteur ou investisseur."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Votre nom"
                  required
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "8 caractères minimum" : "••••••••"}
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
              {mode === "login" ? "Se connecter" : "Créer mon compte"}
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
                Pas encore de compte ?{" "}
                <span style={{ color: NAVY }} className="font-medium">
                  Créer un compte
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
                Déjà inscrit ?{" "}
                <span style={{ color: NAVY }} className="font-medium">
                  Se connecter
                </span>
              </button>
            )}
          </div>

          <div className="border-t pt-4 text-center text-sm text-muted-foreground space-y-1">
            <p>Vous êtes un professionnel ?</p>
            <div className="flex justify-center gap-4">
              <Link
                href="/auth/register/agence"
                className="font-medium hover:underline"
                style={{ color: NAVY }}
              >
                Agence
              </Link>
              <Link
                href="/auth/register/promoteur"
                className="font-medium hover:underline"
                style={{ color: NAVY }}
              >
                Promoteur
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
