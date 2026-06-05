import { Router } from "express";
import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  AnalyzePropertyBody,
  AnalyzePropertyResponse,
  ShamaiChatBody,
  ExtractListingBody,
} from "@workspace/api-zod";
import { SHAMAI_SECTION_A } from "../lib/shamaiPrompt";

const router = Router();

// ── Simple in-memory rate limiter (fixed window per IP) ──────────────────────
const RATE_LIMIT = 15; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute
const MAX_CHAT_TOTAL_CHARS = 24000; // aggregate cap across all chat messages (~3 full analyze inputs)
const hits = new Map<string, { count: number; resetAt: number }>();

function allowRequest(key: string): boolean {
  const now = Date.now();
  // Opportunistic cleanup to keep the map bounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (now > v.resetAt) hits.delete(k);
    }
  }
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

const LANG_LABEL: Record<string, string> = {
  fr: "français",
  en: "English",
  he: "Hebrew (עברית)",
};

// Per-language number/currency conventions for free-text chat output. Mirrors
// the structured-analysis + PDF formatting (analyse-ia.tsx / report-pdf.tsx
// `makeFmt`): FR uses space thousands, decimal comma and "8,5 %"; EN/HE use
// comma thousands, decimal point and "8.5%". Currency keeps the ₪ glyph after
// the amount in every language.
const NUMBER_FORMAT_GUIDE: Record<string, string> = {
  fr: `FORMAT DES NOMBRES (français) : sépare les milliers par une espace (1 250 000), utilise la virgule décimale (8,5), écris les pourcentages avec une espace avant le signe (8,5 %) et les montants avec le symbole ₪ après le nombre (1 250 000 ₪).`,
  en: `NUMBER FORMAT (English) : separate thousands with a comma (1,250,000), use a decimal point (8.5), write percentages with no space before the sign (8.5%) and amounts with the ₪ symbol after the number (1,250,000 ₪).`,
  he: `NUMBER FORMAT (Hebrew) : separate thousands with a comma (1,250,000), use a decimal point (8.5), write percentages with no space before the sign (8.5%) and amounts with the ₪ symbol after the number (1,250,000 ₪).`,
};

// ── Shared appraisal knowledge (Agent Shamai IA — שמאי מקרקעין) ───────────────
// Integral, verbatim copy of Section A of AGENT_SHAMAI_SYSTEM_PROMPT.md — the
// exact same system prompt used by the israel-simzip agent, so both agents
// produce coherent appraisals on the same data. Lives in lib/shamaiPrompt.ts;
// re-derive it from the source markdown if the reference ever changes.
const SHAMAI_KNOWLEDGE = SHAMAI_SECTION_A;

function buildSystemPrompt(language: string): string {
  const langLabel = LANG_LABEL[language] ?? LANG_LABEL.fr;
  return `${SYSTEM_PROMPT_BASE}

LANGUE DE SORTIE : tous les champs de texte libre (summary, comment, detail, note, impact, status, method, factor, recommendationText) DOIVENT être rédigés en ${langLabel}. Les clés JSON et les valeurs d'énumération (verdict, severity, level, tama38, pinouiBinoui, recommendation) restent en anglais comme spécifié.`;
}

