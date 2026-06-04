import { useEffect } from "react";

const DEFAULT_TITLE = "NadlanConnect — Immobilier en Israël";
const DEFAULT_DESCRIPTION =
  "NadlanConnect : achetez, investissez et trouvez les meilleures propriétés en Israël. Annonces exclusives, estimation IA, score d'investissement, et connexion directe avec promoteurs et agences.";
const DEFAULT_IMAGE = "/opengraph.jpg";

interface PageMetaOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const match = selector.match(/\[(\w[\w-]*)="([^"]+)"\]/);
    if (match) {
      el.setAttribute(match[1], match[2]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function removeCanonical() {
  const el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (el) el.remove();
}

export function usePageMeta({ title, description, image, url }: PageMetaOptions) {
  useEffect(() => {
    const resolvedTitle = title ?? DEFAULT_TITLE;
    const resolvedDescription = description ?? DEFAULT_DESCRIPTION;
    const resolvedImage = image ?? DEFAULT_IMAGE;
    const resolvedUrl = url ?? (window.location.origin + window.location.pathname);

    document.title = resolvedTitle;

    setMeta('meta[name="description"]', "content", resolvedDescription);
    setMeta('meta[property="og:title"]', "content", resolvedTitle);
    setMeta('meta[property="og:description"]', "content", resolvedDescription);
    setMeta('meta[property="og:image"]', "content", resolvedImage);
    setMeta('meta[property="og:url"]', "content", resolvedUrl);
    setMeta('meta[name="twitter:title"]', "content", resolvedTitle);
    setMeta('meta[name="twitter:description"]', "content", resolvedDescription);
    setMeta('meta[name="twitter:image"]', "content", resolvedImage);

    setCanonical(resolvedUrl);

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta('meta[name="description"]', "content", DEFAULT_DESCRIPTION);
      setMeta('meta[property="og:title"]', "content", DEFAULT_TITLE);
      setMeta('meta[property="og:description"]', "content", DEFAULT_DESCRIPTION);
      setMeta('meta[property="og:image"]', "content", DEFAULT_IMAGE);
      setMeta('meta[property="og:url"]', "content", window.location.origin + "/");
      setMeta('meta[name="twitter:title"]', "content", DEFAULT_TITLE);
      setMeta('meta[name="twitter:description"]', "content", DEFAULT_DESCRIPTION);
      setMeta('meta[name="twitter:image"]', "content", DEFAULT_IMAGE);
      removeCanonical();
    };
  }, [title, description, image, url]);
}
