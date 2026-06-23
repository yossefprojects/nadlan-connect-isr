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
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full bg-sea"
        style={{ boxShadow: "0 0 0 4px hsl(var(--sea-soft))" }}
        aria-hidden="true"
      />
      <span className={`relative inline-block font-serif text-xl tracking-tight ${textClass}`}>
        Nadlan<span className="text-sea">Connect</span>
        <IsraelFlag className="absolute -bottom-1 -right-4 h-[15px] w-5 rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.35)] ring-1 ring-black/5" />
      </span>
    </span>
  );
}