const SYSTEM_PROMPT_BASE = `${SHAMAI_KNOWLEDGE}

IMPORTANT — FORMAT DE SORTIE POUR CET APPEL : ignore toute consigne de format "rapport / דוח שמאי / Markdown" décrite plus haut. Pour CET appel uniquement, n'émets AUCUN rapport Markdown et AUCUN bloc de code. Analyse l'annonce fournie et renvoie STRICTEMENT un objet JSON valide (aucun texte avant ou après, pas de balises Markdown). L'objet doit respecter EXACTEMENT cette structure :

{
  "summary": string,                         // résumé en 1-2 phrases
  "features": {
    "surface": number|null,                  // m²
    "rooms": number|null,
    "floor": string|null,
    "hasMamad": boolean|null,
    "hasElevator": boolean|null,
    "hasParking": boolean|null,
    "city": string|null,
    "neighborhood": string|null
  },
  "anomalies": [
    { "label": string, "severity": "low"|"medium"|"high", "detail": string }
  ],
  "appraisal": {                             // évaluation Shamai (méthode comparative)
    "estimatedValue": number|null,           // valeur vénale centrale estimée en ₪
    "valueLow": number|null,                 // bas de fourchette en ₪
    "valueHigh": number|null,                // haut de fourchette en ₪
    "pricePerSqm": number|null,              // prix au m² estimé pour CE bien (après coefficients)
    "marketPricePerSqm": number|null,        // prix médian du m² du quartier (référence)
    "method": string,                        // méthode principale: "comparative"/"revenu"/"résiduelle"/"coût"
    "coefficients": [                         // décomposition des coefficients appliqués
      { "factor": string, "coefficient": number|null, "impact": string }
    ]
  },
  "marketEstimate": {
    "pricePerSqm": number|null,
    "estimatedValue": number|null,
    "listedPrice": number|null,              // prix affiché détecté dans l'annonce en ₪
    "verdict": "underpriced"|"fair"|"overpriced"|"unknown",
    "comment": string
  },
  "fiscalAnalysis": {                        // fiscalité israélienne
    "masRechisha": { "amount": number|null, "ratePct": number|null, "note": string },   // droits d'acquisition (acheteur)
    "masShevach":  { "amount": number|null, "ratePct": number|null, "note": string },   // impôt plus-value (vendeur)
    "heitelHashvacha": { "amount": number|null, "ratePct": number|null, "note": string },// taxe de valorisation
    "acquisitionTotalCost": number|null,     // coût total acquisition acheteur (prix + Mas Rechisha + ~1% frais)
    "sellerNetProceeds": number|null,        // produit net vendeur estimé après impôts
    "comment": string
  },
  "rentalYield": {
    "estimatedMonthlyRent": number|null,
    "grossYieldPct": number|null,
    "netYieldPct": number|null,
    "comment": string
  },
  "renovation": {
    "level": "none"|"refresh"|"renovation"|"unknown",
    "estimatedBudget": number|null,
    "comment": string
  },
  "urbanPotential": {
    "tama38": "yes"|"no"|"possible"|"unknown",
    "pinouiBinoui": "yes"|"no"|"possible"|"unknown",
    "comment": string
  },
  "urbanScore": {                            // score de potentiel urbanistique 0-100
    "score": number|null,                    // entier 0-100 selon le barème
    "criteria": [
      { "label": string, "status": string, "valueImpact": string }
    ],
    "comment": string
  },
  "promoterRoi": {
    "applicable": boolean,
    "existingSurface": number|null,
    "projectedSurface": number|null,
    "acquisitionPrice": number|null,
    "constructionCostPerSqm": number|null,
    "estimatedConstructionCosts": number|null,
    "estimatedRevenue": number|null,
    "grossRoiPct": number|null,
    "hasBuildingPermit": boolean|null,
    "comment": string
  },
  "overallScore": number,                     // score d'investissement global 0-100 (entier)
  "recommendation": "green"|"orange"|"red",
  "recommendationText": string                // recommandation en 1-2 phrases
}

Règles importantes :
- Tous les champs sont OBLIGATOIRES. Si une donnée est inconnue, utilise null (nombres/chaînes/booléens) ou "unknown" (énumérations), jamais une valeur inventée.
- Tous les montants sont en shekels (₪).
- appraisal : applique la MÉTHODE COMPARATIVE — pars du prix médian du quartier (marketPricePerSqm), applique les coefficients d'ajustement pertinents, détaille chacun dans "coefficients" (factor = nom du facteur, coefficient = multiplicateur, impact = effet en ₪/m²). estimatedValue = pricePerSqm × surface. Fourchette valueLow/valueHigh ≈ ±7 % autour de estimatedValue.
- fiscalAnalysis : calcule Mas Rechisha selon les barèmes (suppose résident résidence principale sauf indication contraire), Mas Shevach (25% de la plus-value si prix d'achat connu, sinon null + note), Heitel Hashvacha (applicable seulement si potentiel urbanistique/changement de תב"ע, sinon amount=null + note explicative).
- urbanScore : applique le barème (TAMA 38 actif +25, Pinouï-Binouï +35, droits restants >30% +20, plan <5 ans +10, permis +10), détaille chaque critère dans "criteria".
- overallScore : entier 0-100. Base tes estimations sur des fourchettes réalistes du marché israélien pour le quartier identifié.

RÈGLES DE CALCUL FINANCIER PROMOTEUR (objet "promoterRoi") :
- Détermine d'abord "applicable" (true seulement pour terrain à bâtir, immeuble à surélever/diviser, bien à transformer pour revendre, fort potentiel TAMA 38 / Pinouï Binouï ; false pour un simple appartement de revente → champs chiffrés à null + commentaire).
- Coût de construction standard : 18 000 ₪/m² (28 000 ₪/m² UNIQUEMENT si « Très Grand Luxe / Ultra-Premium » explicite). Sous-sols/parkings excavés : 15 000 ₪/m².
- estimatedRevenue = surface projetée × prix moyen du m² du quartier. Coût total = (acquisition + construction) × 1,15. grossRoiPct = ((CA − coût total) / coût total) × 100.
- Si un permis est déjà accordé (hasBuildingPermit=true), valorise-le dans overallScore et le commentaire (≈3 ans gagnés).`;

