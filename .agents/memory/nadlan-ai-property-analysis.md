---
name: NadlanConnect AI property analysis
description: How the Anthropic Claude property-analysis feature is wired and the constraints that keep it safe/cheap.
---

# AI property analysis (Anthropic Claude)

Feature: paste a real-estate listing → structured investment analysis (features, anomalies, market price/m², rental yield, renovation budget, urban potential TAMA38/Pinoui Binoui, score + recommendation).

## Integration
- Uses the **Replit-managed Anthropic integration** (provisioned via `setupReplitAIIntegrations`). Auth comes from env `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` + `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — **no user API key**, billed to Replit credits.
- Template copied to `lib/integrations-anthropic-ai`; the conversations/messages DB tables were intentionally **dropped** — the analyze endpoint is stateless one-shot, not a chat.

## Contract-first
- Single endpoint `POST /anthropic/analyze-property`, normal JSON (not SSE) because the output is one structured object → lets Orval generate a React Query hook + zod schema. Server validates the model's JSON against the generated zod `AnalyzePropertyResponse` and returns 502 if it doesn't conform.

## Dual analysis in one response (investor + promoter)
- The single result carries BOTH an investor/buyer analysis (market price, rental yield, renovation, urban potential) AND a `promoterRoi` development appraisal — kept **additive** per the user's choice (don't replace the investor view).
- `promoterRoi.applicable` is the gate: the model sets it true only for development opportunities (lot/building/transform-to-resell), false for a plain resale apartment (then numeric fields null). UI/export render the full ROI breakdown only when applicable.
- Promoter financial constants live in the prompt, not code: construction 18 000 ₪/m² standard (28 000 only if explicitly "Très Grand Luxe/Ultra-Premium"), excavated basement/parking 15 000 ₪/m², revenue = projected m² × neighborhood price/m², total cost = (acquisition + construction) × 1.15, gross ROI = ((revenue−cost)/cost)×100; a granted building permit is valued positively in the score.
- **Caveat:** the LLM does the arithmetic, so ROI figures are indicative, not exact — fine for this tool, do not treat as audited.

## Cost/abuse constraints — keep these
**Why:** the endpoint is public/unauthenticated (same as listings browse) but every call triggers a paid LLM request, so it's a cost-amplification DoS vector.
**How to apply:** any public LLM endpoint here must keep BOTH guards:
1. Input cap in the OpenAPI contract (`listingText` maxLength 8000) so the generated zod rejects oversized prompts with 400 before any model call.
2. In-memory fixed-window rate limit (15 req/min keyed by `req.user?.id ?? req.ip`) returning 429.
- The integration client is imported **lazily inside the route handler** (dynamic `import`), because the client throws at module load if its env vars are missing — a top-level import would crash the whole API server at startup instead of failing just this route with 502.
- Parse the model reply by scanning `message.content` for the first **text** block (not `content[0]`), then strip ``` fences before `JSON.parse`.
