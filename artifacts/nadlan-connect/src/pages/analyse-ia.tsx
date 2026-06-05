import { useState, useEffect, useRef } from "react";
import { usePageMeta } from "@/hooks/use-page-meta";
import {
  useAnalyzeProperty,
  useShamaiChat,
  useCreateReport,
  useGetReport,
  useExtractListing,
  getGetReportQueryKey,
} from "@workspace/api-client-react";
import type {
  AnalyzePropertyResult,
  ShamaiChatMessage,
} from "@workspace/api-client-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "@/components/layout/language-provider";
import type { Language } from "@/lib/i18n";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Scale,
  Landmark,
  Save,
  MessageSquare,
  FileText,
  Send,
  RotateCcw,
  Link2 as LinkIcon,
} from "lucide-react";

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

// Number/currency formatting adapts to the reader's language, mirroring the
// PDF report (see report-pdf.tsx `makeFmt`):
// - FR: ASCII-space thousands, decimal comma, "8,5 %"
// - EN/HE: comma thousands, decimal point, "8.5%"
// On screen we always keep the ₪ glyph (unlike the PDF, where Helvetica has
// no ₪ glyph and FR/EN fall back to "NIS").
function makeFmt(lang: Language) {
  const isFr = lang === "fr";
  const groupSep = isFr ? " " : ",";
  const decSep = isFr ? "," : ".";
  const pctSep = isFr ? " " : "";

  function group(v: number): string {
    return Math.round(v)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, groupSep);
  }
  function fmtShekel(n: number | null | undefined): string {
    if (n === null || n === undefined || !Number.isFinite(n)) return "—";
    return group(n) + " ₪";
  }
  function fmtPct(n: number | null | undefined): string {
    if (n === null || n === undefined || !Number.isFinite(n)) return "—";
    return n.toFixed(1).replace(".", decSep) + pctSep + "%";
  }
  return { fmtShekel, fmtPct };
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-[#1A3A5C]">{value}</span>
    </div>
  );
}

type QuickFields = {
  city: string;
  type: string;
  surface: string;
  floor: string;
  year: string;
  state: string;
  price: string;
  goal: string;
};

const EMPTY_QF: QuickFields = {
  city: "",
  type: "",
  surface: "",
  floor: "",
  year: "",
  state: "",
  price: "",
  goal: "",
};

function parseChatMarkdown(md: string): ShamaiChatMessage[] {
  const out: ShamaiChatMessage[] = [];
  for (const block of md.split("\n\n---\n\n")) {
    const m = block.match(/^\*\*(Q|Shamai)\*\*\n\n([\s\S]*)$/);
    if (m) {
      out.push({
        role: m[1] === "Q" ? "user" : "assistant",
        content: m[2].trim(),
      } as ShamaiChatMessage);
    } else if (out.length > 0) {
      // A block with no role prefix means the divider appeared inside the
      // previous message's Markdown — re-attach it instead of dropping it.
      out[out.length - 1].content += `\n\n---\n\n${block}`;
    }
  }
  return out.filter((x) => x.content.trim().length > 0);
}

function composeFromFields(qf: QuickFields): string {
  const parts: string[] = [];
  if (qf.type) parts.push(qf.type);
  if (qf.city) parts.push(qf.city);
  if (qf.surface) parts.push(`${qf.surface} m²`);
  if (qf.floor) parts.push(`étage ${qf.floor}`);
  if (qf.year) parts.push(`construit ${qf.year}`);
  if (qf.state) parts.push(qf.state);
  if (qf.price) parts.push(`prix ${qf.price}`);
  let s = parts.join(", ");
  if (qf.goal) s += `. Objectif : ${qf.goal}`;
  return s ? s + "." : "";
}

