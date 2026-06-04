import { Link } from "wouter";
import { useLanguage } from "@/components/layout/language-provider";
import { Building2 } from "lucide-react";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-[#0A1628] px-6 py-20 text-center">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-[#C9A84C]/10 blur-[120px]" />
      <div className="relative">
        <div className="select-none font-serif leading-none text-[#C9A84C]/15 text-[clamp(80px,15vw,160px)]">
          404
        </div>
        <div className="-mt-6 mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/10">
            <Building2 className="h-8 w-8 text-[#C9A84C]" />
          </div>
        </div>
        <h1 className="mb-3 font-serif text-white text-[clamp(22px,4vw,36px)]">
          {t("notfound.title")}
        </h1>
        <p className="mx-auto mb-8 max-w-md text-[15px] leading-relaxed text-white/50">
          {t("notfound.desc")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8C96A] px-7 py-3 text-sm font-bold text-[#0A1628] shadow-[0_6px_20px_rgba(201,168,76,0.35)] transition-transform hover:-translate-y-0.5"
          >
            {t("notfound.back")}
          </Link>
          <Link
            href="/listings"
            className="rounded-full border border-white/20 bg-white/[0.08] px-7 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/[0.14]"
          >
            {t("notfound.viewProperties")}
          </Link>
        </div>
      </div>
    </div>
  );
}
