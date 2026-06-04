import {
  useGetMyMandates,
  useWithdrawMandate,
  getGetMyMandatesQueryKey,
  useListMandatesForListing,
  useUpdateMandateStatus,
  getListMandatesForListingQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { FileText, Star, X, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/layout/language-provider";

const STATUS_STYLE: Record<string, string> = {
  pending: "border-amber-200 text-amber-700 bg-amber-50",
  approved: "border-emerald-200 text-emerald-700 bg-emerald-50",
  rejected: "border-red-200 text-red-700 bg-red-50",
};

/** Agent view: shows all mandate applications they've sent */
export default function DashboardMandates() {
  const { data: mandates, isLoading } = useGetMyMandates();
  const withdrawMandate = useWithdrawMandate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleWithdraw = (mandateId: number) => {
    withdrawMandate.mutate({ mandateId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyMandatesQueryKey() });
        toast({ title: t("mandates.withdrawn") });
      },
    });
  };

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div className="space-y-4">
      {(!mandates || mandates.length === 0) ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground mb-2">{t("mandates.noneSent")}</p>
          <p className="text-sm text-muted-foreground">
            {t("mandates.consultPrefix")}{" "}
            <Link href="/listings" className="underline hover:text-primary">
              {t("mandates.newProgramsLink")}
            </Link>{" "}
            {t("mandates.applySuffix")}
          </p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm text-start">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("mandates.colProject")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("mandates.colType")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("mandates.colStatus")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("mandates.colDate")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground text-end">{t("mandates.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mandates.map((m) => (
                <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/listings/${m.listingSlug ?? m.listingId}`}
                      className="font-medium hover:text-primary hover:underline flex items-center gap-1"
                    >
                      {m.listingTitle ?? `${t("mandates.projectNum")}${m.listingId}`}
                      <ExternalLink className="h-3 w-3 opacity-40" />
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {m.exclusive ? (
                      <span className="flex items-center gap-1 text-[#C9A84C] font-medium">
                        <Star className="h-3.5 w-3.5 fill-[#C9A84C]" /> {t("mandates.exclusive")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t("mandates.nonExclusive")}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={STATUS_STYLE[m.status] ?? ""}>
                      {t(`mandateStatus.${m.status}`)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-end">
                    {m.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleWithdraw(m.id)}
                        disabled={withdrawMandate.isPending}
                      >
                        <X className="h-4 w-4 me-1" /> {t("mandates.withdraw")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Developer view: shows mandate requests for a specific listing */
export function ListingMandateRequests({ listingId }: { listingId: number }) {
  const { data: mandates, isLoading } = useListMandatesForListing(listingId);
  const updateStatus = useUpdateMandateStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleDecision = (mandateId: number, status: "approved" | "rejected") => {
    updateStatus.mutate({ mandateId, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListMandatesForListingQueryKey(listingId),
        });
        toast({
          title: status === "approved" ? t("mandates.approvedToast") : t("mandates.rejectedToast"),
        });
      },
    });
  };

  if (isLoading)
    return <div className="py-4 text-center text-sm text-muted-foreground">{t("common.loading")}</div>;
  if (!mandates || mandates.length === 0)
    return <p className="text-sm text-muted-foreground py-2">{t("mandates.noneReceived")}</p>;

  return (
    <div className="space-y-3">
      {mandates.map((m) => (
        <Card key={m.id} className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex-1">
            <div className="font-medium">{m.agentName ?? m.agentId}</div>
            {m.agentEmail && (
              <div className="text-xs text-muted-foreground">{m.agentEmail}</div>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {m.exclusive && (
                <Badge
                  variant="outline"
                  className="border-[#C9A84C]/30 text-[#C9A84C] bg-[#C9A84C]/5 text-xs"
                >
                  <Star className="h-3 w-3 me-1 fill-[#C9A84C]" /> {t("mandates.exclusivityRequested")}
                </Badge>
              )}
              <Badge variant="outline" className={`text-xs ${STATUS_STYLE[m.status] ?? ""}`}>
                {t(`mandateStatus.${m.status}`)}
              </Badge>
            </div>
            {m.note && (
              <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                "{m.note}"
              </p>
            )}
            {m.justificationUrl && (
              <a
                href={m.justificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline flex items-center gap-1 mt-1"
              >
                <FileText className="h-3 w-3" /> {t("mandates.viewJustification")}
              </a>
            )}
          </div>
          {m.status === "pending" && (
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleDecision(m.id, "rejected")}
                disabled={updateStatus.isPending}
              >
                {t("mandates.reject")}
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleDecision(m.id, "approved")}
                disabled={updateStatus.isPending}
              >
                {t("mandates.approve")}
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
