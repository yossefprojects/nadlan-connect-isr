import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/layout/language-provider";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md";
  label?: string;
}

// "Agence vérifiée" trust signal — shown once an admin validates the agency's
// Risha'yon license (licenceStatut === "verifie").
export function VerifiedBadge({ className, size = "md", label }: VerifiedBadgeProps) {
  const { t } = useLanguage();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-emerald-50 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
      title={t("verifiedBadge.tooltip")}
    >
      <BadgeCheck className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {label ?? t("verifiedBadge.label")}
    </span>
  );
}
