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

const STATUS_STYLE: Record<string, string> = {
  pending: "border-amber-200 text-amber-700 bg-amber-50",
  approved: "border-emerald-200 text-emerald-700 bg-emerald-50",
  rejected: "border-red-200 text-red-700 bg-red-50",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé ✓",
  rejected: "Refusé",
};

/** Agent view: shows all mandate applications they've sent */
export default function DashboardMandates() {
  const { data: mandates, isLoading } = useGetMyMandates();
  const withdrawMandate = useWithdrawMandate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleWithdraw = (mandateId: number) => {
    withdrawMandate.mutate({ mandateId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyMandatesQueryKey() });
        toast({ title: "Candidature retirée" });
      },
    });
  };

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-4">
      {(!mandates || mandates.length === 0) ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground mb-2">Aucune candidature envoyée.</p>
          <p className="text-sm text-muted-foreground">
            Consultez les{" "}
            <Link href="/listings" className="underline hover:text-primary">
              programmes neufs
            </Link>{" "}
            pour postuler comme mandataire.
          </p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground">Projet</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Type</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Statut</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mandates.map((m) => (
                <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/listings/${m.listingId}`}
                      className="font-medium hover:text-primary hover:underline flex items-center gap-1"
                    >
                      {m.listingTitle ?? `Projet #${m.listingId}`}
                      <ExternalLink className="h-3 w-3 opacity-40" />
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {m.exclusive ? (
                      <span className="flex items-center gap-1 text-[#C9A84C] font-medium">
                        <Star className="h-3.5 w-3.5 fill-[#C9A84C]" /> Exclusif
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Non-exclusif</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={STATUS_STYLE[m.status] ?? ""}>
                      {STATUS_LABEL[m.status] ?? m.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {m.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleWithdraw(m.id)}
                        disabled={withdrawMandate.isPending}
                      >
                        <X className="h-4 w-4 mr-1" /> Retirer
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

  const handleDecision = (mandateId: number, status: "approved" | "rejected") => {
    updateStatus.mutate({ mandateId, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListMandatesForListingQueryKey(listingId),
        });
        toast({
          title: status === "approved" ? "Candidature approuvée ✓" : "Candidature refusée",
        });
      },
    });
  };

  if (isLoading)
    return <div className="py-4 text-center text-sm text-muted-foreground">Chargement...</div>;
  if (!mandates || mandates.length === 0)
    return <p className="text-sm text-muted-foreground py-2">Aucune candidature reçue.</p>;

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
                  <Star className="h-3 w-3 mr-1 fill-[#C9A84C]" /> Exclusivité demandée
                </Badge>
              )}
              <Badge variant="outline" className={`text-xs ${STATUS_STYLE[m.status] ?? ""}`}>
                {STATUS_LABEL[m.status] ?? m.status}
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
                <FileText className="h-3 w-3" /> Voir justificatif
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
                Refuser
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleDecision(m.id, "approved")}
                disabled={updateStatus.isPending}
              >
                Approuver
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
