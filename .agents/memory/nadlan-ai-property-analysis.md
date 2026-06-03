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

## Cost/abuse constraints — keep these
**Why:** the endpoint is public/unauthenticated (same as listings browse) but every call triggers a paid LLM request, so it's a cost-amplification DoS vector.
**How to apply:** any public LLM endpoint here must keep BOTH guards:
1. Input cap in the OpenAPI contract (`listingText` maxLength 8000) so the generated zod rejects oversized prompts with 400 before any model call.
2. In-memory fixed-window rate limit (15 req/min keyed by `req.user?.id ?? req.ip`) returning 429.
- The integration client is imported **lazily inside the route handler** (dynamic `import`), because the client throws at module load if its env vars are missing — a top-level import would crash the whole API server at startup instead of failing just this route with 502.
- Parse the model reply by scanning `message.content` for the first **text** block (not `content[0]`), then strip ``` fences before `JSON.parse`.
