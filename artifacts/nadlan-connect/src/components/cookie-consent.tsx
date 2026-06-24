import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/components/layout/language-provider";
import { initAnalytics } from "@/lib/analytics";

const STORAGE_KEY = "nadlan-cookie-consent";

const TXT: Record<string, { text: string; more: string; accept: string; refuse: string }> = {
  fr: {
    text: "Nous utilisons des cookies nécessaires au fonctionnement du site et, avec votre accord, des cookies de mesure d'audience.",
    more: "En savoir plus",
    accept: "Tout accepter",
    refuse: "Refuser",
  },
  en: {
    text: "We use cookies required for the site to work and, with your consent, audience-measurement cookies.",
    more: "Learn more",
    accept: "Accept all",
    refuse: "Decline",
  },
  he: {
    text: "אנו משתמשים בעוגיות הנחוצות לתפעול האתר, ובהסכמתך גם בעוגיות למדידת תנועה.",
    more: "מידע נוסף",
    accept: "אישור הכול",
    refuse: "דחייה",
  },
};

export function CookieConsent() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  if (!visible) return null;
  const t = TXT[language] ?? TXT.fr;

  const decide = (value: "accepted" | "refused") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    if (value === "accepted") initAnalytics();
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookies"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-[#C9A84C]/30 bg-[#0F2235] p-4 text-white shadow-2xl sm:flex sm:items-center sm:gap-4"
    >
      <p className="text-[13px] leading-relaxed text-white/80">
        {t.text}{" "}
        <Link href="/confidentialite" className="font-semibold text-[#C9A84C] underline">
          {t.more}
        </Link>
      </p>
      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <button
          onClick={() => decide("refused")}
          className="rounded-lg border border-white/20 px-4 py-2 text-[13px] font-semibold text-white/80 transition-colors hover:bg-white/10"
        >
          {t.refuse}
        </button>
        <button
          onClick={() => decide("accepted")}
          className="rounded-lg bg-[#C9A84C] px-4 py-2 text-[13px] font-bold text-[#0F2235] transition-colors hover:bg-[#d8bb63]"
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
}
