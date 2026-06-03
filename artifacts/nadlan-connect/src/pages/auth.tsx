import { useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useUserRole } from "@/hooks/use-user-role";
import { useSetMyRole } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Key, User } from "lucide-react";
import { useLocation } from "wouter";

export default function Auth() {
  const { isAuthenticated, login, isLoading: isAuthLoading } = useAuth();
  const { role, profile, isLoading: isRoleLoading } = useUserRole();
  const setRole = useSetMyRole();
  const [, setLocation] = useLocation();

  if (isAuthLoading || isRoleLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl text-primary">Connexion à NadlanConnect</CardTitle>
            <CardDescription>Accédez à la plateforme premium de l'immobilier israélien.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button size="lg" className="w-full" onClick={() => login()}>
              Se connecter avec Replit
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!role) {
    const handleSetRole = (selectedRole: "buyer" | "agent" | "developer") => {
      setRole.mutate(
        { data: { role: selectedRole } },
        {
          onSuccess: () => {
            setLocation(selectedRole === "buyer" ? "/" : "/dashboard");
          }
        }
      );
    };

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-primary mb-2">Bienvenue, {profile?.fullName || "Utilisateur"}</h1>
          <p className="text-muted-foreground">Sélectionnez votre profil pour personnaliser votre expérience.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSetRole("buyer")}>
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Acheteur / Investisseur</CardTitle>
              <CardDescription>Je cherche à investir ou acheter un bien immobilier en Israël.</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSetRole("agent")}>
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Key className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Agent Immobilier</CardTitle>
              <CardDescription>Je souhaite publier mes annonces et trouver des acheteurs qualifiés.</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSetRole("developer")}>
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Promoteur</CardTitle>
              <CardDescription>Je veux promouvoir mes nouveaux projets immobiliers (Neuf).</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // If authenticated and has role, redirect based on role
  setLocation(role === "buyer" ? "/" : "/dashboard");
  return null;
}