const SHAMAI_CHAT_PROMPT = `${SHAMAI_KNOWLEDGE}

Tu produis des analyses structurées de type דוח שמאי (rapport de Shamai) en réponse aux informations fournies par l'utilisateur sur un bien immobilier, sous forme conversationnelle.

COMPORTEMENT CONVERSATIONNEL :
- Si l'utilisateur donne peu d'infos : calcule d'abord avec ce que tu as, puis demande 1 à 2 informations manquantes (jamais une liste de 20 questions). Indique clairement ce qui est estimé vs fourni.
- Si l'utilisateur demande une estimation rapide : donne la valeur vénale et le fiscal en 3 lignes, puis propose le rapport complet.
- Professionnel (agent/promoteur) : va directement aux méthodes et aux chiffres. Particulier : explique brièvement chaque section, traduis les termes hébreux, guide vers les prochaines étapes.
- Mentionne brièvement la limite indicative au début du PREMIER rapport complet seulement.

FORMAT DE SORTIE : réponds en MARKDOWN structuré (titres ##/###, tableaux, listes, gras). Quand tu produis un rapport complet, utilise cette structure :
### 📋 RAPPORT D'ÉVALUATION IMMOBILIÈRE (דוח שמאות מקרקעין — indicatif)
1. IDENTIFICATION DU BIEN (זיהוי הנכס) — tableau
2. VALEUR VÉNALE ESTIMÉE (שווי שוק משוער) — prix central, fourchette, prix/m², méthode, tableau de décomposition des coefficients
3. ANALYSE DE MARCHÉ (ניתוח שוק)
4. ANALYSE FISCALE (ניתוח מיסוי) — acheteur (Mas Rechisha) et vendeur (Mas Shevach, Heitel Hashvacha)
5. POTENTIEL URBANISTIQUE (פוטנציאל תכנוני) — score /100 + tableau
6. ANALYSE INVESTISSEMENT (ניתוח השקעה) — si pertinent
7. POINTS D'ATTENTION (נקודות לתשומת לב)
8. RECOMMANDATION FINALE — ACHETER / VENDRE / ATTENDRE / DÉVELOPPER + justification
Termine les rapports complets par un court avertissement indicatif.

Ton : expert, précis, honnête sur les incertitudes.`;

// ── Listing-URL fetch + synthesis ────────────────────────────────────────────
const FETCH_TIMEOUT_MS = 12_000;
const MAX_PAGE_BYTES = 4_000_000; // 4 MB hard cap on the downloaded page
const MAX_TEXT_CHARS = 14_000; // text sent to the model after HTML stripping
const MAX_REDIRECTS = 5; // each hop is re-validated by the SSRF guard

