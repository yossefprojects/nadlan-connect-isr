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
import { type Language, localeForLanguage, translate } from "./i18n";
import dmSerifUrl from "../assets/fonts/DMSerifDisplay-Regular.ttf";
import heeboRegularUrl from "../assets/fonts/Heebo-Regular.ttf";
import heeboBoldUrl from "../assets/fonts/Heebo-Bold.ttf";

Font.register({ family: "DM Serif Display", src: dmSerifUrl });
// Helvetica (built-in) and DM Serif Display have no Hebrew glyphs, so a
// Hebrew-capable static TTF (Latin + Hebrew + digits) is registered for
// Hebrew reports. Heebo also covers the Latin numbers/units in the report.
Font.register({ family: "Heebo", src: heeboRegularUrl });
Font.register({ family: "Heebo-Bold", src: heeboBoldUrl });
Font.registerHyphenationCallback((word) => [word]);

const NAVY_DARK = "#0E1B2A";
const NAVY = "#1C3049";
const GOLD = "#0F7B6C";
const INK = "#334155";
const MUTED = "#64748B";
const LINE = "#D8D4CB";

type T = (key: string) => string;

type Fonts = { body: string; bold: string; serif: string };

function fontsFor(lang: Language): Fonts {
  if (lang === "he") {
    return { body: "Heebo", bold: "Heebo-Bold", serif: "Heebo-Bold" };
  }
  return { body: "Helvetica", bold: "Helvetica-Bold", serif: "DM Serif Display" };
}

const SEVERITY_COLOR: Record<string, string> = {
  low: MUTED,
  medium: "#B45309",
  high: "#B91C1C",
};
const STATUS_COLOR: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  green: { color: "#15803D", bg: "#ECFDF5", border: "#A7F3D0" },
  orange: { color: "#B45309", bg: "#FFF7ED", border: "#FED7AA" },
  red: { color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
};

function num(n: number | null | undefined): number | null {
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}
// Helvetica (WinAnsi) has no glyph for ₪ (renders as "ª") or for several
// typographic symbols an LLM may emit. Normalise everything to safe text.
// `keepShekel` is set for Hebrew reports, whose Heebo font can render ₪.
function sanitizeText(
  t: string | null | undefined,
  keepShekel = false,
): string {
  if (!t) return "";
  let s = t;
  if (!keepShekel) s = s.replace(/\u20AA/g, "NIS"); // ₪ → NIS (Helvetica path)
  return s
    .replace(/\u2248/g, "~") // ≈
    .replace(/[\u2212\u2013\u2014]/g, "-") // − – —
    .replace(/[\u202F\u00A0\u2009\u2007]/g, " ") // narrow / no-break / thin spaces
    .replace(/[\u2018\u2019\u201B]/g, "'") // ' ' ‛
    .replace(/[\u201C\u201D]/g, '"'); // " "
}

// Number/currency formatting adapts to the reader's language:
// - FR: ASCII-space thousands, decimal comma, "8,5 %", "NIS"
//       (Intl's fr-FR U+202F separator has no Helvetica glyph → renders as "/")
// - EN: comma thousands (WinAnsi-safe), decimal point, "8.5%", "NIS"
// - HE: comma thousands, decimal point, "8.5%", ₪ (Heebo can render it)
function makeFmt(lang: Language) {
  const isFr = lang === "fr";
  const groupSep = isFr ? " " : ",";
  const decSep = isFr ? "," : ".";
  const pctSep = isFr ? " " : ""; // FR puts a space before "%"
  const currency = lang === "he" ? "\u20AA" : "NIS";

  function group(v: number): string {
    return Math.round(v)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, groupSep);
  }
  function dec(n: number, digits: number): string {
    return n.toFixed(digits).replace(".", decSep);
  }
  function fmtShekel(n: number | null | undefined): string {
    const v = num(n);
    if (v === null) return "—";
    return group(v) + " " + currency;
  }
  function fmtSqm(n: number | null | undefined): string {
    const v = num(n);
    if (v === null) return "—";
    return group(v) + " m²";
  }
  function fmtPct(n: number | null | undefined): string {
    const v = num(n);
    if (v === null) return "—";
    return dec(v, 1) + pctSep + "%";
  }
  function fmtPctWhole(n: number): string {
    return String(n) + pctSep + "%";
  }
  return { group, dec, fmtShekel, fmtSqm, fmtPct, fmtPctWhole };
}
function boolT(b: boolean | null | undefined, t: T): string {
  if (b === null || b === undefined) return "—";
  return b ? t("common.yes") : t("common.no");
}

