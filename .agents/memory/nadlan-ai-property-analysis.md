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

## Two LLM shapes coexist: structured contract vs. free Markdown chat
- The analyze endpoint is contract-first (zod-validated JSON), but the Shamai chat endpoint deliberately returns **free-form Markdown with no result schema** — a conversational reply can't be forced into a fixed object.
- **Both shapes still need the same public-LLM guards** (input cap, in-memory rate limit, lazy client import). The guard requirement attaches to "is this a public paid-LLM call", not to "does it have a zod schema".
- **Why:** treating the chat route as "just a chat" tempted skipping the guards; it's the same cost-amplification DoS surface as analyze.

## Saved chat reports round-trip through Markdown — keep serializer/parser in lockstep
- Chat history is persisted only as serialized Markdown (no structured message array stored), so re-opening a saved chat **parses that Markdown back into messages**. The save serializer and the re-open parser are inverse functions using a fixed role-prefix + `---` divider convention.
- **Why:** if you change the save format (role labels, divider) without updating the parser, every re-opened chat silently renders blank or mis-attributed. Change them together.
- **How to apply:** any edit to how chat is flattened for save/PDF must update the re-open parser in the same change, and vice-versa.

## Deep links into the appraisal tool carry intent
- The tool accepts deep-link params for both prefill (compose a listing string) and re-open (`reportId` → hydrate saved state). Prefill must respect the requested mode: a chat deep-link fills the chat composer, not the analysis textarea.
- **Why:** a regression had chat deep-links dumping the prefill into the (hidden) analysis box, so chat mode opened empty.

## Operational gotcha
- Newly added Express routes 404 until the api-server workflow restarts — a route that exists in code but 404s almost always means the dev server hasn't reloaded, not a mounting bug.

## Dual analysis in one response (investor + promoter)
- The single result carries BOTH an investor/buyer analysis (market price, rental yield, renovation, urban potential) AND a `promoterRoi` development appraisal — kept **additive** per the user's choice (don't replace the investor view).
- `promoterRoi.applicable` is the gate: the model sets it true only for development opportunities (lot/building/transform-to-resell), false for a plain resale apartment (then numeric fields null). UI/export render the full ROI breakdown only when applicable.
- Promoter financial constants live in the prompt, not code: construction 18 000 ₪/m² standard (28 000 only if explicitly "Très Grand Luxe/Ultra-Premium"), excavated basement/parking 15 000 ₪/m², revenue = projected m² × neighborhood price/m², total cost = (acquisition + construction) × 1.15, gross ROI = ((revenue−cost)/cost)×100; a granted building permit is valued positively in the score.
- **Caveat:** the LLM does the arithmetic, so ROI figures are indicative, not exact — fine for this tool, do not treat as audited.

## System prompt = verbatim Section A, shared with israel-simzip
- The Shamai system prompt is an **integral, verbatim copy of "Section A"** of `AGENT_SHAMAI_SYSTEM_PROMPT.md`, stored as a single exported string in `artifacts/api-server/src/lib/shamaiPrompt.ts` (generated via `JSON.stringify` of the sliced markdown, NOT hand-retyped — it contains ``` fences + Hebrew + curly quotes that break a hand-written template literal).
- Both endpoints build on it: analyze-property appends the strict-JSON contract (which overrides Section A's "produce a Markdown report" for that call), shamai-chat uses it almost as-is. So numeric methodology (price grid, coefficients, fiscal brackets, urban score) is identical across both.
- **Why:** the sister site `israel-simzip` must use the SAME Section A so both agents give coherent appraisals on the same data. If the reference markdown changes, re-derive `shamaiPrompt.ts` from it rather than editing prose by hand.

## Cost/abuse constraints — keep these
**Why:** the endpoint is public/unauthenticated (same as listings browse) but every call triggers a paid LLM request, so it's a cost-amplification DoS vector.
**How to apply:** any public LLM endpoint here must keep BOTH guards:
1. Input cap in the OpenAPI contract (`listingText` maxLength 8000) so the generated zod rejects oversized prompts with 400 before any model call.
2. In-memory fixed-window rate limit (15 req/min keyed by `req.user?.id ?? req.ip`) returning 429.
- The integration client is imported **lazily inside the route handler** (dynamic `import`), because the client throws at module load if its env vars are missing — a top-level import would crash the whole API server at startup instead of failing just this route with 502.
- Parse the model reply by scanning `message.content` for the first **text** block (not `content[0]`), then strip ``` fences before `JSON.parse`.
