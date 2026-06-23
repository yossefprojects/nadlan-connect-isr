import { useGetAdminStats, useAdminListListings, useAdminUpdateListingStatus, getAdminListListingsQueryKey, getGetAdminStatsQueryKey, useAdminListProfiles, useAdminUpdateLicenceStatut, getAdminListProfilesQueryKey, useListAllDemolitionListings, useUpdateDemolitionListingStatus, getListAllDemolitionListingsQueryKey, useListAllDemolitionConnections, useUpdateDemolitionConnectionStatus, getListAllDemolitionConnectionsQueryKey, type DemolitionStatusUpdate, type DemolitionConnectionStatusUpdate } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VerifiedBadge } from "@/components/verified-badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Building, ShieldCheck, FileText, Hammer } from "lucide-react";
import { useLanguage } from "@/components/layout/language-provider";

export default function Admin() {
  const { data: stats, isLoading: isStatsLoading } = useGetAdminStats();
  const { data: listings, isLoading: isListingsLoading } = useAdminListListings({});
  const { data: agences, isLoading: isAgencesLoading } = useAdminListProfiles({ role: "agent" });
  const { data: promoteurs, isLoading: isPromoteursLoading } = useAdminListProfiles({ role: "developer" });
  const { data: apporteurs, isLoading: isApporteursLoading } = useAdminListProfiles({ role: "introducer" });

  const { data: demoListings, isLoading: isDemoLoading } = useListAllDemolitionListings();
  const { data: demoConnections, isLoading: isConnectionsLoading } = useListAllDemolitionConnections();

  const updateStatus = useAdminUpdateListingStatus();
  const updateLicence = useAdminUpdateLicenceStatut();
  const updateDemoStatus = useUpdateDemolitionListingStatus();
  const updateConnection = useUpdateDemolitionConnectionStatus();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleDemoUpdate = (id: number, data: DemolitionStatusUpdate) => {
    updateDemoStatus.mutate({ listingId: id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAllDemolitionListingsQueryKey() });
        toast({ title: t("demo.admin.updated") });
      },
      onError: () => toast({ title: t("demo.admin.updateError"), variant: "destructive" }),
    });
  };

  const handleConnectionUpdate = (id: number, data: DemolitionConnectionStatusUpdate) => {
    updateConnection.mutate({ connectionId: id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAllDemolitionConnectionsQueryKey() });
        toast({ title: t("demo.admin.connectionUpdated") });
      },
      onError: () => toast({ title: t("demo.admin.connectionError"), variant: "destructive" }),
    });
  };

  const demoProjectLabel = (pt: string) =>
    pt === "tama38" ? t("demo.projectType.tama38")
      : pt === "pinui_binui" ? t("demo.projectType.pinui_binui")
      : t("demo.projectType.both");

  const handleStatusChange = (id: number, status: "draft" | "published" | "sold" | "archived") => {
    updateStatus.mutate({ listingId: id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListListingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      },
      onError: (error) => {
        const isGone = (error as { status?: number })?.status === 404;
        toast({
          title: isGone ? t("admin.listingGoneError") : t("admin.statusUpdateError"),
          variant: "destructive",
        });
        if (isGone) {
          queryClient.invalidateQueries({ queryKey: getAdminListListingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        }
      },
    });
  };

  const handleLicenceChange = (
    profileId: number,
    licenceStatut: "verifie" | "rejete" | "en_attente",
    role: "agent" | "developer" | "introducer" = "agent",
  ) => {
    updateLicence.mutate({ profileId, data: { licenceStatut } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListProfilesQueryKey({ role }) });
      }
    });
  };

  if (isStatsLoading) return <div className="p-8">{t("common.loading")}</div>;

  return (
    <div className="container py-8 max-w-6xl">
      <h1 className="font-serif text-3xl font-bold text-primary mb-8">{t("admin.title")}</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.registeredUsers")}</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.totalProperties")}</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalListings || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.exchangedLeads")}</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalLeads || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="font-serif text-2xl font-bold text-primary mb-6">{t("admin.moderationTitle")}</h2>
        
        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm text-start">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colId")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colTitle")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colOwner")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colType")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colStatus")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground text-end">{t("admin.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isListingsLoading ? (
                <tr><td colSpan={6} className="text-center py-8">{t("common.loading")}</td></tr>
              ) : listings?.map((listing) => (
                <tr key={listing.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{listing.id}</td>
                  <td className="px-6 py-4 font-medium">{listing.title}</td>
                  <td className="px-6 py-4 text-muted-foreground">{listing.ownerName || listing.ownerId}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline">{t(`listingType.${listing.type}`)}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={
                      listing.status === "published" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                      listing.status === "draft" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                      "bg-muted text-muted-foreground hover:bg-muted"
                    } variant="secondary">
                      {t(`status.${listing.status}`)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-end">
                    <Select 
                      value={listing.status} 
                      onValueChange={(val: any) => handleStatusChange(listing.id, val)}
                    >
                      <SelectTrigger className="w-[140px] ms-auto h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{t("status.draft")}</SelectItem>
                        <SelectItem value="published">{t("status.published")}</SelectItem>
                        <SelectItem value="sold">{t("status.sold")}</SelectItem>
                        <SelectItem value="archived">{t("status.archived")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h2 className="font-serif text-2xl font-bold text-primary">{t("admin.agencyVerification")}</h2>
        </div>

        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm text-start">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colAgency")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colContact")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colLicense")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colStatus")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground text-end">{t("admin.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isAgencesLoading ? (
                <tr><td colSpan={5} className="text-center py-8">{t("common.loading")}</td></tr>
              ) : !agences || agences.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">{t("admin.noAgencyRequests")}</td></tr>
              ) : agences.map((agence) => (
                <tr key={agence.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {agence.companyName}
                    <div className="text-xs text-muted-foreground font-normal">{agence.ville}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {agence.firstName} {agence.lastName}
                    <div className="text-xs">{agence.email}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{agence.licenseNumber || "—"}</td>
                  <td className="px-6 py-4">
                    {agence.licenceStatut === "verifie" ? (
                      <VerifiedBadge size="sm" />
                    ) : agence.licenceStatut === "rejete" ? (
                      <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">{t("admin.rejected")}</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">{t("admin.pending")}</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-end">
                    <div className="flex gap-2 justify-end">
                      {agence.licenceStatut !== "verifie" && (
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={updateLicence.isPending}
                          onClick={() => handleLicenceChange(agence.id, "verifie")}
                        >
                          {t("admin.verify")}
                        </Button>
                      )}
                      {agence.licenceStatut !== "rejete" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-700 border-red-200 hover:bg-red-50"
                          disabled={updateLicence.isPending}
                          onClick={() => handleLicenceChange(agence.id, "rejete")}
                        >
                          {t("admin.reject")}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h2 className="font-serif text-2xl font-bold text-primary">{t("admin.promoteurVerification")}</h2>
        </div>

        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm text-start">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colCompany")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colContact")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colCompanyNumber")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colStatus")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground text-end">{t("admin.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isPromoteursLoading ? (
                <tr><td colSpan={5} className="text-center py-8">{t("common.loading")}</td></tr>
              ) : !promoteurs || promoteurs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">{t("admin.noPromoteurRequests")}</td></tr>
              ) : promoteurs.map((promoteur) => (
                <tr key={promoteur.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {promoteur.companyName}
                    <div className="text-xs text-muted-foreground font-normal">{promoteur.ville}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {promoteur.firstName} {promoteur.lastName}
                    <div className="text-xs">{promoteur.email}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{promoteur.companyNumber || "—"}</td>
                  <td className="px-6 py-4">
                    {promoteur.licenceStatut === "verifie" ? (
                      <VerifiedBadge size="sm" label={t("admin.verified")} />
                    ) : promoteur.licenceStatut === "rejete" ? (
                      <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">{t("admin.rejected")}</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">{t("admin.pending")}</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-end">
                    <div className="flex gap-2 justify-end">
                      {promoteur.licenceStatut !== "verifie" && (
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={updateLicence.isPending}
                          onClick={() => handleLicenceChange(promoteur.id, "verifie", "developer")}
                        >
                          {t("admin.verify")}
                        </Button>
                      )}
                      {promoteur.licenceStatut !== "rejete" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-700 border-red-200 hover:bg-red-50"
                          disabled={updateLicence.isPending}
                          onClick={() => handleLicenceChange(promoteur.id, "rejete", "developer")}
                        >
                          {t("admin.reject")}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h2 className="font-serif text-2xl font-bold text-primary">{t("admin.apporteurVerification")}</h2>
        </div>

        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm text-start">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colApporteur")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colContact")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colStatus")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground text-end">{t("admin.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isApporteursLoading ? (
                <tr><td colSpan={4} className="text-center py-8">{t("common.loading")}</td></tr>
              ) : !apporteurs || apporteurs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">{t("admin.noApporteurRequests")}</td></tr>
              ) : apporteurs.map((apporteur) => (
                <tr key={apporteur.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {apporteur.companyName}
                    <div className="text-xs text-muted-foreground font-normal">{apporteur.ville}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {apporteur.firstName} {apporteur.lastName}
                    <div className="text-xs">{apporteur.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {apporteur.licenceStatut === "verifie" ? (
                      <VerifiedBadge size="sm" label={t("admin.verified")} />
                    ) : apporteur.licenceStatut === "rejete" ? (
                      <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">{t("admin.rejected")}</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">{t("admin.pending")}</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-end">
                    <div className="flex gap-2 justify-end">
                      {apporteur.licenceStatut !== "verifie" && (
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={updateLicence.isPending}
                          onClick={() => handleLicenceChange(apporteur.id, "verifie", "introducer")}
                        >
                          {t("admin.verify")}
                        </Button>
                      )}
                      {apporteur.licenceStatut !== "rejete" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-700 border-red-200 hover:bg-red-50"
                          disabled={updateLicence.isPending}
                          onClick={() => handleLicenceChange(apporteur.id, "rejete", "introducer")}
                        >
                          {t("admin.reject")}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Hammer className="h-6 w-6 text-primary" />
          <h2 className="font-serif text-2xl font-bold text-primary">{t("demo.admin.title")}</h2>
        </div>

        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm text-start">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colId")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("demo.detail.building")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("demo.filter.projectType")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("demo.offers")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colStatus")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground text-end">{t("admin.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isDemoLoading ? (
                <tr><td colSpan={6} className="text-center py-8">{t("common.loading")}</td></tr>
              ) : !demoListings || demoListings.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">{t("demo.admin.none")}</td></tr>
              ) : demoListings.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{d.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium" dir="auto">{d.address}</div>
                    <div className="text-xs text-muted-foreground" dir="auto">{d.city} · {d.units} {t("demo.units")}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline">{demoProjectLabel(d.projectType)}</Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{d.offerCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <Badge className={
                        d.status === "active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                        d.status === "pending" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                        "bg-muted text-muted-foreground hover:bg-muted"
                      } variant="secondary">
                        {t(`demo.status.${d.status}`)}
                      </Badge>
                      <Badge variant="secondary" className={
                        d.isPaid ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-muted text-muted-foreground hover:bg-muted"
                      }>
                        {d.isPaid ? t("demo.admin.paid") : t("demo.admin.unpaid")}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-end">
                    <div className="flex flex-wrap gap-2 justify-end">
                      {d.status !== "active" && (
                        <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={updateDemoStatus.isPending}
                          onClick={() => handleDemoUpdate(d.id, { status: "active" })}>
                          {t("demo.admin.approve")}
                        </Button>
                      )}
                      {d.status !== "pending" && (
                        <Button size="sm" variant="outline" className="h-8"
                          disabled={updateDemoStatus.isPending}
                          onClick={() => handleDemoUpdate(d.id, { status: "pending" })}>
                          {t("demo.admin.setPending")}
                        </Button>
                      )}
                      {d.status !== "closed" && (
                        <Button size="sm" variant="outline" className="h-8 text-red-700 border-red-200 hover:bg-red-50"
                          disabled={updateDemoStatus.isPending}
                          onClick={() => handleDemoUpdate(d.id, { status: "closed" })}>
                          {t("demo.admin.close")}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-8"
                        disabled={updateDemoStatus.isPending}
                        onClick={() => handleDemoUpdate(d.id, { isPaid: !d.isPaid })}>
                        {d.isPaid ? t("demo.admin.markUnpaid") : t("demo.admin.markPaid")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h2 className="font-serif text-2xl font-bold text-primary">{t("demo.admin.connectionsTitle")}</h2>
        </div>

        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm text-start">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colId")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("demo.detail.building")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("demo.admin.colPromoter")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colOwner")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">{t("admin.colStatus")}</th>
                <th className="px-6 py-4 font-medium text-muted-foreground text-end">{t("admin.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isConnectionsLoading ? (
                <tr><td colSpan={6} className="text-center py-8">{t("common.loading")}</td></tr>
              ) : !demoConnections || demoConnections.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">{t("demo.admin.noConnections")}</td></tr>
              ) : demoConnections.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{c.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium" dir="auto">{c.listingNeighborhood || c.listingCity || `#${c.listingId}`}</div>
                    <div className="text-xs text-muted-foreground" dir="auto">{c.listingCity}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{c.promoterCompany || c.promoterName || c.promoterId}</div>
                    <div className="text-xs text-muted-foreground">{c.promoterEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground" dir="auto">{c.ownerName || "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <Badge variant="secondary" className={
                        c.status === "validated" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                        c.status === "rejected" ? "bg-red-100 text-red-700 hover:bg-red-100" :
                        "bg-amber-100 text-amber-700 hover:bg-amber-100"
                      }>
                        {t(`demo.connection.${c.status}`)}
                      </Badge>
                      {c.commissionStatus !== "none" && (
                        <Badge variant="secondary" className={
                          c.commissionStatus === "paid" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-sea/15 text-sea hover:bg-sea/15"
                        }>
                          {t(`demo.commission.${c.commissionStatus}`)}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-end">
                    <div className="flex flex-wrap gap-2 justify-end">
                      {c.status !== "validated" && (
                        <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={updateConnection.isPending}
                          onClick={() => handleConnectionUpdate(c.id, { status: "validated" })}>
                          {t("demo.admin.validateConnection")}
                        </Button>
                      )}
                      {c.status !== "rejected" && (
                        <Button size="sm" variant="outline" className="h-8 text-red-700 border-red-200 hover:bg-red-50"
                          disabled={updateConnection.isPending}
                          onClick={() => handleConnectionUpdate(c.id, { status: "rejected" })}>
                          {t("demo.admin.rejectConnection")}
                        </Button>
                      )}
                    </div>
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