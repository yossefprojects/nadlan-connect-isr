import { describe, it, expect } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import type { AnalyzePropertyResult } from "@workspace/api-client-react";
import { ReportDoc, ChatDoc } from "./report-pdf";
import { type Language, translate } from "./i18n";

// A fixed, fully-populated sample. Values are chosen so that
// language-specific number/currency formatting produces distinct,
// stable output we can assert on:
//   3 200 000 (FR) / 3,200,000 (EN/HE) and 8,5 % (FR) / 8.5% (EN/HE).
const SAMPLE: AnalyzePropertyResult = {
  summary: "Appartement 4 pièces à Florentin, Tel Aviv.",
  features: {
    surface: 92,
    rooms: 4,
    floor: "3",
    hasMamad: true,
    hasElevator: true,
    hasParking: false,
    city: "Tel Aviv",
    neighborhood: "Florentin",
  },
  anomalies: [
    { label: "Prix élevé", severity: "medium", detail: "Au-dessus du marché." },
  ],
  appraisal: {
    estimatedValue: 3200000,
    valueLow: 3000000,
    valueHigh: 3400000,
    pricePerSqm: 34782,
    marketPricePerSqm: 33000,
    method: "comparative",
    coefficients: [
      { factor: "Étage", coefficient: 1.08, impact: "+2 640 ₪/m²" },
    ],
  },
  marketEstimate: {
    pricePerSqm: 34239,
    estimatedValue: 3150000,
    listedPrice: 3200000,
    verdict: "fair",
    comment: "Prix cohérent.",
  },
  fiscalAnalysis: {
    masRechisha: { amount: 160000, ratePct: 5, note: "" },
    masShevach: { amount: 0, ratePct: 0, note: "" },
    heitelHashvacha: { amount: 0, ratePct: 0, note: "" },
    acquisitionTotalCost: 3392000,
    sellerNetProceeds: 3040000,
    comment: "Fiscalité standard.",
  },
  rentalYield: {
    estimatedMonthlyRent: 8500,
    grossYieldPct: 8.5,
    netYieldPct: 6.2,
    comment: "Rendement correct.",
  },
  renovation: {
    level: "refresh",
    estimatedBudget: 120000,
    comment: "Rafraîchissement léger.",
  },
  urbanPotential: {
    tama38: "possible",
    pinouiBinoui: "no",
    comment: "Potentiel modéré.",
  },
  urbanScore: {
    score: 64,
    criteria: [
      { label: "Tama 38", status: "Possible", valueImpact: "+15 à +25%" },
    ],
    comment: "Zone en renouvellement.",
  },
  promoterRoi: {
    applicable: false,
    existingSurface: null,
    projectedSurface: null,
    acquisitionPrice: null,
    constructionCostPerSqm: null,
    estimatedConstructionCosts: null,
    estimatedRevenue: null,
    grossRoiPct: null,
    hasBuildingPermit: null,
    comment: "Bien de revente classique.",
  },
  overallScore: 72,
  recommendation: "green",
  recommendationText: "Investissement recommandé.",
};

const SAMPLE_TEXT = "Appartement 4 pièces, Florentin Tel Aviv, 92 m², 3 200 000 ₪";

const LANGUAGES: Language[] = ["fr", "en", "he"];

// ---- React element tree walker ------------------------------------------
// @react-pdf primitives (Document/Page/View/Text) are plain string element
// types and the document components are pure, hook-free functions. We walk
// the element tree directly (invoking function components) into a normalized
// host tree, which is more robust than relying on a DOM/test reconciler.
type Host = { type: string; props: Record<string, unknown>; children: Flat[] };
type Flat = string | Host;

function flatten(node: ReactNode): Flat[] {
  if (node == null || typeof node === "boolean") return [];
  if (typeof node === "string") return [node];
  if (typeof node === "number") return [String(node)];
  if (Array.isArray(node)) return node.flatMap(flatten);
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    const type = el.type;
    if (typeof type === "function") {
      return flatten((type as (p: unknown) => ReactNode)(el.props));
    }
    if (typeof type === "string") {
      return [
        {
          type,
          props: el.props as Record<string, unknown>,
          children: flatten(el.props.children),
        },
      ];
    }
    // Fragment / other wrappers: descend into children.
    return flatten(el.props.children);
  }
  return [];
}

