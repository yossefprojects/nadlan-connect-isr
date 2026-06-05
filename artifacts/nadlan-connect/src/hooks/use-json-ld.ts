import { useEffect } from "react";

const SCRIPT_ID = "json-ld-structured-data";

export function useJsonLd(schema: Record<string, unknown> | null) {
  useEffect(() => {
    let el = document.head.querySelector<HTMLScriptElement>(`#${SCRIPT_ID}`);

    if (!schema) {
      if (el) el.remove();
      return;
    }

    if (!el) {
      el = document.createElement("script");
      el.id = SCRIPT_ID;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }

    el.textContent = JSON.stringify(schema);

    return () => {
      const existing = document.head.querySelector<HTMLScriptElement>(`#${SCRIPT_ID}`);
      if (existing) existing.remove();
    };
  }, [schema ? JSON.stringify(schema) : null]); // eslint-disable-line react-hooks/exhaustive-deps
}