const HEBREW_RE = /[\u0590-\u05FF]/;
// Numeric / Latin value runs (amounts, ranges, "8.5%", "m²", "/ 100",
// "(…)") must read left-to-right even inside an RTL Hebrew report; otherwise
// the bidi algorithm mirrors parentheses and reorders the segments around a
// neutral separator. Values that actually contain Hebrew keep the inherited
// base direction. In FR/EN reports the page is already LTR, so forcing LTR
// here is a no-op and the layout is unchanged.
function ltrIfNumeric(s: string): { direction?: "ltr" } {
  return HEBREW_RE.test(s) ? {} : { direction: "ltr" };
}

function makeStyles(f: Fonts, rtl: boolean) {
  return StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 64,
      paddingHorizontal: 48,
      fontFamily: f.body,
      fontSize: 10,
      color: INK,
      backgroundColor: "#FFFFFF",
      direction: rtl ? "rtl" : "ltr",
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
      fontFamily: f.bold,
      marginBottom: 8,
    },
    mastTitle: {
      color: "#FFFFFF",
      fontFamily: f.serif,
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
      fontFamily: f.serif,
      fontSize: 11,
      width: 20,
      height: 20,
      borderRadius: 3,
      textAlign: "center",
      paddingTop: 3,
      ...(rtl ? { marginLeft: 8 } : { marginRight: 8 }),
    },
    secTitle: {
      color: NAVY,
      fontFamily: f.bold,
      fontSize: 11,
      letterSpacing: 0.5,
    },
    para: { color: INK, fontSize: 10, lineHeight: 1.55 },
    note: { color: MUTED, fontSize: 9, lineHeight: 1.5, marginTop: 6 },
    bullet: {
      marginTop: 9,
      ...(rtl
        ? { paddingRight: 10, borderRightWidth: 2, borderRightColor: GOLD }
        : { paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: GOLD }),
    },
    bulletTitle: {
      color: NAVY,
      fontFamily: f.bold,
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
    rowValue: { color: NAVY, fontFamily: f.bold, fontSize: 9.5 },
    scoreBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 8,
      borderWidth: 1.5,
      padding: 22,
      marginBottom: 8,
    },
    scoreNum: { fontFamily: f.serif, fontSize: 46 },
    scoreCaption: {
      color: MUTED,
      fontSize: 8,
      letterSpacing: 1.5,
      marginTop: 2,
    },
    statusWord: { fontFamily: f.serif, fontSize: 22 },
    anomaly: {
      marginBottom: 10,
      ...(rtl
        ? { paddingRight: 10, borderRightWidth: 2, borderRightColor: LINE }
        : { paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: LINE }),
    },
    anomalyHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    anomalyLabel: { color: NAVY, fontFamily: f.bold, fontSize: 10 },
    anomalyTag: { fontSize: 8, fontFamily: f.bold },
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
}

type Styles = ReturnType<typeof makeStyles>;

function SecHead({ n, title, st }: { n: number; title: string; st: Styles }) {
  return (
    <View style={st.secHead}>
      <Text style={st.secNum}>{n}</Text>
      <Text style={st.secTitle}>{title}</Text>
    </View>
  );
}

function Row({
  label,
  value,
  st,
}: {
  label: string;
  value: string;
  st: Styles;
}) {
  return (
    <View style={st.row} wrap={false}>
      <Text style={st.rowLabel}>{label}</Text>
      <View style={st.leader} />
      <Text style={[st.rowValue, ltrIfNumeric(value)]}>{value}</Text>
    </View>
  );
}

function Bullet({
  title,
  body,
  st,
}: {
  title: string;
  body: string;
  st: Styles;
}) {
  return (
    <View style={st.bullet} wrap={false}>
      <Text style={st.bulletTitle}>{title}</Text>
      <Text style={[st.bulletBody, ltrIfNumeric(body)]}>{body}</Text>
    </View>
  );
}

