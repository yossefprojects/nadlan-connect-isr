import { useGetDashboardStats, useListListings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Inbox, CheckCircle, TrendingUp, Plus, Edit, Handshake } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/use-user-role";
import { ListingMandateRequests } from "./dashboard-mandates";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

function ListingMandateSection({ listingId, title }: { listingId: number; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate max-w-[70%]">{title}</span>
        <span className="flex items-center gap-2 text-muted-foreground shrink-0">
          Mandataires
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </button>
      {open && (
        <div className="p-4 bg-card">
          <ListingMandateRequests listingId={listingId} />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats();
  const { data: listingsData, isLoading: isListingsLoading } = useListListings();
  const { role } = useUserRole();

  if (isStatsLoading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl font-bold text-primary">Tableau de Bord Professionnel</h1>
        <div className="flex gap-3">
          {role === "agent" && (
            <Link href="/dashboard/mandates">
              <Button variant="outline" className="gap-2">
                <Handshake className="h-4 w-4" /> Mes Mandats
              </Button>
            </Link>
          )}
          {role === "developer" && (
            <Link href="/dashboard/listings/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Nouveau Projet
              </Button>
            </Link>
          )}
          {role !== "developer" && role !== "agent" && (
            <Link href="/dashboard/listings/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Nouvelle Propriété
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {role === "developer" ? "Mes Projets" : "Total Propriétés"}
            </CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalListings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.publishedListings || 0} publiés</p>
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

      {/* Developer: Mandate requests per listing */}
      {role === "developer" && listingsData?.listings && listingsData.listings.length > 0 && (
        <div className="mb-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
              <Handshake className="h-6 w-6" />
              Demandes de mandataires
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Gérez les agents immobiliers qui souhaitent commercialiser vos projets.
          </p>
          <div className="space-y-3">
            {listingsData.listings
              .filter(l => l.type === "new_development")
              .map(listing => (
                <ListingMandateSection
                  key={listing.id}
                  listingId={listing.id}
                  title={listing.title}
                />
              ))}
            {listingsData.listings.filter(l => l.type === "new_development").length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-xl border border-dashed">
                Vous n'avez aucun programme neuf publié. Les mandataires peuvent postuler sur vos programmes neufs.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-2xl font-bold text-primary">
            {role === "developer" ? "Mes Programmes" : "Mes Propriétés"}
          </h2>
          {role === "developer" && (
            <Link href="/dashboard/listings/new">
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Nouveau
              </Button>
            </Link>
          )}
        </div>
        
        {isListingsLoading ? (
          <div className="h-32 bg-muted animate-pulse rounded-xl" />
        ) : listingsData?.listings.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
            <p className="text-muted-foreground mb-4">
              {role === "developer"
                ? "Vous n'avez aucun programme."
                : "Vous n'avez aucune propriété."}
            </p>
            <Link href="/dashboard/listings/new">
              <Button variant="outline">
                {role === "developer" ? "Créer votre premier programme" : "Créer votre première annonce"}
              </Button>
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
                    <td className="px-6 py-4 font-medium">
                      <div>{listing.title}</div>
                      {listing.type === "new_development" && (
                        <span className="text-xs text-[#C9A84C] font-medium">Programme neuf</span>
                      )}
                    </td>
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
