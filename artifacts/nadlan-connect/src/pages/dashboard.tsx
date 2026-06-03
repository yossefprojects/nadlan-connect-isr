import { useGetDashboardStats, useListListings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Inbox, CheckCircle, TrendingUp, Plus, Edit } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats();
  const { data: listingsData, isLoading: isListingsLoading } = useListListings(); // To show list of owned properties

  if (isStatsLoading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl font-bold text-primary">Tableau de Bord Professionnel</h1>
        <Link href="/dashboard/listings/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nouvelle Propriété
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Propriétés</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalListings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.publishedListings || 0} publiées</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <Inbox className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/dashboard/leads" className="hover:underline">Voir les demandes</Link>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nouveaux Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats?.newLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">À traiter</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads Conclus</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats?.closedLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Affaires terminées</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-2xl font-bold text-primary">Mes Propriétés</h2>
        </div>
        
        {isListingsLoading ? (
          <div className="h-32 bg-muted animate-pulse rounded-xl" />
        ) : listingsData?.listings.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
            <p className="text-muted-foreground mb-4">Vous n'avez aucune propriété.</p>
            <Link href="/dashboard/listings/new">
              <Button variant="outline">Créer votre première annonce</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Titre</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Ville</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Prix</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Statut</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {listingsData?.listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{listing.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{listing.ville}</td>
                    <td className="px-6 py-4 text-muted-foreground">₪{listing.price.toLocaleString("he-IL")}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={
                        listing.status === "published" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""
                      }>
                        {listing.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/listings/${listing.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8">
                          <Edit className="h-4 w-4 mr-2" /> Modifier
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}