export function ReportDoc({
  text,
  r,
  language,
}: {
  text: string;
  r: AnalyzePropertyResult;
  language: Language;
}) {
  const t: T = (key) => translate(language, key);
  const locale = localeForLanguage(language);
  const rtl = language === "he";
  const st = makeStyles(fontsFor(language), rtl);
  const { group, dec, fmtShekel, fmtSqm, fmtPct, fmtPctWhole } =
    makeFmt(language);
  const keepShekel = language === "he";
  const sanitize = (x: string | null | undefined) =>
    sanitizeText(x, keepShekel);
  const date = new Date().toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const statusColor = STATUS_COLOR[r.recommendation] ?? STATUS_COLOR.orange;
  const statusLabel =
    t(`report.status.${r.recommendation}`) ?? t("report.status.orange");
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
  const costPerSqm = totalCost !== null && proj ? totalCost / proj : null;
  const resalePerSqm = revenue !== null && proj ? revenue / proj : null;

  const verdictLabel =
    t(`report.verdict.${r.marketEstimate.verdict}`) ??
    t("report.verdict.unknown");

  return (
    <Document title={t("report.docTitle")} author="NadlanConnect">
      <Page size="A4" style={st.page}>
        {/* Footer (every page) */}
        <View style={st.footer} fixed>
          <Text style={st.footerText}>
            NadlanConnect · {t("report.footerDisclaimer")}
          </Text>
          <Text
            style={st.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>

        {/* Masthead */}
        <View style={st.masthead}>
          <Text style={st.kicker}>{t("report.kicker")}</Text>
          <Text style={st.mastTitle}>{t("report.mastTitle")}</Text>
          <Text style={st.mastSub}>
            {t("report.generatedOn")} {date} · Claude · Replit AI
          </Text>
        </View>

        {/* 1. Résumé */}
        <View style={st.section}>
          <SecHead n={1} title={t("report.sec.summary")} st={st} />
          <Text style={st.para}>{sanitize(r.summary)}</Text>
        </View>

        {/* 2. Évaluation Shamai */}
        <View style={st.section}>
          <SecHead n={2} title={t("report.sec.appraisal")} st={st} />
          <Row
            label={t("report.row.estimatedMarketValue")}
            value={fmtShekel(r.appraisal.estimatedValue)}
            st={st}
          />
          <Row
            label={t("report.row.range")}
            value={`${fmtShekel(r.appraisal.valueLow)} - ${fmtShekel(r.appraisal.valueHigh)}`}
            st={st}
          />
          <Row
            label={t("report.row.pricePerSqmEstimated")}
            value={fmtShekel(r.appraisal.pricePerSqm)}
            st={st}
          />
          <Row
            label={t("report.row.marketPricePerSqm")}
            value={fmtShekel(r.appraisal.marketPricePerSqm)}
            st={st}
          />
          <Row
            label={t("report.row.mainMethod")}
            value={sanitize(r.appraisal.method) || "—"}
            st={st}
          />
          {r.appraisal.coefficients.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={st.bulletTitle}>
                {t("report.row.coefficientBreakdown")}
              </Text>
              {r.appraisal.coefficients.map((c, i) => (
                <Row
                  key={i}
                  label={sanitize(c.factor)}
                  value={`${c.coefficient != null ? dec(c.coefficient, 2) : "—"}  ·  ${sanitize(c.impact)}`}
                  st={st}
                />
              ))}
            </View>
          )}
        </View>

        {/* 3. Données extraites */}
        <View style={st.section}>
          <SecHead n={3} title={t("report.sec.extracted")} st={st} />
          <Row
            label={t("report.row.location")}
            value={
              sanitize(
                [r.features.neighborhood, r.features.city]
                  .filter(Boolean)
                  .join(", "),
              ) || "—"
            }
            st={st}
          />
          <Row
            label={t("report.row.surface")}
            value={fmtSqm(r.features.surface)}
            st={st}
          />
          <Row
            label={t("report.row.rooms")}
            value={r.features.rooms != null ? String(r.features.rooms) : "—"}
            st={st}
          />
          <Row label={t("report.row.floor")} value={r.features.floor ?? "—"} st={st} />
          <Row
            label={t("report.row.mamad")}
            value={boolT(r.features.hasMamad, t)}
            st={st}
          />
          <Row
            label={t("report.row.elevator")}
            value={boolT(r.features.hasElevator, t)}
            st={st}
          />
          <Row
            label={t("report.row.parking")}
            value={boolT(r.features.hasParking, t)}
            st={st}
          />
          <Row
            label={t("report.row.listedPrice")}
            value={fmtShekel(r.marketEstimate.listedPrice)}
            st={st}
          />
          {p.applicable && (
            <>
              <Row
                label={t("report.row.existingSurface")}
                value={fmtSqm(p.existingSurface)}
                st={st}
              />
              <Row
                label={t("report.row.projectedSurface")}
                value={fmtSqm(p.projectedSurface)}
                st={st}
              />
              <Row
                label={t("report.row.buildingPermit")}
                value={boolT(p.hasBuildingPermit, t)}
                st={st}
              />
            </>
          )}
        </View>

        {/* 4. Hypothèses retenues */}
        <View style={st.section}>
          <SecHead n={4} title={t("report.sec.assumptions")} st={st} />
          {p.applicable ? (
            <>
              <Row
                label={t("report.row.constructionCostPerSqm")}
                value={fmtShekel(p.constructionCostPerSqm)}
                st={st}
              />
              <Row
                label={t("report.row.feesContingency")}
                value={fmtPctWhole(15)}
                st={st}
              />
              <Row
                label={t("report.row.resalePricePerSqm")}
                value={fmtShekel(resalePerSqm)}
                st={st}
              />
            </>
          ) : (
            <>
              <Row
                label={t("report.row.marketPricePerSqmShort")}
                value={fmtShekel(r.marketEstimate.pricePerSqm)}
                st={st}
              />
              <Row
                label={t("report.row.renovationLevel")}
                value={t(`report.level.${r.renovation.level}`)}
                st={st}
              />
              <Row
                label={t("report.row.tama38Potential")}
                value={t(`report.potential.${r.urbanPotential.tama38}`)}
                st={st}
              />
              <Row
                label={t("report.row.pinouiBinouiPotential")}
                value={t(`report.potential.${r.urbanPotential.pinouiBinoui}`)}
                st={st}
              />
            </>
          )}
        </View>

        {/* 5. Estimation des coûts */}
        <View style={st.section}>
          <SecHead n={5} title={t("report.sec.costs")} st={st} />
          {p.applicable ? (
            <>
              <Row
                label={t("report.row.acquisitionPrice")}
                value={fmtShekel(acq)}
                st={st}
              />
              <Row
                label={t("report.row.constructionCosts")}
                value={fmtShekel(constr)}
                st={st}
              />
              <Row
                label={t("report.row.feesContingencyPct")}
                value={fmtShekel(fees)}
                st={st}
              />
              <Row
                label={t("report.row.totalProjectCost")}
                value={fmtShekel(totalCost)}
                st={st}
              />
            </>
          ) : (
            <>
              <Row
                label={t("report.row.renovationLevel")}
                value={t(`report.level.${r.renovation.level}`)}
                st={st}
              />
              <Row
                label={t("report.row.estimatedRenovationBudget")}
                value={fmtShekel(r.renovation.estimatedBudget)}
                st={st}
              />
            </>
          )}
          {r.renovation.comment && !p.applicable ? (
            <Text style={st.note}>{sanitize(r.renovation.comment)}</Text>
          ) : null}
        </View>

        {/* 6. Analyse financière */}
        <View style={st.section}>
          <SecHead n={6} title={t("report.sec.financial")} st={st} />
          <Row
            label={`${t("report.row.marketEstimate")} (${verdictLabel})`}
            value={fmtShekel(r.marketEstimate.estimatedValue)}
            st={st}
          />
          <Row
            label={t("report.row.pricePerSqmEst")}
            value={fmtShekel(r.marketEstimate.pricePerSqm)}
            st={st}
          />
          <Row
            label={t("report.row.estimatedMonthlyRent")}
            value={fmtShekel(r.rentalYield.estimatedMonthlyRent)}
            st={st}
          />
          <Row
            label={t("report.row.grossYield")}
            value={fmtPct(r.rentalYield.grossYieldPct)}
            st={st}
          />
          <Row
            label={t("report.row.netYield")}
            value={fmtPct(r.rentalYield.netYieldPct)}
            st={st}
          />
          {p.applicable && (
            <>
              <Row
                label={t("report.row.estimatedRevenue")}
                value={fmtShekel(revenue)}
                st={st}
              />
              <Row
                label={t("report.row.totalProjectCost")}
                value={fmtShekel(totalCost)}
                st={st}
              />
              <Row
                label={t("report.row.grossMargin")}
                value={fmtShekel(margin)}
                st={st}
              />
              <Row
                label={t("report.row.grossRoi")}
                value={fmtPct(p.grossRoiPct)}
                st={st}
              />
              <Row
                label={t("report.row.costPerSqm")}
                value={fmtShekel(costPerSqm)}
                st={st}
              />

              {(constr !== null ||
                fees !== null ||
                revenue !== null ||
                totalCost !== null ||
                margin !== null ||
                typeof p.hasBuildingPermit === "boolean") && (
                <View style={{ marginTop: 14 }}>
                  <Text style={st.bulletTitle}>{t("report.row.calcDetail")}</Text>
                  {constr !== null && (
                    <Bullet
                      title={t("report.bullet.habitableConstruction")}
                      body={
                        proj && p.constructionCostPerSqm != null
                          ? `${group(proj)} m² × ${fmtShekel(p.constructionCostPerSqm)} /m² = ${fmtShekel(constr)}`
                          : fmtShekel(constr)
                      }
                      st={st}
                    />
                  )}
                  {fees !== null && subtotal !== null && (
                    <Bullet
                      title={t("report.bullet.feesContingency")}
                      body={`${fmtShekel(subtotal)} ${t("report.calc.acqPlusConstruction")} × ${fmtPctWhole(15)} = ${fmtShekel(fees)}`}
                      st={st}
                    />
                  )}
                  {revenue !== null && (
                    <Bullet
                      title={t("report.bullet.projectedRevenue")}
                      body={
                        proj && resalePerSqm !== null
                          ? `${group(proj)} m² × ${fmtShekel(resalePerSqm)} /m² = ${fmtShekel(revenue)}`
                          : fmtShekel(revenue)
                      }
                      st={st}
                    />
                  )}
                  {totalCost !== null && (
                    <Bullet
                      title={t("report.bullet.totalCostPrice")}
                      body={
                        costPerSqm !== null
                          ? `${fmtShekel(totalCost)} ${t("report.calc.ie")} ${fmtShekel(costPerSqm)} /m²`
                          : fmtShekel(totalCost)
                      }
                      st={st}
                    />
                  )}
                  {margin !== null && (
                    <Bullet
                      title={t("report.bullet.marginProfitability")}
                      body={`${fmtShekel(margin)}${
                        p.grossRoiPct != null
                          ? ` · ${t("report.calc.grossRoiInline")} ${fmtPct(p.grossRoiPct)}`
                          : ""
                      }`}
                      st={st}
                    />
                  )}
                  {p.hasBuildingPermit === true && (
                    <Bullet
                      title={t("report.bullet.permitNote")}
                      body={t("report.bullet.permitYesBody")}
                      st={st}
                    />
                  )}
                  {p.hasBuildingPermit === false && (
                    <Bullet
                      title={t("report.bullet.permitNote")}
                      body={t("report.bullet.permitNoBody")}
                      st={st}
                    />
                  )}
                </View>
              )}
            </>
          )}
          {!p.applicable && p.comment ? (
            <Text style={st.note}>{sanitize(p.comment)}</Text>
          ) : null}
        </View>

        {/* 7. Analyse fiscale */}
        <View style={st.section}>
          <SecHead n={7} title={t("report.sec.fiscal")} st={st} />
          <Row
            label={t("report.row.masRechisha")}
            value={`${fmtShekel(r.fiscalAnalysis.masRechisha.amount)} (${fmtPct(r.fiscalAnalysis.masRechisha.ratePct)})`}
            st={st}
          />
          <Row
            label={t("report.row.masShevach")}
            value={`${fmtShekel(r.fiscalAnalysis.masShevach.amount)} (${fmtPct(r.fiscalAnalysis.masShevach.ratePct)})`}
            st={st}
          />
          <Row
            label={t("report.row.heitelHashvacha")}
            value={`${fmtShekel(r.fiscalAnalysis.heitelHashvacha.amount)} (${fmtPct(r.fiscalAnalysis.heitelHashvacha.ratePct)})`}
            st={st}
          />
          <Row
            label={t("report.row.totalAcquisitionCost")}
            value={fmtShekel(r.fiscalAnalysis.acquisitionTotalCost)}
            st={st}
          />
          <Row
            label={t("report.row.sellerNetProceeds")}
            value={fmtShekel(r.fiscalAnalysis.sellerNetProceeds)}
            st={st}
          />
          {r.fiscalAnalysis.comment ? (
            <Text style={st.note}>{sanitize(r.fiscalAnalysis.comment)}</Text>
          ) : null}
        </View>

        {/* 8. Score urbanistique */}
        <View style={st.section}>
          <SecHead n={8} title={t("report.sec.urban")} st={st} />
          <Row
            label={t("report.row.potentialScore")}
            value={`${r.urbanScore.score ?? "—"} / 100`}
            st={st}
          />
          {r.urbanScore.criteria.map((c, i) => (
            <Row
              key={i}
              label={sanitize(c.label)}
              value={`${sanitize(c.status)}  ·  ${sanitize(c.valueImpact)}`}
              st={st}
            />
          ))}
          {r.urbanScore.comment ? (
            <Text style={st.note}>{sanitize(r.urbanScore.comment)}</Text>
          ) : null}
        </View>

        {/* 9. Analyse des risques */}
        <View style={st.section}>
          <SecHead n={9} title={t("report.sec.risks")} st={st} />
          {r.anomalies.length === 0 ? (
            <Text style={st.para}>{t("report.noAnomalies")}</Text>
          ) : (
            r.anomalies.map((a, i) => {
              const sevColor = SEVERITY_COLOR[a.severity] ?? SEVERITY_COLOR.low;
              const sevLabel =
                t(`report.severity.${a.severity}`) ?? t("report.severity.low");
              return (
                <View key={i} style={st.anomaly} wrap={false}>
                  <View style={st.anomalyHead}>
                    <Text style={st.anomalyLabel}>{sanitize(a.label)}</Text>
                    <Text style={[st.anomalyTag, { color: sevColor }]}>
                      {sevLabel.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={st.note}>{sanitize(a.detail)}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* 10. Investment score */}
        <View style={st.section} wrap={false}>
          <SecHead n={10} title={t("report.sec.investmentScore")} st={st} />
          <View
            style={[
              st.scoreBox,
              { backgroundColor: statusColor.bg, borderColor: statusColor.border },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <Text style={[st.scoreNum, { color: statusColor.color }]}>
                {r.overallScore}
              </Text>
              <View
                style={{
                  ...(rtl ? { marginRight: 8 } : { marginLeft: 8 }),
                  marginBottom: 8,
                }}
              >
                <Text style={[{ color: INK, fontSize: 11 }, ltrIfNumeric("/ 100")]}>
                  / 100
                </Text>
                <Text style={st.scoreCaption}>
                  {t("report.sec.investmentScore")}
                </Text>
              </View>
            </View>
            <Text style={[st.statusWord, { color: statusColor.color }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* 11. Conclusion */}
        <View style={st.sectionPlain} wrap={false}>
          <SecHead n={11} title={t("report.sec.conclusion")} st={st} />
          <Row label={t("report.row.status")} value={statusLabel} st={st} />
          <Text style={[st.para, { marginTop: 4 }]}>
            {sanitize(r.recommendationText)}
          </Text>
        </View>

        {/* 12. Annexe — annonce analysée (on its own page) */}
        <View style={st.sectionPlain} break>
          <SecHead n={12} title={t("report.sec.annex")} st={st} />
          <View style={st.sourceBox}>
            <Text style={st.annexText}>{sanitize(text)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadAnalysisPdf(
  text: string,
  result: AnalyzePropertyResult,
  language: Language = "fr",
): Promise<void> {
  const blob = await pdf(
    <ReportDoc text={text} r={result} language={language} />,
  ).toBlob();
  triggerDownload(blob, `rapport-nadlanconnect-${Date.now()}.pdf`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function stripInline(line: string, keepShekel = false): string {
  return sanitizeText(
    line
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\*(.+?)\*/g, "$1"),
    keepShekel,
  );
}

type MdBlock =
  | { kind: "h"; level: number; text: string }
  | { kind: "p"; text: string }
  | { kind: "li"; text: string }
  | { kind: "tr"; cells: string[] }
  | { kind: "hr" };

function parseMarkdown(md: string, keepShekel = false): MdBlock[] {
  const blocks: MdBlock[] = [];
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      blocks.push({ kind: "hr" });
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push({
        kind: "h",
        level: h[1].length,
        text: stripInline(h[2], keepShekel),
      });
      continue;
    }
    if (line.startsWith("|") && line.includes("|")) {
      const cells = line.split("|").map((c) => c.trim());
      if (cells.length && cells[0] === "") cells.shift();
      if (cells.length && cells[cells.length - 1] === "") cells.pop();
      const isSeparator = cells.every((c) => /^:?-{2,}:?$/.test(c));
      if (isSeparator) continue;
      blocks.push({
        kind: "tr",
        cells: cells.map((c) => stripInline(c, keepShekel)),
      });
      continue;
    }
    if (/^([-*•])\s+/.test(line)) {
      blocks.push({
        kind: "li",
        text: stripInline(line.replace(/^([-*•])\s+/, ""), keepShekel),
      });
      continue;
    }
    blocks.push({ kind: "p", text: stripInline(line, keepShekel) });
  }
  return blocks;
}

export function ChatDoc({
  markdown,
  title,
  language,
}: {
  markdown: string;
  title: string;
  language: Language;
}) {
  const t: T = (key) => translate(language, key);
  const locale = localeForLanguage(language);
  const rtl = language === "he";
  const st = makeStyles(fontsFor(language), rtl);
  const keepShekel = language === "he";
  const date = new Date().toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const blocks = parseMarkdown(markdown, keepShekel);
  return (
    <Document title={t("report.chat.docTitle")} author="NadlanConnect">
      <Page size="A4" style={st.page}>
        <View style={st.footer} fixed>
          <Text style={st.footerText}>
            NadlanConnect · {t("report.footerDisclaimer")}
          </Text>
          <Text
            style={st.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>

        <View style={st.masthead}>
          <Text style={st.kicker}>{t("report.chat.kicker")}</Text>
          <Text style={st.mastTitle}>
            {title
              ? sanitizeText(title.slice(0, 90), keepShekel)
              : t("report.chat.defaultTitle")}
          </Text>
          <Text style={st.mastSub}>
            {t("report.generatedOn")} {date} · Claude · Replit AI
          </Text>
        </View>

        <View style={st.section}>
          {blocks.map((b, i) => {
            if (b.kind === "hr") {
              return <View key={i} style={st.leader} />;
            }
            if (b.kind === "h") {
              return (
                <Text key={i} style={st.bulletTitle}>
                  {b.text}
                </Text>
              );
            }
            if (b.kind === "li") {
              return (
                <Text
                  key={i}
                  style={[
                    st.para,
                    rtl ? { marginRight: 10 } : { marginLeft: 10 },
                  ]}
                >
                  • {b.text}
                </Text>
              );
            }
            if (b.kind === "tr") {
              return (
                <Text key={i} style={st.note}>
                  {b.cells.join("   ·   ")}
                </Text>
              );
            }
            return (
              <Text key={i} style={st.para}>
                {b.text}
              </Text>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}

export async function downloadChatPdf(
  markdown: string,
  title: string,
  language: Language = "fr",
): Promise<void> {
  const blob = await pdf(
    <ChatDoc markdown={markdown} title={title} language={language} />,
  ).toBlob();
  triggerDownload(blob, `conversation-shamai-${Date.now()}.pdf`);
}