export default function AnalyseIA() {
  const { toast } = useToast();
  const { t, language } = useLanguage();

  usePageMeta({
    title: "Analyse IA Immobilière — Dashboard Investisseur | NadlanConnect",
    description: "Analysez n'importe quel bien immobilier en Israël grâce à l'IA : estimation du prix au m², rendement locatif, budget rénovation, potentiel urbain TAMA38/Pinoui Binoui et score d'investissement personnalisé.",
  });
  const { fmtShekel, fmtPct } = makeFmt(language);
  const { isAuthenticated } = useUserRole();

  const [mode, setMode] = useState<"analysis" | "chat">("analysis");
  const [qf, setQf] = useState<QuickFields>(EMPTY_QF);

  // ---- Analysis mode state ----
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalyzePropertyResult | null>(null);
  const [analyzedText, setAnalyzedText] = useState("");
  const [exporting, setExporting] = useState(false);
  const analyze = useAnalyzeProperty();

  // ---- Import from a listing URL ----
  const [url, setUrl] = useState("");
  const extract = useExtractListing();

  // ---- Chat mode state ----
  const [messages, setMessages] = useState<ShamaiChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatExporting, setChatExporting] = useState(false);
  const chat = useShamaiChat();
  const threadRef = useRef<HTMLDivElement>(null);

  const createReport = useCreateReport();

  // ---- Re-open a saved report (?reportId=) ----
  const [reportId] = useState<number>(() => {
    const id = Number(new URLSearchParams(window.location.search).get("reportId"));
    return Number.isFinite(id) && id > 0 ? id : 0;
  });
  const savedReport = useGetReport(reportId, {
    query: { enabled: reportId > 0, queryKey: getGetReportQueryKey(reportId) },
  });
  const [hydratedId, setHydratedId] = useState(0);
  useEffect(() => {
    const r = savedReport.data;
    if (!r || hydratedId === r.id) return;
    if (r.kind === "analysis" && r.analysis) {
      setMode("analysis");
      setResult(r.analysis);
      setAnalyzedText(r.listingText ?? "");
      setText(r.listingText ?? "");
    } else if (r.kind === "chat" && r.chatMarkdown) {
      setMode("chat");
      setMessages(parseChatMarkdown(r.chatMarkdown));
    }
    setHydratedId(r.id);
  }, [savedReport.data, hydratedId]);

  // ---- URL prefill ----
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const prompt = sp.get("prompt");
    const ville = sp.get("villeLabel") ?? sp.get("ville") ?? "";
    const surface = sp.get("surface") ?? "";
    const etage = sp.get("etage") ?? "";
    const titre = sp.get("titre") ?? "";
    const quartier = sp.get("quartier") ?? "";
    const reqMode = sp.get("mode");
    const wantsChat = reqMode === "chat";
    if (wantsChat) setMode("chat");

    let prefill = "";
    if (prompt) {
      prefill = prompt;
    } else if (ville || surface || titre) {
      const composed = [
        titre,
        [ville, quartier].filter(Boolean).join(" / "),
        surface ? `${surface} m²` : "",
        etage ? `étage ${etage}` : "",
      ]
        .filter(Boolean)
        .join(", ");
      if (composed) prefill = composed + ".";
    }
    if (prefill) {
      if (wantsChat) setChatInput(prefill);
      else setText(prefill);
    }
    if (ville) setQf((q) => ({ ...q, city: [ville, quartier].filter(Boolean).join(" / ") }));
    if (surface) setQf((q) => ({ ...q, surface }));
    if (etage) setQf((q) => ({ ...q, floor: etage }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, chat.isPending]);

  const boolT = (b: boolean | null | undefined): string =>
    b === null || b === undefined ? "—" : t(b ? "common.yes" : "common.no");

  const applyFields = () => {
    const composed = composeFromFields(qf);
    if (!composed) return;
    if (mode === "chat") {
      setChatInput((prev) => (prev ? prev + " " + composed : composed));
    } else {
      setText((prev) => (prev ? prev + "\n" + composed : composed));
    }
  };

  const handleImportUrl = async () => {
    const link = url.trim();
    if (!link) return;
    if (!/^https?:\/\/.+/i.test(link)) {
      toast({ title: t("analyse.urlInvalid"), variant: "destructive" });
      return;
    }
    try {
      const res = await extract.mutateAsync({ data: { url: link, language } });
      setText(res.listingText);
      setResult(null);
      toast({ title: t("analyse.urlSuccess") });
    } catch {
      toast({
        title: t("analyse.urlFailed"),
        description: t("analyse.urlFailedDesc"),
        variant: "destructive",
      });
    }
  };

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
      await downloadAnalysisPdf(analyzedText, result, language);
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

  const handleSaveAnalysis = async () => {
    if (!result) return;
    if (!isAuthenticated) {
      toast({ title: t("analyse.loginToSave"), variant: "destructive" });
      return;
    }
    const title =
      [result.features.neighborhood, result.features.city].filter(Boolean).join(", ") ||
      result.summary.slice(0, 80) ||
      t("analyse.tabAnalysis");
    try {
      await createReport.mutateAsync({
        data: { kind: "analysis", title, listingText: analyzedText, analysis: result },
      });
      toast({ title: t("analyse.saved") });
    } catch {
      toast({ title: t("analyse.saveFailed"), variant: "destructive" });
    }
  };

  const handleSend = async () => {
    const content = chatInput.trim();
    if (content.length < 2) return;
    const next: ShamaiChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setChatInput("");
    try {
      const res = await chat.mutateAsync({ data: { messages: next, language } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch {
      toast({ title: t("analyse.chatFailed"), variant: "destructive" });
      setMessages(next);
    }
  };

  const chatToMarkdown = (): string =>
    messages
      .map(
        (m) =>
          `**${m.role === "user" ? "Q" : "Shamai"}**\n\n${m.content}`,
      )
      .join("\n\n---\n\n");

  const handleSaveChat = async () => {
    if (messages.length === 0) return;
    if (!isAuthenticated) {
      toast({ title: t("analyse.loginToSave"), variant: "destructive" });
      return;
    }
    const firstUser = messages.find((m) => m.role === "user");
    const title = (firstUser?.content ?? t("analyse.tabChat")).slice(0, 80);
    try {
      await createReport.mutateAsync({
        data: { kind: "chat", title, chatMarkdown: chatToMarkdown() },
      });
      toast({ title: t("analyse.saved") });
    } catch {
      toast({ title: t("analyse.saveFailed"), variant: "destructive" });
    }
  };

  const handleExportChat = async () => {
    if (messages.length === 0 || chatExporting) return;
    setChatExporting(true);
    try {
      const { downloadChatPdf } = await import("@/lib/report-pdf");
      const firstUser = messages.find((m) => m.role === "user");
      await downloadChatPdf(
        chatToMarkdown(),
        (firstUser?.content ?? "").slice(0, 80),
        language,
      );
    } catch {
      toast({
        title: t("analyse.pdfFailed"),
        description: t("analyse.pdfFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setChatExporting(false);
    }
  };

  const reco = result ? RECO_STYLE[result.recommendation] ?? RECO_STYLE.orange : null;

  const QuickFieldsCard = (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[#1A3A5C]">{t("analyse.quickFields")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{t("analyse.qfCity")}</Label>
            <Input value={qf.city} onChange={(e) => setQf({ ...qf, city: e.target.value })} placeholder={t("analyse.qfCityPh")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("analyse.qfType")}</Label>
            <Input value={qf.type} onChange={(e) => setQf({ ...qf, type: e.target.value })} placeholder={t("analyse.qfTypePh")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("analyse.qfSurface")}</Label>
            <Input value={qf.surface} onChange={(e) => setQf({ ...qf, surface: e.target.value })} placeholder={t("analyse.qfSurfacePh")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("analyse.qfFloor")}</Label>
            <Input value={qf.floor} onChange={(e) => setQf({ ...qf, floor: e.target.value })} placeholder={t("analyse.qfFloorPh")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("analyse.qfYear")}</Label>
            <Input value={qf.year} onChange={(e) => setQf({ ...qf, year: e.target.value })} placeholder={t("analyse.qfYearPh")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("analyse.qfState")}</Label>
            <Input value={qf.state} onChange={(e) => setQf({ ...qf, state: e.target.value })} placeholder={t("analyse.qfStatePh")} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">{t("analyse.qfPrice")}</Label>
            <Input value={qf.price} onChange={(e) => setQf({ ...qf, price: e.target.value })} placeholder={t("analyse.qfPricePh")} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">{t("analyse.qfGoal")}</Label>
            <Input value={qf.goal} onChange={(e) => setQf({ ...qf, goal: e.target.value })} placeholder={t("analyse.qfGoalPh")} />
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full border-[#1A3A5C]/20 text-[#1A3A5C]" onClick={applyFields}>
          {t("analyse.fillFields")}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0F2235] to-[#1A3A5C] text-white">
        <div className="container py-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-[#C9A84C]">
              <Scale className="h-3.5 w-3.5" /> {t("analyse.shamaiBadge")}
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl">{t("analyse.title")}</h1>
          <p className="mt-2 max-w-2xl text-white/70">{t("analyse.shamaiSubtitle")}</p>

          {/* Mode toggle */}
          <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setMode("analysis")}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                mode === "analysis"
                  ? "bg-gradient-to-r from-[#C9A84C] to-[#E8C96A] text-[#0A1628] shadow-[0_4px_14px_rgba(201,168,76,0.35)]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <FileText className="h-4 w-4" /> {t("analyse.tabAnalysis")}
            </button>
            <button
              onClick={() => setMode("chat")}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                mode === "chat"
                  ? "bg-gradient-to-r from-[#C9A84C] to-[#E8C96A] text-[#0A1628] shadow-[0_4px_14px_rgba(201,168,76,0.35)]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <MessageSquare className="h-4 w-4" /> {t("analyse.tabChat")}
            </button>
          </div>
        </div>
      </div>

      {mode === "analysis" ? (
        <div className="container py-8 grid gap-6 lg:grid-cols-5">
          {/* Input */}
          <div className="lg:col-span-2 space-y-6">
            <div className="sticky top-20 space-y-6">
              {QuickFieldsCard}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#1A3A5C]">{t("analyse.inputTitle")}</CardTitle>
                  <CardDescription>{t("analyse.inputDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-[#1A3A5C]/15 bg-[#1A3A5C]/[0.03] p-3 space-y-2">
                    <Label className="text-xs flex items-center gap-1.5 text-[#1A3A5C]">
                      <LinkIcon className="h-3.5 w-3.5" /> {t("analyse.urlLabel")}
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        type="url"
                        inputMode="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleImportUrl();
                          }
                        }}
                        placeholder={t("analyse.urlPh")}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleImportUrl}
                        disabled={extract.isPending || !url.trim()}
                        className="border-[#1A3A5C]/20 text-[#1A3A5C] shrink-0"
                      >
                        {extract.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("analyse.urlImporting")}
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            {t("analyse.urlBtn")}
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t("analyse.urlHint")}</p>
                  </div>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t("analyse.placeholder")}
                    className="min-h-[200px] resize-y"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setText(EXAMPLE)}
                      className="text-xs text-[#1A3A5C] underline underline-offset-2 hover:text-[#C9A84C]"
                    >
                      {t("analyse.insertExample")}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {text.length} {t("analyse.charCount")}
                    </span>
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyze.isPending}
                    className="w-full border-0 bg-gradient-to-r from-[#C9A84C] to-[#E8C96A] font-bold text-[#0A1628] shadow-[0_6px_18px_rgba(201,168,76,0.38)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(201,168,76,0.5)]"
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
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {!result && !analyze.isPending && (
              <Card className="border-dashed border-[#C9A84C]/30">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                  <div className="relative mb-5">
                    <span className="absolute inset-0 animate-ping rounded-2xl bg-[#C9A84C]/20" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/10">
                      <Gauge className="h-8 w-8 text-[#C9A84C]" />
                    </div>
                  </div>
                  <p className="font-serif text-lg text-[#1A3A5C]">{t("analyse.emptyTitle")}</p>
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
                    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#0A1628] to-[#1A3A5C] p-6 text-white sm:w-48">
                      <span className="font-serif text-5xl text-[#C9A84C]">{result.overallScore}</span>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveAnalysis}
                          disabled={createReport.isPending}
                          className="border-[#1A3A5C]/20 text-[#1A3A5C]"
                        >
                          {createReport.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          {t("analyse.save")}
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

                {/* Shamai appraisal */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-[#1A3A5C]">
                      <Scale className="h-4 w-4 text-[#C9A84C]" /> {t("analyse.appraisal")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="mb-4 rounded-lg bg-[#0F2235] p-4 text-white">
                      <div className="text-xs uppercase tracking-wider text-white/60">{t("analyse.appraisalValue")}</div>
                      <div className="text-2xl font-serif" style={{ color: GOLD }}>
                        {fmtShekel(result.appraisal.estimatedValue)}
                      </div>
                      <div className="mt-1 text-xs text-white/70">
                        {t("analyse.appraisalRange")}: {fmtShekel(result.appraisal.valueLow)} – {fmtShekel(result.appraisal.valueHigh)}
                      </div>
                    </div>
                    <StatRow label={t("analyse.estPriceSqm")} value={fmtShekel(result.appraisal.pricePerSqm)} />
                    <StatRow label={t("analyse.marketPriceSqm")} value={fmtShekel(result.appraisal.marketPricePerSqm)} />
                    <StatRow label={t("analyse.appraisalMethod")} value={result.appraisal.method || "—"} />
                    {result.appraisal.coefficients.length > 0 && (
                      <div className="mt-4">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t("analyse.coefficients")}
                        </div>
                        <div className="overflow-hidden rounded-lg border border-black/5">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-xs text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium">{t("analyse.colFactor")}</th>
                                <th className="px-3 py-2 text-right font-medium">{t("analyse.colCoef")}</th>
                                <th className="px-3 py-2 text-right font-medium">{t("analyse.colImpact")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                              {result.appraisal.coefficients.map((c, i) => (
                                <tr key={i}>
                                  <td className="px-3 py-2 text-[#1A3A5C]">{c.factor}</td>
                                  <td className="px-3 py-2 text-right tabular-nums">
                                    {c.coefficient != null ? c.coefficient.toFixed(2) : "—"}
                                  </td>
                                  <td className="px-3 py-2 text-right text-muted-foreground">{c.impact}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
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

                {/* Fiscal analysis */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-[#1A3A5C]">
                      <Landmark className="h-4 w-4 text-[#C9A84C]" /> {t("analyse.fiscal")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-hidden rounded-lg border border-black/5">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-black/5">
                          {([
                            ["analyse.masRechisha", result.fiscalAnalysis.masRechisha],
                            ["analyse.masShevach", result.fiscalAnalysis.masShevach],
                            ["analyse.heitelHashvacha", result.fiscalAnalysis.heitelHashvacha],
                          ] as const).map(([key, line]) => (
                            <tr key={key}>
                              <td className="px-3 py-2 text-[#1A3A5C]">{t(key)}</td>
                              <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmtShekel(line.amount)}</td>
                              <td className="px-3 py-2 text-right text-muted-foreground">{fmtPct(line.ratePct)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3">
                      <StatRow label={t("analyse.acquisitionTotal")} value={fmtShekel(result.fiscalAnalysis.acquisitionTotalCost)} />
                      <StatRow label={t("analyse.sellerNet")} value={fmtShekel(result.fiscalAnalysis.sellerNetProceeds)} />
                    </div>
                    <p className="pt-3 text-xs text-muted-foreground leading-relaxed">{result.fiscalAnalysis.comment}</p>
                  </CardContent>
                </Card>

                {/* Urban score */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base text-[#1A3A5C]">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#C9A84C]" /> {t("analyse.urbanScore")}
                      </span>
                      <span className="font-serif text-2xl text-[#1A3A5C]">
                        {result.urbanScore.score ?? "—"}
                        <span className="text-sm text-muted-foreground"> {t("analyse.urbanScoreUnit")}</span>
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {result.urbanScore.criteria.length > 0 && (
                      <div className="overflow-hidden rounded-lg border border-black/5">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-xs text-muted-foreground">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">{t("analyse.colCriterion")}</th>
                              <th className="px-3 py-2 text-left font-medium">{t("analyse.colStatus")}</th>
                              <th className="px-3 py-2 text-right font-medium">{t("analyse.colImpact")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5">
                            {result.urbanScore.criteria.map((c, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 text-[#1A3A5C]">{c.label}</td>
                                <td className="px-3 py-2 text-muted-foreground">{c.status}</td>
                                <td className="px-3 py-2 text-right text-muted-foreground">{c.valueImpact}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline" className="font-normal">
                        TAMA 38 : {t(`potential.${result.urbanPotential.tama38}`)}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        Pinoui Binoui : {t(`potential.${result.urbanPotential.pinouiBinoui}`)}
                      </Badge>
                    </div>
                    <p className="pt-3 text-xs text-muted-foreground leading-relaxed">{result.urbanScore.comment}</p>
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

                <p className="text-center text-xs text-muted-foreground">{t("analyse.disclaimer")}</p>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ---- Chat mode ---- */
        <div className="container py-8 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="sticky top-20">{QuickFieldsCard}</div>
          </div>

          <div className="lg:col-span-3">
            <Card className="flex flex-col" style={{ minHeight: "60vh" }}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base text-[#1A3A5C]">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#C9A84C]" /> {t("analyse.chatTitle")}
                  </span>
                  {messages.length > 0 && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={handleExportChat} disabled={chatExporting} className="text-[#1A3A5C]" aria-label={t("analyse.downloadReport")} title={t("analyse.downloadReport")}>
                        {chatExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleSaveChat} disabled={createReport.isPending} className="text-[#1A3A5C]" aria-label={t("analyse.save")} title={t("analyse.save")}>
                        {createReport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="text-[#1A3A5C]" aria-label={t("analyse.reset")} title={t("analyse.reset")}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardTitle>
                <CardDescription>{t("analyse.chatDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div ref={threadRef} className="flex-1 space-y-4 overflow-y-auto" style={{ maxHeight: "50vh" }}>
                  {messages.length === 0 && !chat.isPending && (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                      <Scale className="mb-3 h-10 w-10 text-[#C9A84C]" />
                      <p className="font-medium text-[#1A3A5C]">{t("analyse.chatEmptyTitle")}</p>
                      <p className="mt-1 max-w-sm text-sm">{t("analyse.chatEmptyDesc")}</p>
                      <button
                        type="button"
                        onClick={() => setChatInput(t("analyse.chatExample"))}
                        className="mt-4 text-xs text-[#1A3A5C] underline underline-offset-2 hover:text-[#C9A84C]"
                      >
                        {t("analyse.insertExample")}
                      </button>
                    </div>
                  )}
                  {messages.map((m, i) =>
                    m.role === "user" ? (
                      <div key={i} className="flex justify-end">
                        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-[#1A3A5C] px-4 py-2.5 text-sm text-white">
                          {m.content}
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="flex justify-start">
                        <div className="markdown-body min-w-0 max-w-[90%] overflow-hidden rounded-2xl rounded-bl-sm border border-black/5 bg-white px-4 py-3 text-sm text-[#1A3A5C]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                      </div>
                    ),
                  )}
                  {chat.isPending && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-black/5 bg-white px-4 py-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-[#C9A84C]" />
                        {t("analyse.chatThinking")}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-end gap-2 border-t border-black/5 pt-4">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={t("analyse.chatPlaceholder")}
                    className="min-h-[52px] resize-none"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={chat.isPending || chatInput.trim().length < 2}
                    className="h-[52px] shrink-0 border-0 bg-gradient-to-r from-[#C9A84C] to-[#E8C96A] text-[#0A1628] shadow-[0_4px_14px_rgba(201,168,76,0.35)] transition-all hover:shadow-[0_6px_20px_rgba(201,168,76,0.5)]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            <p className="mt-4 text-center text-xs text-muted-foreground">{t("analyse.disclaimer")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