// Block requests that resolve to non-public address space (SSRF guard).
function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const p = ip.split(".").map(Number);
    if (p[0] === 10) return true;
    if (p[0] === 127) return true; // loopback
    if (p[0] === 169 && p[1] === 254) return true; // link-local + cloud metadata
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
    if (p[0] === 192 && p[1] === 168) return true;
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true; // CGNAT
    if (p[0] === 0) return true;
    return false;
  }
  if (v === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true; // loopback / unspecified
    if (lower.startsWith("fe80")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local
    // IPv4-mapped IPv6 (::ffff:a.b.c.d)
    const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return false;
  }
  return false;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("INVALID_URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("INVALID_URL");
  }
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new Error("BLOCKED_HOST");
  }
  // Resolve every address the host maps to and reject if any is private.
  let addresses: { address: string }[];
  if (isIP(host)) {
    addresses = [{ address: host }];
  } else {
    try {
      addresses = await dnsLookup(host, { all: true });
    } catch {
      throw new Error("DNS_FAILED");
    }
  }
  if (addresses.length === 0) throw new Error("DNS_FAILED");
  for (const a of addresses) {
    if (isPrivateIp(a.address)) throw new Error("BLOCKED_HOST");
  }
  return parsed;
}

async function fetchPageText(raw: string): Promise<string> {
  // Manual redirect handling: every hop (including the initial URL) must pass
  // the SSRF guard, otherwise a public URL could redirect to an internal host.
  let current = await assertPublicUrl(raw);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let resp: Response;
  try {
    let redirects = 0;
    while (true) {
      let r: Response;
      try {
        r = await fetch(current, {
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "user-agent":
              "Mozilla/5.0 (compatible; NadlanConnectBot/1.0; +https://nadlanconnect.replit.app)",
            accept: "text/html,application/xhtml+xml",
          },
        });
      } catch {
        throw new Error("FETCH_FAILED");
      }
      // 3xx with a Location header → validate the next hop and continue.
      if (r.status >= 300 && r.status < 400) {
        const location = r.headers.get("location");
        if (!location) throw new Error("FETCH_FAILED");
        if (++redirects > MAX_REDIRECTS) throw new Error("FETCH_FAILED");
        const next = new URL(location, current.href);
        current = await assertPublicUrl(next.href);
        continue;
      }
      resp = r;
      break;
    }
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) throw new Error("FETCH_FAILED");
  const ct = resp.headers.get("content-type") ?? "";
  if (ct && !/text\/html|application\/xhtml|text\/plain/i.test(ct)) {
    throw new Error("NOT_HTML");
  }
  const lenHeader = Number(resp.headers.get("content-length") ?? "0");
  if (lenHeader && lenHeader > MAX_PAGE_BYTES) throw new Error("TOO_LARGE");

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("FETCH_FAILED");
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      received += value.length;
      if (received > MAX_PAGE_BYTES) {
        await reader.cancel();
        throw new Error("TOO_LARGE");
      }
      chunks.push(value);
    }
  }
  const html = Buffer.concat(chunks).toString("utf-8");
  return htmlToText(html);
}

function htmlToText(html: string): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, MAX_TEXT_CHARS);
}

