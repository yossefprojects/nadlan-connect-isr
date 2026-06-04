import { describe, expect, it } from "vitest";
import { dictionaries, type Language } from "./i18n";

const reference: Language = "fr";
const others: Language[] = (Object.keys(dictionaries) as Language[]).filter(
  (lang) => lang !== reference,
);

describe("i18n dictionary parity", () => {
  const referenceKeys = new Set(Object.keys(dictionaries[reference]));

  it.each(others)(
    `%s has exactly the same keys as the "${reference}" reference dictionary`,
    (lang) => {
      const langKeys = new Set(Object.keys(dictionaries[lang]));

      const missing = [...referenceKeys].filter((key) => !langKeys.has(key)).sort();
      const extra = [...langKeys].filter((key) => !referenceKeys.has(key)).sort();

      expect(
        missing,
        `"${lang}" is missing ${missing.length} key(s) present in "${reference}":\n${missing.join("\n")}`,
      ).toEqual([]);

      expect(
        extra,
        `"${lang}" has ${extra.length} orphan key(s) not present in "${reference}":\n${extra.join("\n")}`,
      ).toEqual([]);
    },
  );
});
