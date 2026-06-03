import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";
import type { AnalyzePropertyResult } from "@workspace/api-client-react";
import dmSerifUrl from "../assets/fonts/DMSerifDisplay-Regular.ttf";

Font.register({ family: "DM Serif Display", src: dmSerifUrl });
Font.registerHyphenationCallback((word) => [word]);

const NAVY_DARK = "#0F2235";
const NAVY = "#1A3A5C";
const GOLD = "#C9A84C";
const INK = "#334155";
const MUTED = "#64748B";
const LINE = "#D8D4CB";

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
const SEVERITY_FR: Record<string, { label: string; color: string }> = {
  low: { label: "Faible", color: MUTED },
  medium: { label: "Moyen", color: "#B45309" },
  high: { label: "Élevé", color: "#B91C1C" },
};
const STATUS: Record<string, { label: string; color: string }> = {
  green: { label: "FAVORABLE", color: "#15803D" },
  orange: { label: "À SURVEILLER", color: "#B45309" },
  red: { label: "RISQUÉ", color: "#B91C1C" },
};

function num(n: number | null | undefined): number | null {
  return typeof n === "number" && !Number.isNaN(n) ? n : null;
}
function fmtShekel(n: number | null | undefined): string {
  const v = num(n);
  if (v === null) return "—";
  return new Intl.NumberFormat("fr-FR").format(Math.round(v)) + " ₪";
}
function fmtSqm(n: number | null | undefined): string {
  const v = num(n);
  if (v === null) return "—";
  return new Intl.NumberFormat("fr-FR").format(Math.round(v)) + " m²";
}
function fmtPct(n: number | null | undefined): string {
  const v = num(n);
  if (v === null) return "—";
  return v.toFixed(1).replace(".", ",") + " %";
}
function boolFr(b: boolean | null | undefined): string {
  if (b === null || b === undefined) return "—";
  return b ? "Oui" : "Non";
}

const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
    backgroundColor: "#FFFFFF",
  },
  masthead: {
    backgroundColor: NAVY_DARK,
    borderRadius: 6,
    paddingVertical: 22,
    paddingHorizontal: 24,
    marginBottom: 26,
  },
  kicker: {
    color: GOLD,
    fontSize: 8,
    letterSpacing: 2,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  mastTitle: {
    color: "#FFFFFF",
    fontFamily: "DM Serif Display",
    fontSize: 22,
  },
  mastSub: { color: "rgba(255,255,255,0.65)", fontSize: 9, marginTop: 8 },
  section: { marginBottom: 18 },
  secHead: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  secNum: {
    backgroundColor: GOLD,
    color: NAVY_DARK,
    fontFamily: "DM Serif Display",
    fontSize: 11,
    width: 20,
    height: 20,
    borderRadius: 3,
    textAlign: "center",
    paddingTop: 3,
    marginRight: 8,
  },
  secTitle: {
    color: NAVY,
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    letterSpacing: 1.2,
  },
  para: { color: INK, fontSize: 10, lineHeight: 1.55 },
  note: { color: MUTED, fontSize: 9, lineHeight: 1.5, marginTop: 6 },
  row: { flexDirection: "row", alignItems: "flex-end", marginBottom: 6 },
  rowLabel: { color: MUTED, fontSize: 9.5 },
  leader: {
    flexGrow: 1,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    borderBottomStyle: "dotted",
    marginHorizontal: 4,
    marginBottom: 2,
  },
  rowValue: { color: NAVY, fontFamily: "Helvetica-Bold", fontSize: 9.5 },
  scoreBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: NAVY_DARK,
    borderRadius: 6,
    padding: 20,
    marginBottom: 8,
  },
  scoreNum: { fontFamily: "DM Serif Display", fontSize: 44, color: GOLD },
  scoreCaption: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 8,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  statusWord: { fontFamily: "DM Serif Display", fontSize: 20 },
  anomaly: {
    borderLeftWidth: 2,
    borderLeftColor: LINE,
    paddingLeft: 10,
    marginBottom: 10,
  },
  anomalyHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  anomalyLabel: { color: NAVY, fontFamily: "Helvetica-Bold", fontSize: 10 },
  anomalyTag: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  sourceBox: {
    backgroundColor: "#F8F7F4",
    borderRadius: 4,
    padding: 12,
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
  },
  footerText: { color: MUTED, fontSize: 8 },
});