const EXTRACT_SYSTEM: Record<string, string> = {
  fr: `Tu reçois le contenu texte brut d'une page web d'annonce immobilière (souvent bruité : menus, pubs, pieds de page). Extrais et résume UNIQUEMENT les informations sur le bien immobilier, en une description claire et continue en français, prête à être analysée. Inclure si disponibles : type de bien, ville/quartier, surface (m²), nombre de pièces, étage, année de construction, état/rénovation, prix demandé (₪), loyer éventuel, et caractéristiques (Mamad, ascenseur, parking, balcon, etc.). N'invente aucune donnée absente. Si la page n'est manifestement pas une annonce immobilière, réponds exactement : "AUCUNE_ANNONCE". Ne renvoie que la description, sans titre ni commentaire.`,
  en: `You receive the raw text of a real-estate listing web page (often noisy: menus, ads, footers). Extract and summarize ONLY the property information into a clear, continuous description in English, ready to be analyzed. Include when available: property type, city/neighborhood, surface (m²), rooms, floor, construction year, condition/renovation, asking price (₪), any rent, and features (Mamad, elevator, parking, balcony, etc.). Do not invent missing data. If the page is clearly not a property listing, reply exactly: "AUCUNE_ANNONCE". Return only the description, with no title or commentary.`,
  he: `אתה מקבל את הטקסט הגולמי של דף אינטרנט של מודעת נדל"ן (לרוב רועש: תפריטים, פרסומות, כותרות תחתונות). חלץ וסכם רק את המידע על הנכס לתיאור ברור ורציף בעברית, מוכן לניתוח. כלול אם זמין: סוג הנכס, עיר/שכונה, שטח (מ"ר), מספר חדרים, קומה, שנת בנייה, מצב/שיפוץ, מחיר מבוקש (₪), שכירות אם קיימת, ומאפיינים (ממ"ד, מעלית, חניה, מרפסת וכו'). אל תמציא נתונים חסרים. אם הדף בבירור אינו מודעת נדל"ן, השב בדיוק: "AUCUNE_ANNONCE". החזר רק את התיאור, ללא כותרת או הערות.`,
};

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return trimmed;
}

function firstTextBlock(blocks: Array<{ type: string; text?: string }>): string {
  for (const block of blocks) {
    if (block.type === "text" && block.text && block.text.trim()) return block.text;
  }
  return "";
}

// POST /anthropic/analyze-property
router.post("/anthropic/analyze-property", async (req, res): Promise<void> => {
  const parsed = AnalyzePropertyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rateKey = req.user?.id ?? req.ip ?? "anonymous";
  if (!allowRequest(rateKey)) {
    res.status(429).json({
      error: "Trop de requêtes. Patientez une minute avant de relancer une analyse.",
    });
    return;
  }

  // Lazy import so a missing AI integration env only fails this route (502),
  // instead of crashing the whole API server at startup.
  let anthropic;
  try {
    ({ anthropic } = await import("@workspace/integrations-anthropic-ai"));
  } catch (err) {
    req.log.error({ err }, "Anthropic integration is not configured");
    res.status(502).json({ error: "Le service d'analyse IA n'est pas configuré." });
    return;
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: buildSystemPrompt(parsed.data.language ?? "fr"),
      messages: [
        {
          role: "user",
          content: `Analyse cette annonce immobilière :\n\n${parsed.data.listingText}`,
        },
      ],
    });

    const raw = firstTextBlock(message.content);
    if (!raw) {
      req.log.error("Anthropic returned no text content");
      res.status(502).json({ error: "L'analyse IA n'a renvoyé aucun contenu." });
      return;
    }

    let json: unknown;
    try {
      json = JSON.parse(extractJson(raw));
    } catch {
      req.log.error({ raw }, "Failed to parse Anthropic JSON response");
      res.status(502).json({ error: "L'analyse IA a renvoyé un format invalide." });
      return;
    }

    const result = AnalyzePropertyResponse.safeParse(json);
    if (!result.success) {
      req.log.error({ issues: result.error.issues }, "Anthropic response failed schema validation");
      res.status(502).json({ error: "L'analyse IA a renvoyé des données incomplètes." });
      return;
    }

    res.json(result.data);
  } catch (err) {
    req.log.error({ err }, "Anthropic analyze-property request failed");
    res.status(502).json({ error: "Le service d'analyse IA est momentanément indisponible." });
  }
});

