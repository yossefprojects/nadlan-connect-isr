import { useState } from "react";
import { useAnalyzeProperty } from "@workspace/api-client-react";
import type { AnalyzePropertyResult } from "@workspace/api-client-react";
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
} from "lucide-react";

const NAVY = "#1A3A5C";
const GOLD = "#C9A84C";

const EXAMPLE = `Appartement 4 pièces à vendre, Florentin, Tel Aviv. 92 m², 3ème étage avec ascenseur. Mamad, balcon, rénové récemment. Proche de la gare. Prix: 3,200,000 ₪. Possibilité de location 8500₪/mois.`;

const RECO: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  green: { label: "Opportunité", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  orange: { label: "Prudence", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  red: { label: "À éviter", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const SEVERITY: Record<string, { label: string; cls: string }> = {
  low: { label: "Faible", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  medium: { label: "Moyen", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  high: { label: "Élevé", cls: "bg-red-100 text-red-800 border-red-200" },
};

const VERDICT_FR: Record<string, string> = {
  underpriced: "Sous-évalué",
  fair: "Prix de marché",
  overpriced: "Surévalué",
  unknown: "Indéterminé",
};

const LEVEL_FR: Record<string, string> = {
  none: "Aucun travaux",
  refresh: "Rafraîchissement",
  renovation: "Rénovation",
  unknown: "Indéterminé",
};

const POTENTIAL_FR: Record<string, string> = {
  yes: "Oui",
  no: "Non",
  possible: "Possible",
  unknown: "Indéterminé",
};

function fmtShekel(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " ₪";
}

function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toFixed(1).replace(".", ",") + " %";
}

function boolFr(b: boolean | null | undefined): string {
  if (b === null || b === undefined) return "—";
  return b ? "Oui" : "Non";
}

function buildReport(text: string, r: AnalyzePropertyResult): string {
  const lines: string[] = [];
  lines.push("RAPPORT D'ANALYSE — NadlanConnect");
  lines.push("Généré le " + new Date().toLocaleString("fr-FR"));
  lines.push("=".repeat(60));
  lines.push("");
  lines.push("SCORE D'INVESTISSEMENT : " + r.overallScore + "/100");
  lines.push("RECOMMANDATION : " + (RECO[r.recommendation]?.label ?? r.recommendation));
  lines.push(r.recommendationText);
  lines.push("");
  lines.push("RÉSUMÉ");
  lines.push(r.summary);
  lines.push("");
  lines.push("CARACTÉRISTIQUES");
  lines.push("- Surface : " + (r.features.surface ?? "—") + " m²");
  lines.push("- Pièces : " + (r.features.rooms ?? "—"));
  lines.push("- Étage : " + (r.features.floor ?? "—"));
  lines.push("- Mamad : " + boolFr(r.features.hasMamad));
  lines.push("- Ascenseur : " + boolFr(r.features.hasElevator));
  lines.push("- Parking : " + boolFr(r.features.hasParking));
  lines.push("- Ville : " + (r.features.city ?? "—"));
  lines.push("- Quartier : " + (r.features.neighborhood ?? "—"));
  lines.push("");
  lines.push("ESTIMATION DE MARCHÉ — " + (VERDICT_FR[r.marketEstimate.verdict] ?? ""));
  lines.push("- Prix au m² estimé : " + fmtShekel(r.marketEstimate.pricePerSqm));
  lines.push("- Valeur estimée : " + fmtShekel(r.marketEstimate.estimatedValue));
  lines.push("- Prix affiché : " + fmtShekel(r.marketEstimate.listedPrice));
  lines.push(r.marketEstimate.comment);
  lines.push("");
  lines.push("RENTABILITÉ LOCATIVE");
  lines.push("- Loyer mensuel estimé : " + fmtShekel(r.rentalYield.estimatedMonthlyRent));
  lines.push("- Rendement brut : " + fmtPct(r.rentalYield.grossYieldPct));
  lines.push("- Rendement net : " + fmtPct(r.rentalYield.netYieldPct));
  lines.push(r.rentalYield.comment);
  lines.push("");
  lines.push("TRAVAUX — " + (LEVEL_FR[r.renovation.level] ?? ""));
  lines.push("- Budget estimé : " + fmtShekel(r.renovation.estimatedBudget));
  lines.push(r.renovation.comment);
  lines.push("");
  lines.push("POTENTIEL URBANISME");
  lines.push("- TAMA 38 : " + (POTENTIAL_FR[r.urbanPotential.tama38] ?? ""));
  lines.push("- Pinoui Binoui : " + (POTENTIAL_FR[r.urbanPotential.pinouiBinoui] ?? ""));
  lines.push(r.urbanPotential.comment);
  lines.push("");
  lines.push("ANOMALIES DÉTECTÉES (" + r.anomalies.length + ")");
  if (r.anomalies.length === 0) {
    lines.push("- Aucune anomalie détectée.");
  } else {
    for (const a of r.anomalies) {
      lines.push("- [" + (SEVERITY[a.severity]?.label ?? a.severity) + "] " + a.label);
      lines.push("  " + a.detail);
    }
  }
  lines.push("");
  lines.push("=".repeat(60));
  lines.push("ANNONCE ANALYSÉE");
  lines.push(text);
  lines.push("");
  lines.push("Estimations indicatives, non contractuelles. © NadlanConnect");
  return lines.join("\n");
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
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalyzePropertyResult | null>(null);
  const analyze = useAnalyzeProperty();

  const handleAnalyze = async () => {
    if (text.trim().length < 10) {
      toast({ title: "Veuillez coller une annonce (au moins 10 caractères).", variant: "destructive" });
      return;
    }
    setResult(null);
    try {
      const res = await analyze.mutateAsync({ data: { listingText: text.trim() } });
      setResult(res);
    } catch {
      toast({
        title: "L'analyse a échoué.",
        description: "Le service IA est momentanément indisponible. Réessayez dans un instant.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (!result) return;
    const report = buildReport(text.trim(), result);
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analyse-nadlanconnect-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reco = result ? RECO[result.recommendation] ?? RECO.orange : null;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0F2235] to-[#1A3A5C] text-white">
        <div className="container py-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-[#C9A84C]">
              <Sparkles className="h-3.5 w-3.5" /> ANALYSE IA · CLAUDE
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl">Dashboard Investisseur</h1>
          <p className="mt-2 max-w-2xl text-white/70">
            Collez une annonce (Yad2, Madlan, WhatsApp…) et obtenez une estimation, une détection
            d'anomalies, une simulation de rentabilité et le potentiel urbanistique du bien en Israël.
          </p>
        </div>
      </div>

      <div className="container py-8 grid gap-6 lg:grid-cols-5">
        {/* Input */}
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-[#1A3A5C]">L'annonce à analyser</CardTitle>
              <CardDescription>Copiez-collez le texte complet de l'annonce.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex : Appartement 4 pièces, Florentin Tel Aviv, 92 m², 3ème étage, ascenseur, Mamad, 3 200 000 ₪…"
                className="min-h-[220px] resize-y"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setText(EXAMPLE)}
                  className="text-xs text-[#1A3A5C] underline underline-offset-2 hover:text-[#C9A84C]"
                >
                  Insérer un exemple
                </button>
                <span className="text-xs text-muted-foreground">{text.length} caractères</span>
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
                    Analyse en cours…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyser le bien
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
                <p className="font-medium text-[#1A3A5C]">Aucune analyse pour le moment</p>
                <p className="text-sm">Collez une annonce et lancez l'analyse pour voir les résultats ici.</p>
              </CardContent>
            </Card>
          )}

          {analyze.isPending && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 className="h-10 w-10 mb-3 animate-spin text-[#C9A84C]" />
                <p className="font-medium text-[#1A3A5C]">Claude analyse l'annonce…</p>
                <p className="text-sm text-muted-foreground">Cela prend généralement quelques secondes.</p>
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
                    <span className="text-xs uppercase tracking-wider text-white/60">Score / 100</span>
                  </div>
                  <div className="flex-1 p-6">
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${reco.bg} ${reco.text}`}>
                      <span className={`h-2 w-2 rounded-full ${reco.dot}`} />
                      {reco.label}
                    </div>
                    <p className="mt-3 text-sm text-[#1A3A5C]">{result.recommendationText}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        className="border-[#1A3A5C]/20 text-[#1A3A5C]"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger le rapport
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-[#1A3A5C]">Résumé</CardTitle>
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
                      <Home className="h-4 w-4 text-[#C9A84C]" /> Caractéristiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <StatRow label="Surface" value={result.features.surface ? `${result.features.surface} m²` : "—"} />
                    <StatRow label="Pièces" value={result.features.rooms?.toString() ?? "—"} />
                    <StatRow label="Étage" value={result.features.floor ?? "—"} />
                    <StatRow label="Mamad" value={boolFr(result.features.hasMamad)} />
                    <StatRow label="Ascenseur" value={boolFr(result.features.hasElevator)} />
                    <StatRow label="Parking" value={boolFr(result.features.hasParking)} />
                    <StatRow label="Localisation" value={[result.features.neighborhood, result.features.city].filter(Boolean).join(", ") || "—"} />
                  </CardContent>
                </Card>

                {/* Market */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base text-[#1A3A5C]">
                      <span className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-[#C9A84C]" /> Estimation de marché
                      </span>
                      <Badge variant="outline" className="font-normal">
                        {VERDICT_FR[result.marketEstimate.verdict]}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <StatRow label="Prix au m² estimé" value={fmtShekel(result.marketEstimate.pricePerSqm)} />
                    <StatRow label="Valeur estimée" value={fmtShekel(result.marketEstimate.estimatedValue)} />
                    <StatRow label="Prix affiché" value={fmtShekel(result.marketEstimate.listedPrice)} />
                    <p className="pt-3 text-xs text-muted-foreground leading-relaxed">{result.marketEstimate.comment}</p>
                  </CardContent>
                </Card>

                {/* Rental yield */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-[#1A3A5C]">
                      <TrendingUp className="h-4 w-4 text-[#C9A84C]" /> Rentabilité locative
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <StatRow label="Loyer mensuel estimé" value={fmtShekel(result.rentalYield.estimatedMonthlyRent)} />
                    <StatRow label="Rendement brut" value={fmtPct(result.rentalYield.grossYieldPct)} />
                    <StatRow label="Rendement net" value={fmtPct(result.rentalYield.netYieldPct)} />
                    <p className="pt-3 text-xs text-muted-foreground leading-relaxed">{result.rentalYield.comment}</p>
                  </CardContent>
                </Card>

                {/* Renovation */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base text-[#1A3A5C]">
                      <span className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-[#C9A84C]" /> Travaux
                      </span>
                      <Badge variant="outline" className="font-normal">
                        {LEVEL_FR[result.renovation.level]}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <StatRow label="Budget estimé" value={fmtShekel(result.renovation.estimatedBudget)} />
                    <p className="pt-3 text-xs text-muted-foreground leading-relaxed">{result.renovation.comment}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Urban potential */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-[#1A3A5C]">
                    <Building2 className="h-4 w-4 text-[#C9A84C]" /> Potentiel urbanistique
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-3 mb-3">
                    <Badge variant="outline" className="font-normal">
                      TAMA 38 : {POTENTIAL_FR[result.urbanPotential.tama38]}
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      Pinoui Binoui : {POTENTIAL_FR[result.urbanPotential.pinouiBinoui]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{result.urbanPotential.comment}</p>
                </CardContent>
              </Card>

              {/* Anomalies */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-[#1A3A5C]">
                    <TriangleAlert className="h-4 w-4 text-[#C9A84C]" /> Anomalies détectées
                    <span className="text-sm font-normal text-muted-foreground">({result.anomalies.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {result.anomalies.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune anomalie détectée.</p>
                  )}
                  {result.anomalies.map((a, i) => {
                    const sev = SEVERITY[a.severity] ?? SEVERITY.low;
                    return (
                      <div key={i} className="rounded-lg border border-black/5 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#1A3A5C]">{a.label}</span>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${sev.cls}`}>{sev.label}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{a.detail}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <p className="text-center text-xs text-muted-foreground">
                Estimations générées par IA, indicatives et non contractuelles.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
