import { useListLeads, getListLeadsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/components/layout/language-provider";
import { useAuth } from "@/hooks/use-auth";

export default function Leads() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: leads, isLoading } = useListLeads({
    query: { enabled: isAuthenticated, queryKey: getListLeadsQueryKey() },
  });
  const { t } = useLanguage();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">{t("leadStatus.new")}</Badge>;
      case "contacted":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">{t("leadStatus.contacted")}</Badge>;
      case "closed":
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">{t("leadStatus.closed")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="font-serif text-3xl font-bold text-primary mb-2">{t("leadsPage.title")}</h1>
      <p className="text-muted-foreground mb-8">{t("leadsPage.subtitle")}</p>

      {!isAuthLoading && !isAuthenticated ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <h3 className="text-xl font-medium mb-2">{t("leadsPage.signin.title")}</h3>
          <p className="text-muted-foreground mb-6">{t("leadsPage.signin.subtitle")}</p>
          <Link href="/auth/login">
            <Button>{t("leadsPage.signin.cta")}</Button>
          </Link>
        </div>
      ) : isAuthLoading || isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : leads?.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <h3 className="text-xl font-medium mb-2">{t("leadsPage.emptyTitle")}</h3>
          <p className="text-muted-foreground">{t("leadsPage.emptyDesc")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads?.map((lead) => (
            <Link key={lead.id} href={`/leads/${lead.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer hover-elevate">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 dir="auto" className="font-bold text-lg mb-1">{lead.listingTitle || `${t("common.propertyNum")}${lead.listingId}`}</h3>
                    <p dir="auto" className="text-sm text-muted-foreground truncate max-w-lg">{lead.message}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(lead.status)}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {t("leadsPage.openDiscussion")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}