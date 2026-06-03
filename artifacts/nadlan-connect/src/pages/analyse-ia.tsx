import { useState } from "react";
import { useAnalyzeProperty } from "@workspace/api-client-react";
import type { AnalyzePropertyResult } from "@workspace/api-client-react";
import { useLanguage } from "@/components/layout/language-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Loader2,
  Download,
  TriangleAlert,
  Home,
  TrendingUp,
  Wrench,
  Building2,
  Gauge,
  Calculator,
} from "lucide-react";

const NAVY = "#1A3A5C";
const GOLD = "#C9A84C";

const EXAMPLE = `Appartement 4 pièces à vendre, Florentin, Tel Aviv. 92 m², 3ème étage avec ascenseur. Mamad, balcon, rénové récemment. Proche de la gare. Prix: 3,200,000 ₪. Possibilité de location 8500₪/mois.`;

const RECO_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  green: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  orange: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  red: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const SEVERITY_STYLE: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-red-100 text-red-800 border-red-200",
};

function fmtShekel(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " ₪";
}

function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toFixed(1).replace(".", ",") + " %";
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-[#1A3A5C]">{value}</span>
    </div>
  );
}

export default function AnalyseIA() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalyzePropertyResult | null>(null);
  const [analyzedText, setAnalyzedText] = useState("");
  const [exporting, setExporting] = useState(false);
  const analyze = useAnalyzeProperty();

  const boolT = (b: boolean | null | undefined): string =>
    b === null || b === undefined ? "—" : t(b ? "common.yes" : "common.no");

  const handleAnalyze = async () => {
    if (text.trim().length < 10) {
      toast({ title: t("analyse.toastMinChars"), variant: "destructive" });
      return;
    }
    setResult(null);
    const trimmed = text.trim();
    try {
      const res = await analyze.mutateAsync({ data: { listingText: trimmed, language } });
      setAnalyzedText(trimmed);
      setResult(res);
    } catch {
      toast({
        title: t("analyse.toastFailed"),
        description: t("analyse.toastFailedDesc"),
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    if (!result || exporting) return;
    setExporting(true);
    try {
      const { downloadAnalysisPdf } = await import("@/lib/report-pdf");
      await downloadAnalysisPdf(analyzedText, result);
    } catch {
      toast({
        title: t("analyse.pdfFailed"),
        description: t("analyse.pdfFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const reco = result ? RECO_STYLE[result.recommendation] ?? RECO_STYLE.orange : null;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0F2235] to-[#1A3A5C] text-white">
        <div className="container py-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-[#C9A84C]">
              <Sparkles className="h-3.5 w-3.5" /> {t("analyse.badge")}
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl">{t("analyse.title")}</h1>
          <p className="mt-2 max-w-2xl text-white/70">
            {t("analyse.subtitle")}
          </p>
        </div>
      </div>

      <div className="container py-8 grid gap-6 lg:grid-cols-5">
        {/* Input */}
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-[#1A3A5C]">{t("analyse.inputTitle")}</CardTitle>
              <CardDescription>{t("analyse.inputDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("analyse.placeholder")}
                className="min-h-[220px] resize-y"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setText(EXAMPLE)}
                  className="text-xs text-[#1A3A5C] underline underline-offset-2 hover:text-[#C9A84C]"
                >
                  {t("analyse.insertExample")}
                </button>
                <span className="text-xs text-muted-foreground">{text.length} {t("analyse.charCount")}</span>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={analyze.isPending}
                className="w-full text-white border-0"
                style={{ backgroundColor: GOLD }}
              >
                {analyze.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("analyse.analyzing")}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("analyse.analyzeBtn")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          {!result && !analyze.isPending && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <Gauge className="h-10 w-10 mb-3 text-[#C9A84C]" />
                <p className="font-medium text-[#1A3A5C]">{t("analyse.emptyTitle")}</p>
                <p className="text-sm">{t("analyse.emptyDesc")}</p>
              </CardContent>
            </Card>
          )}

          {analyze.isPending && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 className="h-10 w-10 mb-3 animate-spin text-[#C9A84C]" />
                <p className="font-medium text-[#1A3A5C]">{t("analyse.claudeAnalyzing")}</p>
                <p className="text-sm text-muted-foreground">{t("analyse.claudeAnalyzingSub")}</p>
              </CardContent>
            </Card>
          )}

          {result && reco && (
            <>
              {/* Score + recommendation */}
              <Card className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div
                    className="flex flex-col items-center justify-center p-6 text-white sm:w-48"
                    style={{ backgroundColor: NAVY }}
                  >
                    <span className="text-5xl font-serif">{result.overallScore}</span>
                    <span className="text-xs uppercase tracking-wider text-white/60">{t("analyse.scoreOf")}</span>
                  </div>
                  <div className="flex-1 p-6">
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${reco.bg} ${reco.text}`}>
                      <span className={`h-2 w-2 rounded-full ${reco.dot}`} />
                      {t(`reco.${result.recommendation}`)}
                    </div>
                    <p className="mt-3 text-sm text-[#1A3A5C]">{result.recommendationText}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={exporting}
                        className="border-[#1A3A5C]/20 text-[#1A3A5C]"
                      >
                        {exporting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("analyse.generatingPdf")}
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            {t("analyse.downloadPdf")}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-[#1A3A5C]">{t("analyse.summary")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Features */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-[#1A3A5C]">
                      <Home className="h-4 w-4 text-[#C9A84C]" /> {t("analyse.features")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <StatRow label={t("analyse.surface")} value={result.features.surface ? `${result.features.surface} m²` : "—"} />
                    <StatRow label={t("analyse.rooms")} value={result.features.rooms?.toString() ?? "—"} />
                    <StatRow label={t("analyse.floor")} value={result.features.floor ?? "—"} />
                    <StatRow label={t("analyse.mamad")} value={boolT(result.features.hasMamad)} />
                    <StatRow label={t("analyse.elevator")} value={boolT(result.features.hasElevator)} />
                    <StatRow label={t("analyse.parking")} value={boolT(result.features.hasParking)} />
                    <StatRow label={t("analyse.location")} value={[result.features.neighborhood, result.features.city].filter(Boolean).join(", ") || "—"} />
                  </CardContent>
                </Card>

                {/* Market */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base text-[#1A3A5C]">
                      <span className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-[#C9A84C]" /> {t("analyse.marketEstimate")}
                      </span>
                      <Badge variant="outline" className="font-normal">
                        {t(`verdict.${result.marketEstimate.verdict}`)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <StatRow label={t("analyse.pricePerSqm")} value={fmtShekel(result.marketEstimate.pricePerSqm)} />
                    <StatRow label={t("analyse.estimatedValue")} value={fmtShekel(result.marketEstimate.estimatedValue)} />
                    <StatRow label={t("analyse.listedPrice")} value={fmtShekel(result.marketEstimate.listedPrice)} />
                    <p className="pt-3 text-xs text-muted-foreground leading-relaxed">{result.marketEstimate.comment}</p>
                  </CardContent>
                </Card>

                {/* Rental yield */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-[#1A3A5C]">
                      <TrendingUp className="h-4 w-4 text-[#C9A84C]" /> {t("analyse.rentalYield")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <StatRow label={t("analyse.monthlyRent")} value={fmtShekel(result.rentalYield.estimatedMonthlyRent)} />
                    <StatRow label={t("analyse.grossYield")} value={fmtPct(result.rentalYield.grossYieldPct)} />
                    <StatRow label={t("analyse.netYield")} value={fmtPct(result.rentalYield.netYieldPct)} />
                    <p className="pt-3 text-xs text-muted-foreground leading-relaxed">{result.rentalYield.comment}</p>
                  </CardContent>
                </Card>

                {/* Renovation */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base text-[#1A3A5C]">
                      <span className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-[#C9A84C]" /> {t("analyse.renovation")}
                      </span>
                      <Badge variant="outline" className="font-normal">
                        {t(`level.${result.renovation.level}`)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <StatRow label={t("analyse.budget")} value={fmtShekel(result.renovation.estimatedBudget)} />
                    <p className="pt-3 text-xs text-muted-foreground leading-relaxed">{result.renovation.comment}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Urban potential */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-[#1A3A5C]">
                    <Building2 className="h-4 w-4 text-[#C9A84C]" /> {t("analyse.urbanPotential")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-3 mb-3">
                    <Badge variant="outline" className="font-normal">
                      TAMA 38 : {t(`potential.${result.urbanPotential.tama38}`)}
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      Pinoui Binoui : {t(`potential.${result.urbanPotential.pinouiBinoui}`)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{result.urbanPotential.comment}</p>
                </CardContent>
              </Card>

              {/* Promoter ROI */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base text-[#1A3A5C]">
                    <span className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-[#C9A84C]" /> {t("analyse.promoterRoi")}
                    </span>
                    <Badge variant="outline" className="font-normal">
                      {result.promoterRoi.applicable ? t("analyse.promotionOp") : t("analyse.notApplicable")}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {result.promoterRoi.applicable ? (
                    <>
                      <div className="mb-4 flex items-center gap-3 rounded-lg bg-[#0F2235] p-4 text-white">
                        <span className="text-3xl font-serif" style={{ color: GOLD }}>
                          {fmtPct(result.promoterRoi.grossRoiPct)}
                        </span>
                        <span className="text-xs uppercase tracking-wider text-white/60">
                          {t("analyse.grossRoiEst")}
                        </span>
                      </div>
                      <div className="grid gap-x-6 sm:grid-cols-2">
                        <StatRow label={t("analyse.existingSurface")} value={result.promoterRoi.existingSurface != null ? `${result.promoterRoi.existingSurface} m²` : "—"} />
                        <StatRow label={t("analyse.projectedSurface")} value={result.promoterRoi.projectedSurface != null ? `${result.promoterRoi.projectedSurface} m²` : "—"} />
                        <StatRow label={t("analyse.acquisitionPrice")} value={fmtShekel(result.promoterRoi.acquisitionPrice)} />
                        <StatRow label={t("analyse.constructionCostSqm")} value={fmtShekel(result.promoterRoi.constructionCostPerSqm)} />
                        <StatRow label={t("analyse.constructionCosts")} value={fmtShekel(result.promoterRoi.estimatedConstructionCosts)} />
                        <StatRow label={t("analyse.estimatedRevenue")} value={fmtShekel(result.promoterRoi.estimatedRevenue)} />
                        <StatRow label={t("analyse.buildingPermit")} value={boolT(result.promoterRoi.hasBuildingPermit)} />
                      </div>
                    </>
                  ) : null}
                  <p className="pt-3 text-xs text-muted-foreground leading-relaxed">{result.promoterRoi.comment}</p>
                </CardContent>
              </Card>

              {/* Anomalies */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-[#1A3A5C]">
                    <TriangleAlert className="h-4 w-4 text-[#C9A84C]" /> {t("analyse.anomalies")}
                    <span className="text-sm font-normal text-muted-foreground">({result.anomalies.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {result.anomalies.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("analyse.noAnomalies")}</p>
                  )}
                  {result.anomalies.map((a, i) => {
                    const sevCls = SEVERITY_STYLE[a.severity] ?? SEVERITY_STYLE.low;
                    return (
                      <div key={i} className="rounded-lg border border-black/5 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#1A3A5C]">{a.label}</span>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${sevCls}`}>{t(`severity.${a.severity}`)}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{a.detail}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <p className="text-center text-xs text-muted-foreground">
                {t("analyse.disclaimer")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
