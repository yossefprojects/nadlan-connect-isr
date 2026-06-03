import { Router } from "express";
import { AnalyzePropertyBody, AnalyzePropertyResponse } from "@workspace/api-zod";

const router = Router();

// ── Simple in-memory rate limiter (fixed window per IP) ──────────────────────
const RATE_LIMIT = 15; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute
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

const SYSTEM_PROMPT = `Tu es un expert en immobilier spécialisé dans le marché israélien (Tel Aviv, Jérusalem, Netanya, Haïfa, Ashdod, etc.). Ton rôle est d'analyser des annonces immobilières pour des investisseurs et de produire une évaluation rigoureuse.

Analyse l'annonce fournie et renvoie STRICTEMENT un objet JSON valide (aucun texte avant ou après, pas de balises Markdown). L'objet doit respecter EXACTEMENT cette structure :

{
  "summary": string,                         // résumé en 1-2 phrases (français)
  "features": {
    "surface": number|null,                  // m²
    "rooms": number|null,                     // nombre de pièces
    "floor": string|null,                     // étage
    "hasMamad": boolean|null,                 // présence d'un Mamad (pièce sécurisée)
    "hasElevator": boolean|null,              // ascenseur
    "hasParking": boolean|null,               // parking
    "city": string|null,
    "neighborhood": string|null
  },
  "anomalies": [                              // incohérences de prix, alertes sur l'état, etc.
    { "label": string, "severity": "low"|"medium"|"high", "detail": string }
  ],
  "marketEstimate": {
    "pricePerSqm": number|null,               // prix marché estimé au m² en ₪ selon le quartier
    "estimatedValue": number|null,            // valeur de marché estimée en ₪
    "listedPrice": number|null,               // prix affiché détecté dans l'annonce en ₪
    "verdict": "underpriced"|"fair"|"overpriced"|"unknown",
    "comment": string
  },
  "rentalYield": {
    "estimatedMonthlyRent": number|null,      // loyer mensuel estimé en ₪
    "grossYieldPct": number|null,             // rendement locatif brut en %
    "netYieldPct": number|null,               // rendement locatif net en %
    "comment": string
  },
  "renovation": {
    "level": "none"|"refresh"|"renovation"|"unknown",
    "estimatedBudget": number|null,           // budget travaux estimé en ₪
    "comment": string
  },
  "urbanPotential": {
    "tama38": "yes"|"no"|"possible"|"unknown",        // potentiel TAMA 38
    "pinouiBinoui": "yes"|"no"|"possible"|"unknown",  // potentiel Pinoui Binoui
    "comment": string
  },
  "overallScore": number,                     // score d'investissement global 0-100 (entier)
  "recommendation": "green"|"orange"|"red",   // feu vert / prudence / éviter
  "recommendationText": string                // recommandation en 1-2 phrases (français)
}

Règles importantes :
- Tous les champs sont OBLIGATOIRES. Si une donnée est inconnue, utilise null (pour les nombres/chaînes/booléens) ou "unknown" (pour les énumérations), jamais une valeur inventée.
- Tous les montants sont en shekels (₪).
- Tous les textes (summary, comment, detail, recommendationText) doivent être en français.
- overallScore doit être un entier entre 0 et 100.
- Base tes estimations sur des fourchettes réalistes du marché israélien pour le quartier identifié.`;

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
      system: SYSTEM_PROMPT,
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

export default router;
