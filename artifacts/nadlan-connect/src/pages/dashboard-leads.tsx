import { useListLeads, useUpdateLeadStatus, getListLeadsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { MessageCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function DashboardLeads() {
  const { data: leads, isLoading } = useListLeads();
  const updateStatus = useUpdateLeadStatus();
  const queryClient = useQueryClient();

  const handleStatusChange = (id: number, status: "new" | "contacted" | "closed") => {
    updateStatus.mutate({ leadId: id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
      }
    });
  };

  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="font-serif text-3xl font-bold text-primary mb-2">Leads Reçus</h1>
      <p className="text-muted-foreground mb-8">Gérez vos demandes de contact.</p>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : leads?.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <h3 className="text-xl font-medium mb-2">Aucun lead</h3>
          <p className="text-muted-foreground">Vous n'avez pas encore reçu de demandes.</p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground">Client</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Propriété</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Statut</th>
                <th className="px-6 py-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads?.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{lead.buyerName || "Client"}</td>
                  <td className="px-6 py-4">
                    <Link href={`/listings/${lead.listingSlug ?? lead.listingId}`} className="text-primary hover:underline">
                      {lead.listingTitle || `Propriété #${lead.listingId}`}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Select 
                      value={lead.status} 
                      onValueChange={(val: any) => handleStatusChange(lead.id, val)}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Nouveau</SelectItem>
                        <SelectItem value="contacted">En cours</SelectItem>
                        <SelectItem value="closed">Conclu</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/leads/${lead.id}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                        <MessageCircle className="h-3 w-3 mr-1" /> Discuter
                      </Badge>
                    </Link>
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