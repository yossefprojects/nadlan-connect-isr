import { useGetDashboardStats, useListListings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Inbox, CheckCircle, TrendingUp, Plus, Edit, Handshake, Scale } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/use-user-role";
import { useLanguage } from "@/components/layout/language-provider";
import { ListingMandateRequests } from "./dashboard-mandates";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

function ListingMandateSection({ listingId, title }: { listingId: number; title: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium text-start"
        onClick={() => setOpen(!open)}
      >
        <span dir="auto" className="truncate max-w-[70%]">{title}</span>
        <span className="flex items-center gap-2 text-muted-foreground shrink-0">
          {t("dashboard.mandataires")}
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
  const { t, locale } = useLanguage();
  const [, setLocation] = useLocation();

  // Agences and apporteurs have no general dashboard — an agence sees only its
  // resale mandates, an apporteur only its own published projects + offers.
  useEffect(() => {
    if (role === "agent") setLocation("/demolition/reventes");
    else if (role === "introducer") setLocation("/demolition/mes-projets");
  }, [role, setLocation]);

  if (isStatsLoading) return <div className="p-8">{t("common.loading")}</div>;
  if (role === "agent" || role === "introducer") return null;

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8">
        <h1 className="font-serif text-3xl font-bold text-primary">{t("dashboard.title")}</h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/outils/analyse-ia">
            <Button variant="outline" className="gap-2 border-sea/40 text-sea hover:bg-sea/10">
              <Scale className="h-4 w-4" /> {t("dashboard.shamaiTool")}
            </Button>
          </Link>
          {role === "agent" && (
            <Link href="/dashboard/mandates">
              <Button variant="outline" className="gap-2">
                <Handshake className="h-4 w-4" /> {t("dashboard.myMandates")}
              </Button>
            </Link>
          )}
          {role === "developer" && (
            <Link href="/dashboard/programmes">
              <Button variant="outline" className="gap-2">
                <Building className="h-4 w-4" /> {t("programs.title")}
              </Button>
            </Link>
          )}
          {role === "developer" && (
            <Link href="/dashboard/listings/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> {t("dashboard.newProject")}
              </Button>
            </Link>
          )}
          {role !== "developer" && role !== "agent" && (
            <Link href="/dashboard/listings/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> {t("dashboard.newProperty")}
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {role === "developer" ? t("dashboard.myProjects") : t("dashboard.totalProperties")}
            </CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalListings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.publishedListings || 0} {t("dashboard.publishedCount")}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.totalLeads")}</CardTitle>
            <Inbox className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/dashboard/leads" className="hover:underline">{t("dashboard.viewRequests")}</Link>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.newLeads")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats?.newLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("dashboard.toProcess")}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.closedLeads")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats?.closedLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("dashboard.dealsCompleted")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Developer: Mandate requests per listing */}
      {role === "developer" && listingsData?.listings && listingsData.listings.length > 0 && (
        <div className="mb-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
              <Handshake className="h-6 w-6" />
              {t("dashboard.mandateRequests")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t("dashboard.mandateRequestsDesc")}
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
                {t("dashboard.noNewDevPublished")}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-2xl font-bold text-primary">
            {role === "developer" ? t("dashboard.myPrograms") : t("dashboard.myProperties")}
          </h2>
          {role === "developer" && (
            <Link href="/dashboard/listings/new">
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> {t("dashboard.newShort")}
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
                ? t("dashboard.noPrograms")
                : t("dashboard.noProperties")}
            </p>
            <Link href="/dashboard/listings/new">
              <Button variant="outline">
                {role === "developer" ? t("dashboard.createFirstProgram") : t("dashboard.createFirstListing")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-card border rounded-xl overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm text-start">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium text-muted-foreground">{t("dashboard.colTitle")}</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">{t("dashboard.colCity")}</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">{t("dashboard.colPrice")}</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">{t("dashboard.colStatus")}</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground text-end">{t("dashboard.colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {listingsData?.listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <div dir="auto">{listing.title}</div>
                      {listing.type === "new_development" && (
                        <span className="text-xs text-sea font-medium">{t("dashboard.newDevBadge")}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{listing.ville}</td>
                    <td className="px-6 py-4 text-muted-foreground">₪{listing.price.toLocaleString(locale)}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={
                        listing.status === "published" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""
                      }>
                        {t(`status.${listing.status}`)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <Link href={`/dashboard/listings/${listing.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8">
                          <Edit className="h-4 w-4 me-2" /> {t("dashboard.edit")}
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