function SecHead({ n, title }: { n: number; title: string }) {
  return (
    <View style={s.secHead}>
      <Text style={s.secNum}>{n}</Text>
      <Text style={s.secTitle}>{title}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row} wrap={false}>
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.leader} />
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

function ReportDoc({
  text,
  r,
}: {
  text: string;
  r: AnalyzePropertyResult;
}) {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const status = STATUS[r.recommendation] ?? STATUS.orange;
  const p = r.promoterRoi;
  const acq = num(p.acquisitionPrice);
  const constr = num(p.estimatedConstructionCosts);
  const proj = num(p.projectedSurface);
  const revenue = num(p.estimatedRevenue);
  const subtotal = acq !== null && constr !== null ? acq + constr : null;
  const fees = subtotal !== null ? subtotal * 0.15 : null;
  const totalCost = subtotal !== null ? subtotal * 1.15 : null;
  const margin =
    revenue !== null && totalCost !== null ? revenue - totalCost : null;
  const costPerSqm =
    totalCost !== null && proj ? totalCost / proj : null;
  const resalePerSqm = revenue !== null && proj ? revenue / proj : null;

  return (
    <Document
      title="Rapport Agent IA — NadlanConnect"
      author="NadlanConnect"
    >
      <Page size="A4" style={s.page}>
        {/* Footer (every page) */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            NadlanConnect · Analyse indicative non contractuelle
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>

        {/* Masthead */}
        <View style={s.masthead}>
          <Text style={s.kicker}>RAPPORT AGENT IA · CLAUDE</Text>
          <Text style={s.mastTitle}>NadlanConnect — Analyse de bien</Text>
          <Text style={s.mastSub}>
            Généré le {date} · Claude · Replit AI
          </Text>
        </View>

        {/* 1. Résumé */}
        <View style={s.section}>
          <SecHead n={1} title="RÉSUMÉ DU PROJET" />
          <Text style={s.para}>{r.summary}</Text>
        </View>

        {/* 2. Données extraites */}
        <View style={s.section}>
          <SecHead n={2} title="DONNÉES EXTRAITES" />
          <Row
            label="Localisation"
            value={
              [r.features.neighborhood, r.features.city]
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
          <Row label="Surface" value={fmtSqm(r.features.surface)} />
          <Row
            label="Pièces"
            value={r.features.rooms != null ? String(r.features.rooms) : "—"}
          />
          <Row label="Étage" value={r.features.floor ?? "—"} />
          <Row label="Mamad" value={boolFr(r.features.hasMamad)} />
          <Row label="Ascenseur" value={boolFr(r.features.hasElevator)} />
          <Row label="Parking" value={boolFr(r.features.hasParking)} />
          <Row
            label="Prix affiché"
            value={fmtShekel(r.marketEstimate.listedPrice)}
          />
          {p.applicable && (
            <>
              <Row
                label="Surface existante"
                value={fmtSqm(p.existingSurface)}
              />
              <Row
                label="Surface projetée"
                value={fmtSqm(p.projectedSurface)}
              />
              <Row
                label="Permis de construire"
                value={boolFr(p.hasBuildingPermit)}
              />
            </>
          )}
        </View>

        {/* 3. Hypothèses retenues */}
        <View style={s.section}>
          <SecHead n={3} title="HYPOTHÈSES RETENUES" />
          {p.applicable ? (
            <>
              <Row
                label="Coût construction / m²"
                value={fmtShekel(p.constructionCostPerSqm)}
              />
              <Row label="Honoraires / imprévus" value="15 %" />
              <Row
                label="Prix de revente / m²"
                value={fmtShekel(resalePerSqm)}
              />
            </>
          ) : (
            <>
              <Row
                label="Prix de marché / m²"
                value={fmtShekel(r.marketEstimate.pricePerSqm)}
              />
              <Row
                label="Niveau de travaux"
                value={LEVEL_FR[r.renovation.level] ?? "—"}
              />
              <Row
                label="Potentiel TAMA 38"
                value={POTENTIAL_FR[r.urbanPotential.tama38] ?? "—"}
              />
              <Row
                label="Potentiel Pinoui Binoui"
                value={POTENTIAL_FR[r.urbanPotential.pinouiBinoui] ?? "—"}
              />
            </>
          )}
        </View>

        {/* 4. Estimation des coûts */}
        <View style={s.section}>
          <SecHead n={4} title="ESTIMATION DES COÛTS" />
          {p.applicable ? (
            <>
              <Row label="Prix d'acquisition" value={fmtShekel(acq)} />
              <Row
                label="Coûts de construction"
                value={fmtShekel(constr)}
              />
              <Row
                label="Honoraires / imprévus (15 %)"
                value={fmtShekel(fees)}
              />
              <Row label="Coût total du projet" value={fmtShekel(totalCost)} />
            </>
          ) : (
            <>
              <Row
                label="Niveau de travaux"
                value={LEVEL_FR[r.renovation.level] ?? "—"}
              />
              <Row
                label="Budget travaux estimé"
                value={fmtShekel(r.renovation.estimatedBudget)}
              />
            </>
          )}
          {r.renovation.comment && !p.applicable ? (
            <Text style={s.note}>{r.renovation.comment}</Text>
          ) : null}
        </View>

        {/* 5. Analyse financière */}
        <View style={s.section}>
          <SecHead n={5} title="ANALYSE FINANCIÈRE" />
          <Row
            label={`Estimation de marché (${VERDICT_FR[r.marketEstimate.verdict] ?? "—"})`}
            value={fmtShekel(r.marketEstimate.estimatedValue)}
          />
          <Row
            label="Prix au m² estimé"
            value={fmtShekel(r.marketEstimate.pricePerSqm)}
          />
          <Row
            label="Loyer mensuel estimé"
            value={fmtShekel(r.rentalYield.estimatedMonthlyRent)}
          />
          <Row
            label="Rendement locatif brut"
            value={fmtPct(r.rentalYield.grossYieldPct)}
          />
          <Row
            label="Rendement locatif net"
            value={fmtPct(r.rentalYield.netYieldPct)}
          />
          {p.applicable && (
            <>
              <Row
                label="Chiffre d'affaires estimé"
                value={fmtShekel(revenue)}
              />
              <Row label="Coût total du projet" value={fmtShekel(totalCost)} />
              <Row label="Marge brute" value={fmtShekel(margin)} />
              <Row label="ROI brut estimé" value={fmtPct(p.grossRoiPct)} />
              <Row label="Coût de revient / m²" value={fmtShekel(costPerSqm)} />
            </>
          )}
          {p.comment ? <Text style={s.note}>{p.comment}</Text> : null}
        </View>

        {/* 6. Analyse des risques */}
        <View style={s.section}>
          <SecHead n={6} title="ANALYSE DES RISQUES" />
          {r.anomalies.length === 0 ? (
            <Text style={s.para}>Aucune anomalie détectée.</Text>
          ) : (
            r.anomalies.map((a, i) => {
              const sev = SEVERITY_FR[a.severity] ?? SEVERITY_FR.low;
              return (
                <View key={i} style={s.anomaly} wrap={false}>
                  <View style={s.anomalyHead}>
                    <Text style={s.anomalyLabel}>{a.label}</Text>
                    <Text style={[s.anomalyTag, { color: sev.color }]}>
                      {sev.label.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={s.note}>{a.detail}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* 7. Investment score */}
        <View style={s.section} wrap={false}>
          <SecHead n={7} title="INVESTMENT SCORE" />
          <View style={s.scoreBox}>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <Text style={s.scoreNum}>{r.overallScore}</Text>
              <View style={{ marginLeft: 8, marginBottom: 6 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 11 }}>/ 100</Text>
                <Text style={s.scoreCaption}>INVESTMENT SCORE</Text>
              </View>
            </View>
            <Text style={[s.statusWord, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* 8. Conclusion */}
        <View style={s.section} wrap={false}>
          <SecHead n={8} title="CONCLUSION" />
          <Row label="Statut" value={status.label} />
          <Text style={[s.para, { marginTop: 4 }]}>{r.recommendationText}</Text>
        </View>

        {/* Source */}
        <View style={s.section} wrap={false}>
          <SecHead n={9} title="ANNONCE ANALYSÉE" />
          <View style={s.sourceBox}>
            <Text style={[s.note, { marginTop: 0 }]}>{text}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadAnalysisPdf(
  text: string,
  result: AnalyzePropertyResult,
): Promise<void> {
  const blob = await pdf(<ReportDoc text={text} r={result} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport-nadlanconnect-${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
