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
const STATUS: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  green: {
    label: "FAVORABLE",
    color: "#15803D",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  orange: {
    label: "À SURVEILLER",
    color: "#B45309",
    bg: "#FFF7ED",
    border: "#FED7AA",
  },
  red: { label: "RISQUÉ", color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
};

function num(n: number | null | undefined): number | null {
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}
// Group thousands with a regular ASCII space (Intl uses U+202F, which the
// built-in Helvetica cannot render — it shows up as "/").
function group(v: number): string {
  return Math.round(v)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
// Helvetica (WinAnsi) has no glyph for ₪ (renders as "ª") or for several
// typographic symbols an LLM may emit. Normalise everything to safe text.
function sanitize(t: string | null | undefined): string {
  if (!t) return "";
  return t
    .replace(/\u20AA/g, "NIS") // ₪
    .replace(/\u2248/g, "~") // ≈
    .replace(/[\u2212\u2013\u2014]/g, "-") // − – —
    .replace(/[\u202F\u00A0\u2009\u2007]/g, " ") // narrow / no-break / thin spaces
    .replace(/[\u2018\u2019\u201B]/g, "'") // ' ' ‛
    .replace(/[\u201C\u201D]/g, '"'); // " "
}
function fmtShekel(n: number | null | undefined): string {
  const v = num(n);
  if (v === null) return "—";
  return group(v) + " NIS";
}
function fmtSqm(n: number | null | undefined): string {
  const v = num(n);
  if (v === null) return "—";
  return group(v) + " m²";
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
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  mastTitle: {
    color: "#FFFFFF",
    fontFamily: "DM Serif Display",
    fontSize: 22,
  },
  mastSub: { color: "rgba(255,255,255,0.65)", fontSize: 9, marginTop: 8 },
  section: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
  },
  sectionPlain: { marginBottom: 16 },
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
    letterSpacing: 0.5,
  },
  para: { color: INK, fontSize: 10, lineHeight: 1.55 },
  note: { color: MUTED, fontSize: 9, lineHeight: 1.5, marginTop: 6 },
  bullet: {
    marginTop: 9,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
  },
  bulletTitle: {
    color: NAVY,
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    marginBottom: 3,
  },
  bulletBody: { color: INK, fontSize: 9.5, lineHeight: 1.5 },
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
    borderRadius: 8,
    borderWidth: 1.5,
    padding: 22,
    marginBottom: 8,
  },
  scoreNum: { fontFamily: "DM Serif Display", fontSize: 46 },
  scoreCaption: {
    color: MUTED,
    fontSize: 8,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  statusWord: { fontFamily: "DM Serif Display", fontSize: 22 },
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
  annexText: { color: MUTED, fontSize: 8, lineHeight: 1.45 },
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

function Bullet({ title, body }: { title: string; body: string }) {
  return (
    <View style={s.bullet} wrap={false}>
      <Text style={s.bulletTitle}>{title}</Text>
      <Text style={s.bulletBody}>{body}</Text>
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
          <Text style={s.para}>{sanitize(r.summary)}</Text>
        </View>

        {/* 2. Données extraites */}
        <View style={s.section}>
          <SecHead n={2} title="DONNÉES EXTRAITES" />
          <Row
            label="Localisation"
            value={
              sanitize(
                [r.features.neighborhood, r.features.city]
                  .filter(Boolean)
                  .join(", "),
              ) || "—"
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
            <Text style={s.note}>{sanitize(r.renovation.comment)}</Text>
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

              {(constr !== null ||
                fees !== null ||
                revenue !== null ||
                totalCost !== null ||
                margin !== null ||
                typeof p.hasBuildingPermit === "boolean") && (
              <View style={{ marginTop: 14 }}>
                <Text style={s.bulletTitle}>Détail du calcul</Text>
                {constr !== null && (
                  <Bullet
                    title="Coût de construction habitable"
                    body={
                      proj && p.constructionCostPerSqm != null
                        ? `${group(proj)} m² × ${fmtShekel(p.constructionCostPerSqm)} /m² = ${fmtShekel(constr)}`
                        : fmtShekel(constr)
                    }
                  />
                )}
                {fees !== null && subtotal !== null && (
                  <Bullet
                    title="Honoraires & imprévus (15 %)"
                    body={`${fmtShekel(subtotal)} (acquisition + construction) × 15 % = ${fmtShekel(fees)}`}
                  />
                )}
                {revenue !== null && (
                  <Bullet
                    title="Chiffre d'affaires prévisionnel (revente)"
                    body={
                      proj && resalePerSqm !== null
                        ? `${group(proj)} m² × ${fmtShekel(resalePerSqm)} /m² = ${fmtShekel(revenue)}`
                        : fmtShekel(revenue)
                    }
                  />
                )}
                {totalCost !== null && (
                  <Bullet
                    title="Coût de revient total"
                    body={
                      costPerSqm !== null
                        ? `${fmtShekel(totalCost)} soit ${fmtShekel(costPerSqm)} /m²`
                        : fmtShekel(totalCost)
                    }
                  />
                )}
                {margin !== null && (
                  <Bullet
                    title="Marge brute & rentabilité"
                    body={`${fmtShekel(margin)}${
                      p.grossRoiPct != null
                        ? ` · ROI brut ${fmtPct(p.grossRoiPct)}`
                        : ""
                    }`}
                  />
                )}
                {p.hasBuildingPermit === true && (
                  <Bullet
                    title="Note sur le permis"
                    body="Le permis de construire déjà accordé constitue un avantage majeur : il élimine le risque de refus et fait gagner plusieurs années de procédures, ce qui sécurise l'opération et justifie une prime sur le prix d'acquisition."
                  />
                )}
                {p.hasBuildingPermit === false && (
                  <Bullet
                    title="Note sur le permis"
                    body="Aucun permis de construire n'est accordé à ce stade : prévoir un aléa réglementaire et un délai d'instruction dans le calendrier de l'opération."
                  />
                )}
              </View>
              )}
            </>
          )}
          {!p.applicable && p.comment ? (
            <Text style={s.note}>{sanitize(p.comment)}</Text>
          ) : null}
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
                    <Text style={s.anomalyLabel}>{sanitize(a.label)}</Text>
                    <Text style={[s.anomalyTag, { color: sev.color }]}>
                      {sev.label.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={s.note}>{sanitize(a.detail)}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* 7. Investment score */}
        <View style={s.section} wrap={false}>
          <SecHead n={7} title="INVESTMENT SCORE" />
          <View
            style={[
              s.scoreBox,
              { backgroundColor: status.bg, borderColor: status.border },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <Text style={[s.scoreNum, { color: status.color }]}>
                {r.overallScore}
              </Text>
              <View style={{ marginLeft: 8, marginBottom: 8 }}>
                <Text style={{ color: INK, fontSize: 11 }}>/ 100</Text>
                <Text style={s.scoreCaption}>INVESTMENT SCORE</Text>
              </View>
            </View>
            <Text style={[s.statusWord, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* 8. Conclusion */}
        <View style={s.sectionPlain} wrap={false}>
          <SecHead n={8} title="CONCLUSION" />
          <Row label="Statut" value={status.label} />
          <Text style={[s.para, { marginTop: 4 }]}>
            {sanitize(r.recommendationText)}
          </Text>
        </View>

        {/* 9. Annexe — annonce analysée (on its own page) */}
        <View style={s.sectionPlain} break>
          <SecHead n={9} title="ANNEXE — ANNONCE ANALYSÉE" />
          <View style={s.sourceBox}>
            <Text style={s.annexText}>{sanitize(text)}</Text>
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
