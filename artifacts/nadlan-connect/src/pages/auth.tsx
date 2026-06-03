import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/components/layout/language-provider";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    setLocation("/auth/login");
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {t("auth.redirecting")}
    </div>
  );
}
