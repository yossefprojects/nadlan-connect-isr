import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/layout/language-provider";

interface SignInPromptProps {
  title: string;
  subtitle: string;
  cta: string;
}

export function SignInPrompt({ title, subtitle, cta }: SignInPromptProps) {
  const { t } = useLanguage();

  return (
    <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
      <h3 className="text-xl font-medium mb-2">{t(title)}</h3>
      <p className="text-muted-foreground mb-6">{t(subtitle)}</p>
      <Link href="/auth/login">
        <Button>{t(cta)}</Button>
      </Link>
    </div>
  );
}
