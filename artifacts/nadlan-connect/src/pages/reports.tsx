import { useState } from "react";
import { Link } from "wouter";
import {
  useListMyReports,
  useDeleteReport,
  getListMyReportsQueryKey,
} from "@workspace/api-client-react";
import type { SavedReport } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/language-provider";
import { localeForLanguage } from "@/lib/i18n";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  MessageSquare,
  Download,
  Trash2,
  Loader2,
  Sparkles,
  ScrollText,
  FolderOpen,
} from "lucide-react";

export default function Reports() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { isAuthenticated } = useUserRole();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useListMyReports({
    query: { enabled: isAuthenticated, queryKey: getListMyReportsQueryKey() },
  });
  const deleteReport = useDeleteReport();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (r: SavedReport) => {
    setDownloadingId(r.id);
    try {
      const mod = await import("@/lib/report-pdf");
      if (r.kind === "analysis" && r.analysis) {
        await mod.downloadAnalysisPdf(r.listingText ?? "", r.analysis, language);
      } else if (r.kind === "chat" && r.chatMarkdown) {
        await mod.downloadChatPdf(r.chatMarkdown, r.title, language);
      }
    } catch {
      toast({ title: t("analyse.pdfFailed"), variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteReport.mutateAsync({ reportId: id });
      await queryClient.invalidateQueries({ queryKey: getListMyReportsQueryKey() });
      toast({ title: t("reports.deleted") });
    } catch {
      toast({ title: t("reports.deleteFailed"), variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-16">
        <SignInPrompt
          title="reports.title"
          subtitle="reports.loginRequired"
          cta="nav.login"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="bg-gradient-to-br from-[#0F2235] to-[#1A3A5C] text-white">
        <div className="container py-10">
          <h1 className="font-serif text-3xl">{t("reports.title")}</h1>
          <p className="mt-2 text-white/70">{t("reports.subtitle")}</p>
        </div>
      </div>

      <div className="container py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
          </div>
        ) : !reports || reports.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <ScrollText className="mb-3 h-10 w-10 text-[#C9A84C]" />
              <p className="font-medium text-[#1A3A5C]">{t("reports.emptyTitle")}</p>
              <p className="text-sm">{t("reports.emptyDesc")}</p>
              <Link href="/outils/analyse-ia">
                <Button className="mt-4 bg-[#C9A84C] hover:bg-[#b8963e] text-white border-0">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("reports.cta")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((r) => (
              <Card key={r.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C9A84C]/15">
                      {r.kind === "chat" ? (
                        <MessageSquare className="h-4 w-4 text-[#C9A84C]" />
                      ) : (
                        <FileText className="h-4 w-4 text-[#C9A84C]" />
                      )}
                    </div>
                    <Badge variant="outline" className="font-normal">
                      {r.kind === "chat" ? t("analyse.tabChat") : t("analyse.tabAnalysis")}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="line-clamp-2 font-medium text-[#1A3A5C]">{r.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString(
                        localeForLanguage(language),
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/outils/analyse-ia?reportId=${r.id}`} className="flex-1">
                      <Button
                        size="sm"
                        className="w-full bg-[#1A3A5C] hover:bg-[#0F2235] text-white border-0"
                      >
                        <FolderOpen className="h-4 w-4" />
                        <span className="ml-1.5">{t("reports.view")}</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#1A3A5C]/20 text-[#1A3A5C]"
                      onClick={() => handleDownload(r)}
                      disabled={downloadingId === r.id}
                      aria-label="PDF"
                    >
                      {downloadingId === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(r.id)}
                      disabled={deleteReport.isPending}
                      aria-label={t("reports.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
