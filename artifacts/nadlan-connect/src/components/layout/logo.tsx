import { IsraelFlag } from "./israel-flag";

interface LogoProps {
  textClass?: string;
  className?: string;
}

// Centralised brand mark: the "tours jumelles" tile (ink + sea towers) + the
// NadlanConnect wordmark (Fraunces, "Connect" in sea) with the small Israel flag
// accent. Light tile works on light navbar and dark footer. Méditerranée, no gold.
export function Logo({ textClass = "text-foreground", className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 56 56" className="h-11 w-11 shrink-0 nc-logo" aria-hidden="true">
        <rect width="56" height="56" rx="14" fill="#F7F5F0" stroke="#0E1B2A" strokeOpacity="0.14" />
        <circle className="nc-sun" cx="28" cy="15" r="7" fill="#E2761A" />
        <rect className="nc-tower" x="16" y="18" width="13" height="26" rx="2" fill="#0E1B2A" />
        <rect className="nc-tower nc-tower-2" x="28" y="24" width="13" height="20" rx="2" fill="#0F7B6C" />
        <g fill="#F7F5F0"><circle cx="22.5" cy="24" r="1.4" /><circle cx="22.5" cy="30" r="1.4" /><circle cx="22.5" cy="36" r="1.4" /></g>
        <g fill="#fff"><circle cx="34.5" cy="31" r="1.4" /><circle cx="34.5" cy="37" r="1.4" /></g>
      </svg>
      <span className={`font-serif text-xl tracking-tight ${textClass}`}>
        Nadlan<span className="text-sea">Connect</span>
      </span>
      <IsraelFlag className="h-[15px] w-5 shrink-0 rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.25)] ring-1 ring-black/5" />
    </span>
  );
}
