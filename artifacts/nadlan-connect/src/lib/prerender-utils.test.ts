import { describe, expect, it } from "vitest";
import { safeJsonLd } from "./prerender-utils";

describe("safeJsonLd — XSS prevention for JSON-LD <script> blocks", () => {
  it("serializes a plain object without mutation", () => {
    const result = safeJsonLd({ "@type": "WebSite", name: "NadlanConnect" });
    const parsed = JSON.parse(result);
    expect(parsed["@type"]).toBe("WebSite");
    expect(parsed.name).toBe("NadlanConnect");
  });

  it("escapes '<' and '>' so </script> cannot break out of the tag", () => {
    const payload = '</script><script>alert(1)</script>';
    const result = safeJsonLd({ description: payload });
    expect(result).not.toContain("</script>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("\\u003c");
    expect(result).toContain("\\u003e");
    // Round-trip: the parsed value must equal the original string
    expect(JSON.parse(result).description).toBe(payload);
  });

  it("escapes '&' to prevent HTML entity injection", () => {
    const payload = "A & B";
    const result = safeJsonLd({ title: payload });
    expect(result).not.toContain("&");
    expect(result).toContain("\\u0026");
    expect(JSON.parse(result).title).toBe(payload);
  });

  it("escapes forward-slash to neutralise embedded </script> sequences", () => {
    const payload = "path/to/page</script>";
    const result = safeJsonLd({ url: payload });
    expect(result).not.toContain("</script>");
    expect(result).toContain("\\u002f");
    expect(JSON.parse(result).url).toBe(payload);
  });

  it("escapes single-quotes", () => {
    const payload = "it's fine";
    const result = safeJsonLd({ label: payload });
    expect(result).not.toContain("'");
    expect(result).toContain("\\u0027");
    expect(JSON.parse(result).label).toBe(payload);
  });

  it("handles nested objects and arrays safely", () => {
    const obj = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Apt <with> special & chars",
      offers: { price: 500000, priceCurrency: "ILS" },
      tags: ["<b>tag</b>", "normal"],
    };
    const result = safeJsonLd(obj);
    expect(result).not.toMatch(/<[^!]/);
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe(obj.name);
    expect(parsed.tags[0]).toBe(obj.tags[0]);
  });

  it("handles numbers, booleans, and null without altering them", () => {
    const obj = { price: 12345, active: true, note: null };
    const result = safeJsonLd(obj);
    const parsed = JSON.parse(result);
    expect(parsed.price).toBe(12345);
    expect(parsed.active).toBe(true);
    expect(parsed.note).toBeNull();
  });
});