function extractText(nodes: Flat[]): string {
  let out = "";
  for (const n of nodes) {
    if (typeof n === "string") out += n;
    else out += extractText(n.children);
  }
  return out;
}

function findAll(nodes: Flat[], type: string): Host[] {
  const acc: Host[] = [];
  const visit = (n: Flat) => {
    if (typeof n === "string") return;
    if (n.type === type) acc.push(n);
    n.children.forEach(visit);
  };
  nodes.forEach(visit);
  return acc;
}

type StyleObj = Record<string, unknown>;

function mergeStyle(style: unknown): StyleObj {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<StyleObj>((acc, s) => ({ ...acc, ...mergeStyle(s) }), {});
  }
  if (typeof style === "object") return style as StyleObj;
  return {};
}

function getPage(nodes: Flat[]): Host {
  const pages = findAll(nodes, "PAGE");
  expect(pages.length).toBeGreaterThan(0);
  return pages[0];
}

function renderReport(language: Language): Flat[] {
  return flatten(<ReportDoc text={SAMPLE_TEXT} r={SAMPLE} language={language} />);
}

// ---- Report document ----------------------------------------------------
describe("ReportDoc", () => {
  it("renders for every language", () => {
    for (const lang of LANGUAGES) {
      const tree = renderReport(lang);
      const text = extractText(tree);
      // Localized section heading must be present in the right language.
      expect(text).toContain(translate(lang, "report.sec.summary"));
      expect(text).toContain(translate(lang, "report.mastTitle"));
      // Body content from the sample is present.
      expect(text).toContain(SAMPLE.summary);
    }
  });

  it("sets RTL page direction and the Hebrew font only for Hebrew", () => {
    const heStyle = mergeStyle(getPage(renderReport("he")).props.style);
    expect(heStyle.direction).toBe("rtl");
    expect(heStyle.fontFamily).toBe("Heebo");

    for (const lang of ["fr", "en"] as const) {
      const style = mergeStyle(getPage(renderReport(lang)).props.style);
      expect(style.direction).toBe("ltr");
      expect(style.fontFamily).toBe("Helvetica");
    }
  });

  it("formats currency per language (space/comma grouping, NIS vs ₪)", () => {
    const fr = extractText(renderReport("fr"));
    expect(fr).toContain("3 200 000 NIS");
    expect(fr).not.toContain("\u20AA"); // no ₪ in the Helvetica (FR) path

    const en = extractText(renderReport("en"));
    expect(en).toContain("3,200,000 NIS");
    expect(en).not.toContain("\u20AA");

    const he = extractText(renderReport("he"));
    expect(he).toContain("3,200,000 \u20AA"); // Heebo can render ₪
    expect(he).not.toContain("NIS");
  });

  it("formats percentages per language (decimal comma + space in FR)", () => {
    expect(extractText(renderReport("fr"))).toContain("8,5 %");
    expect(extractText(renderReport("en"))).toContain("8.5%");
    expect(extractText(renderReport("he"))).toContain("8.5%");
  });

  it("forces numeric value runs to LTR inside an RTL Hebrew report", () => {
    const numericValue = findAll(renderReport("he"), "TEXT").find((n) =>
      extractText(n.children).includes("3,200,000"),
    );
    expect(numericValue).toBeTruthy();
    expect(mergeStyle(numericValue!.props.style).direction).toBe("ltr");
  });
});

// ---- Chat document ------------------------------------------------------
describe("ChatDoc", () => {
  const MARKDOWN = "# Analyse\n\n- Valeur estimée : 3 200 000 ₪\n\nRendement de 8,5 %.";
  const renderChat = (language: Language): Flat[] =>
    flatten(<ChatDoc markdown={MARKDOWN} title="Conversation Shamai" language={language} />);

  it("renders for every language with localized titles", () => {
    for (const lang of LANGUAGES) {
      const text = extractText(renderChat(lang));
      expect(text).toContain(translate(lang, "report.chat.kicker"));
      expect(text).toContain("Analyse");
    }
  });

  it("sets RTL page direction and Hebrew font only for Hebrew", () => {
    const he = mergeStyle(getPage(renderChat("he")).props.style);
    expect(he.direction).toBe("rtl");
    expect(he.fontFamily).toBe("Heebo");

    const fr = mergeStyle(getPage(renderChat("fr")).props.style);
    expect(fr.direction).toBe("ltr");
    expect(fr.fontFamily).toBe("Helvetica");
  });
});
