import { useGetAdminStats, useAdminListListings, useAdminUpdateListingStatus, getAdminListListingsQueryKey, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Building, ShieldCheck, FileText } from "lucide-react";

export default function Admin() {
  const { data: stats, isLoading: isStatsLoading } = useGetAdminStats();
  const { data: listings, isLoading: isListingsLoading } = useAdminListListings({});
  
  const updateStatus = useAdminUpdateListingStatus();
  const queryClient = useQueryClient();

  const handleStatusChange = (id: number, status: "draft" | "published" | "sold" | "archived") => {
    updateStatus.mutate({ listingId: id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListListingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      }
    });
  };

  if (isStatsLoading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="container py-8 max-w-6xl">
      <h1 className="font-serif text-3xl font-bold text-primary mb-8">Administration Globale</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs Inscrits</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Propriétés Totales</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalListings || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads Échangés</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalLeads || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="font-serif text-2xl font-bold text-primary mb-6">Modération des Annonces</h2>
        
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground">ID</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Titre</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Propriétaire</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Type</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Statut</th>
                <th className="px-6 py-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isListingsLoading ? (
                <tr><td colSpan={6} className="text-center py-8">Chargement...</td></tr>
              ) : listings?.map((listing) => (
                <tr key={listing.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{listing.id}</td>
                  <td className="px-6 py-4 font-medium">{listing.title}</td>
                  <td className="px-6 py-4 text-muted-foreground">{listing.ownerName || listing.ownerId}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline">{listing.type}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={
                      listing.status === "published" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                      listing.status === "draft" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                      "bg-muted text-muted-foreground hover:bg-muted"
                    } variant="secondary">
                      {listing.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Select 
                      value={listing.status} 
                      onValueChange={(val: any) => handleStatusChange(listing.id, val)}
                    >
                      <SelectTrigger className="w-[140px] ml-auto h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                        <SelectItem value="sold">Vendu</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}