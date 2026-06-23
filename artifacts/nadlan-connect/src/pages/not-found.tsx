import { Link } from "wouter";
import { useLanguage } from "@/components/layout/language-provider";
import { Building2 } from "lucide-react";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-background px-6 py-20 text-center">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-sea/10 blur-[120px]" />
      <div className="relative">
        <div className="select-none font-serif leading-none text-sea/15 text-[clamp(80px,15vw,160px)]">
          404
        </div>
        <div className="-mt-6 mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sea/20 bg-sea-soft">
            <Building2 className="h-8 w-8 text-sea" />
          </div>
        </div>
        <h1 className="mb-3 font-serif text-foreground text-[clamp(22px,4vw,36px)]">
          {t("notfound.title")}
        </h1>
        <p className="mx-auto mb-8 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          {t("notfound.desc")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-ink-2"
          >
            {t("notfound.back")}
          </Link>
          <Link
            href="/listings"
            className="rounded-full border border-border bg-card px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {t("notfound.viewProperties")}
          </Link>
        </div>
      </div>
    </div>
  );
}
