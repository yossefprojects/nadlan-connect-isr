import { Link } from "wouter";
import { useListPrograms, getListProgramsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/layout/language-provider";
import { Building2, Plus, Settings } from "lucide-react";

export default function DashboardProgrammes() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: programs, isLoading } = useListPrograms(
    { ownerId: user?.id },
    {
      query: {
        enabled: !!user?.id,
        queryKey: getListProgramsQueryKey({ ownerId: user?.id }),
      },
    }
  );

  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-serif text-3xl font-bold text-primary">{t("programs.title")}</h1>
        <Link href="/dashboard/programmes/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> {t("programs.new")}
          </Button>
        </Link>
      </div>
      <p className="text-muted-foreground mb-8">{t("programs.subtitle")}</p>

      {isLoading ? (
        <div className="h-32 bg-muted animate-pulse rounded-xl" />
      ) : !programs || programs.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
          <Building2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{t("programs.empty")}</p>
          <Link href="/dashboard/programmes/new">
            <Button variant="outline">{t("programs.createFirst")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map((p) => (
            <Card key={p.id} className="overflow-hidden flex flex-col">
              <div className="aspect-video bg-muted relative">
                {p.coverImageUrl ? (
                  <img
                    src={p.coverImageUrl}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
                <Badge
                  variant="outline"
                  className={`absolute top-2 end-2 bg-card/90 ${
                    p.status === "published"
                      ? "border-emerald-200 text-emerald-700"
                      : ""
                  }`}
                >
                  {t(`programs.status.${p.status}`)}
                </Badge>
              </div>
              <CardContent className="p-4 flex flex-col flex-1">
                <h3 className="font-serif text-lg font-bold text-primary truncate">{p.title}</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {p.ville}
                  {p.quartier ? ` · ${p.quartier}` : ""}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {p.projetsCount ?? 0} {t("programs.projetsCount")}
                </p>
                <div className="mt-auto">
                  <Link href={`/dashboard/programmes/${p.id}/edit`}>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Settings className="h-4 w-4" /> {t("programs.manage")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
