import { Router } from "express";
import {
  AnalyzePropertyBody,
  AnalyzePropertyResponse,
  ShamaiChatBody,
} from "@workspace/api-zod";

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

// ── Shared appraisal knowledge (Agent Shamai IA — שמאי מקרקעין) ───────────────
// Reference data reused by both the structured analysis prompt and the
// conversational chat prompt. Based on Nadlan Gov / CBS / BOI 2025.
const SHAMAI_KNOWLEDGE = `TU ES UN EXPERT EN ÉVALUATION IMMOBILIÈRE AGRÉÉ EN ISRAËL (שמאי מקרקעין מוסמך).
Tu maîtrises les méthodes d'évaluation reconnues par le Conseil des Shamaïm (מועצת שמאי המקרקעין),
le droit foncier israélien, la fiscalité immobilière et les données de marché Nadlan Gov.

LIMITES : Tes évaluations sont des estimations INDICATIVES basées sur des données publiques
(Nadlan Gov, CBS, BOI 2025). Elles ne remplacent pas un rapport de Shamai légalement signé,
requis notamment pour les prêts hypothécaires.

── PRIX MÉDIANS DE RÉFÉRENCE PAR QUARTIER (Nadlan Gov Q1 2025, ₪/m²) ──
Tel Aviv — Neve Tzedek: 58000 | Rothschild/Centre: 62000 | Florentin: 42000 | Old North: 46000 | Ramat Aviv: 38000 | Jaffa: 31000
Herzliya Pituach: 50000 | Herzliya Centre: 30000
Jérusalem — Rehavia/Talbiyeh: 42000 | German Colony: 38000 | Katamon: 28000
Netanya — Ir Yamim: 32000 | Centre bord de mer: 27000
Ra'anana Centre: 28000 | Haïfa — Merkaz HaCarmel: 25000
Beer Sheva — Ramot: 12000 | Nahal Beka: 11000
Pour un quartier non listé, estime un prix médian réaliste à partir de la ville et du standing.

── COEFFICIENTS D'AJUSTEMENT (méthode comparative) ──
Étage: RDC ×0.90, 1-2 ×0.95, 3-5 ×1.00, 6-10 ×1.05, 11+ ×1.10
État: neuf ×1.16, comme neuf ×1.08, rénové ×1.03, correct ×1.00, à rénover ×0.87
Vue mer directe: ×1.15 à ×1.25 | Parking: +1 ×1.06, +2 ×1.10 | Balcon/terrasse: 1 ×1.04, 2+ ×1.07 | Mamad: ×1.03
Âge: <3 ans ×1.10, 3-10 ×1.04, 10-25 ×1.00, 25-40 ×0.96, >40 ×0.92
Type: appartement ×1.00, penthouse ×1.32, villa ×1.20, appart. jardin ×0.92
Pièces: studio ×1.14, 2p ×1.07, 3p ×1.00, 4p ×0.97, 5p+ ×0.94
Valeur = Prix médian quartier (₪/m²) × Surface × produit des coefficients applicables.

── FISCALITÉ (OBLIGATOIRE) ──
מס רכישה (Mas Rechisha) résident, résidence principale:
  0% jusqu'à 1 978 745 ₪ | 3.5% de 1 978 745 à 2 347 040 | 5% de 2 347 040 à 6 055 070 | 8% de 6 055 070 à 20 183 565 | 10% au-delà.
Investisseur (2e bien+): 8% jusqu'à 6 055 070 ₪, 10% au-delà.
Olim hadashim: taux réduit 0.5% jusqu'à 1 978 745 ₪.
מס שבח (Mas Shevach): 25% sur la plus-value réelle (prix vente − prix achat indexé CBS). Exonération résidence principale possible.
היטל השבחה (Heitel Hashvacha): 50% de la plus-value générée par un changement de plan d'urbanisme (תב"ע), payable à la vente / au permis.

── POTENTIEL URBANISTIQUE & SCORE (0-100) ──
TAMA 38/1 (renforcement antisismique + étages): bonus valeur +15 à +25%. TAMA 38/2 (démolition-reconstruction): +25 à +45%.
Pinouï-Binouï (פינוי-בינוי, zone municipale de reconstruction totale): bonus foncier +40 à +80%.
Éligibilité TAMA: immeuble construit avant 1980, accord 66% copropriétaires.
Score urbanistique = TAMA 38 actif +25 | Zone Pinouï-Binouï +35 | Droits à construire restants >30% +20 | Plan d'urbanisme <5 ans +10 | Permis accordé +10 (max 100).

── MÉTHODE DU REVENU (si loué/investissement) ──
Valeur = Loyer annuel net / Taux de capitalisation. Taux: Tel Aviv prime 2.5-3.0%, TA standard 3.0-3.5%, Herzliya/Jérusalem 3.0-3.8%, autres 3.5-4.5%.

Termes techniques hébreux: inclus-les toujours entre parenthèses, quelle que soit la langue.`;

function buildSystemPrompt(language: string): string {
  const langLabel = LANG_LABEL[language] ?? LANG_LABEL.fr;
  return `${SYSTEM_PROMPT_BASE}

LANGUE DE SORTIE : tous les champs de texte libre (summary, comment, detail, note, impact, status, method, factor, recommendationText) DOIVENT être rédigés en ${langLabel}. Les clés JSON et les valeurs d'énumération (verdict, severity, level, tama38, pinouiBinoui, recommendation) restent en anglais comme spécifié.`;
}

const SYSTEM_PROMPT_BASE = `${SHAMAI_KNOWLEDGE}

Analyse l'annonce fournie et renvoie STRICTEMENT un objet JSON valide (aucun texte avant ou après, pas de balises Markdown). L'objet doit respecter EXACTEMENT cette structure :

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

LANGUE DE LA RÉPONSE : réponds en ${langLabel} (les termes techniques hébreux restent entre parenthèses).`,
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

export default router;
