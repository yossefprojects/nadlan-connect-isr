/**
 * Utilities shared between the post-build prerender script and its tests.
 *
 * This file is intentionally plain TypeScript with no browser or Node.js
 * dependencies so it can be imported both by `prerender.ts` (Node/tsx) and
 * by the Vitest test suite.
 */

/**
 * Safely serialize a value as JSON for embedding inside an HTML
 * `<script type="application/ld+json">` block.
 *
 * Plain `JSON.stringify` is not safe for this purpose: a value such as
 *   `"title": "</script><script>alert(1)</script>"`
 * would terminate the enclosing script tag and allow the remainder to be
 * interpreted as executable HTML — a classic stored-XSS vector.
 *
 * This function serializes to JSON and then replaces the five characters that
 * are meaningful inside an HTML raw-text element with their Unicode escape
 * equivalents, which are valid JSON and completely inert in HTML:
 *   `<`  → `\u003c`
 *   `>`  → `\u003e`
 *   `&`  → `\u0026`
 *   `'`  → `\u0027`
 *   `/`  → `\u002f`  (neutralises `</script>` and similar sequences)
 *
 * The resulting string is safe to embed verbatim between
 * `<script type="application/ld+json">` and `</script>`.
 */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/'/g, "\\u0027")
    .replace(/\//g, "\\u002f");
}