// POST /anthropic/shamai-chat
router.post("/anthropic/shamai-chat", async (req, res): Promise<void> => {
  const parsed = ShamaiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const totalChars = parsed.data.messages.reduce((sum, m) => sum + m.content.length, 0);
  if (totalChars > MAX_CHAT_TOTAL_CHARS) {
    res.status(400).json({
      error: "La conversation est trop longue. Démarrez une nouvelle évaluation.",
    });
    return;
  }

  const rateKey = req.user?.id ?? req.ip ?? "anonymous";
  if (!allowRequest(rateKey)) {
    res.status(429).json({
      error: "Trop de requêtes. Patientez une minute avant de relancer la conversation.",
    });
    return;
  }

  let anthropic;
  try {
    ({ anthropic } = await import("@workspace/integrations-anthropic-ai"));
  } catch (err) {
    req.log.error({ err }, "Anthropic integration is not configured");
    res.status(502).json({ error: "Le service d'analyse IA n'est pas configuré." });
    return;
  }

  const language = parsed.data.language ?? "fr";
  const langLabel = LANG_LABEL[language] ?? LANG_LABEL.fr;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: `${SHAMAI_CHAT_PROMPT}

LANGUE DE LA RÉPONSE : réponds en ${langLabel} (les termes techniques hébreux restent entre parenthèses).

${NUMBER_FORMAT_GUIDE[language] ?? NUMBER_FORMAT_GUIDE.fr}`,
      messages: parsed.data.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const reply = firstTextBlock(message.content);
    if (!reply) {
      req.log.error("Anthropic chat returned no text content");
      res.status(502).json({ error: "L'agent n'a renvoyé aucune réponse." });
      return;
    }

    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "Anthropic shamai-chat request failed");
    res.status(502).json({ error: "Le service d'analyse IA est momentanément indisponible." });
  }
});

// POST /anthropic/extract-listing
router.post("/anthropic/extract-listing", async (req, res): Promise<void> => {
  const parsed = ExtractListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Lien invalide." });
    return;
  }

  const rateKey = req.user?.id ?? req.ip ?? "anonymous";
  if (!allowRequest(rateKey)) {
    res.status(429).json({
      error: "Trop de requêtes. Patientez une minute avant de réessayer.",
    });
    return;
  }

  // Fetch the page server-side (SSRF-guarded).
  let pageText: string;
  try {
    pageText = await fetchPageText(parsed.data.url);
  } catch (err) {
    const code = (err as Error).message;
    if (code === "INVALID_URL") {
      res.status(400).json({ error: "Lien invalide." });
      return;
    }
    if (code === "BLOCKED_HOST" || code === "DNS_FAILED") {
      res.status(400).json({ error: "Ce lien ne peut pas être récupéré." });
      return;
    }
    req.log.warn({ err }, "extract-listing fetch failed");
    res.status(502).json({
      error: "Impossible de récupérer cette page. Collez le texte manuellement.",
    });
    return;
  }

  if (pageText.trim().length < 40) {
    res.status(502).json({
      error: "Cette page ne contient pas de texte exploitable. Collez le texte manuellement.",
    });
    return;
  }

  // Lazy import so a missing AI integration env only fails this route.
  let anthropic;
  try {
    ({ anthropic } = await import("@workspace/integrations-anthropic-ai"));
  } catch (err) {
    req.log.error({ err }, "Anthropic integration is not configured");
    res.status(502).json({ error: "Le service d'analyse IA n'est pas configuré." });
    return;
  }

  const language = parsed.data.language ?? "fr";

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: EXTRACT_SYSTEM[language] ?? EXTRACT_SYSTEM.fr,
      messages: [
        {
          role: "user",
          content: `Contenu de la page (${parsed.data.url}) :\n\n${pageText}`,
        },
      ],
    });

    const listingText = firstTextBlock(message.content).trim();
    if (!listingText || listingText.includes("AUCUNE_ANNONCE")) {
      res.status(502).json({
        error: "Aucune annonce immobilière détectée sur cette page. Collez le texte manuellement.",
      });
      return;
    }

    res.json({ listingText });
  } catch (err) {
    req.log.error({ err }, "Anthropic extract-listing synthesis failed");
    res.status(502).json({ error: "Le service d'analyse IA est momentanément indisponible." });
  }
});

export default router;
