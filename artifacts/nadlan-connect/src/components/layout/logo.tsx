import { IsraelFlag } from "./israel-flag";

interface LogoProps {
  textClass?: string;
  className?: string;
}

// Centralised brand mark: a sea-green dot + the NadlanConnect wordmark (Fraunces,
// "Connect" in sea) with the small Israel flag accent. Replaces the old favicon
// image in the chrome so the logo fits the light Méditerranée palette.
export function Logo({ textClass = "text-foreground", className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`font-serif text-xl tracking-tight ${textClass}`}>
        Nadlan<span className="text-sea">Connect</span>
      </span>
      <IsraelFlag className="h-[15px] w-5 shrink-0 rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.25)] ring-1 ring-black/5" />
    </span>
  );
}
