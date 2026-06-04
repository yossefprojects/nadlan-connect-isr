import fs from "fs";
import path from "path";
import type { Response } from "express";
import { db } from "@workspace/db";
import { listingsTable, programsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { logger } from "./logger";

const VILLE_LABELS: Record<string, string> = {
  tlv: "Tel Aviv",
  jer: "Jérusalem",
  hfa: "Haïfa",
  bs: "Beer-Sheva",
  nat: "Netanya",
  ash: "Ashdod",
};

const DEFAULT_OG_IMAGE = "/opengraph.jpg";

interface MetaOptions {
  title: string;
  description: string;
  image?: string;
  canonical: string;
}

function getTemplatePath(): string {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    return path.join(process.cwd(), "artifacts/nadlan-connect/dist/public/index.html");
  }
  return path.join(process.cwd(), "../nadlan-connect/index.html");
}

let cachedTemplate: string | null = null;

function getHtmlTemplate(): string {
  if (!cachedTemplate) {
    cachedTemplate = fs.readFileSync(getTemplatePath(), "utf-8");
  }
  return cachedTemplate;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function injectMeta(html: string, meta: MetaOptions): string {
  const { title, description, canonical } = meta;
  const image = meta.image ?? DEFAULT_OG_IMAGE;
  const safeTitle = esc(title);
  const safeDesc = esc(description);

  let result = html;

  result = result.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`);

  result = result.replace(
    /(<meta name="description"\s+content=")[^"]*(")/,
    `$1${safeDesc}$2`
  );

  result = result.replace(
    /(<meta property="og:title"\s+content=")[^"]*(")/,
    `$1${safeTitle}$2`
  );
  result = result.replace(
    /(<meta property="og:description"\s+content=")[^"]*(")/,
    `$1${safeDesc}$2`
  );
  result = result.replace(
    /(<meta property="og:image"\s+content=")[^"]*(")/,
    `$1${esc(image)}$2`
  );

  if (result.includes('property="og:url"')) {
    result = result.replace(
      /(<meta property="og:url"\s+content=")[^"]*(")/,
      `$1${canonical}$2`
    );
  } else {
    result = result.replace(
      /(<meta property="og:type")(\s)/,
      `<meta property="og:url" content="${canonical}" />\n    $1$2`
    );
  }

  result = result.replace(
    /(<meta name="twitter:title"\s+content=")[^"]*(")/,
    `$1${safeTitle}$2`
  );
  result = result.replace(
    /(<meta name="twitter:description"\s+content=")[^"]*(")/,
    `$1${safeDesc}$2`
  );
  result = result.replace(
    /(<meta name="twitter:image"\s+content=")[^"]*(")/,
    `$1${esc(image)}$2`
  );

  if (result.includes('rel="canonical"')) {
    result = result.replace(
      /(<link rel="canonical"\s+href=")[^"]*(")/,
      `$1${canonical}$2`
    );
  } else {
    result = result.replace(
      "</head>",
      `  <link rel="canonical" href="${canonical}" />\n  </head>`
    );
  }

  return result;
}

function getCanonicalBase(): string {
  const domain =
    process.env["REPLIT_DOMAINS"]?.split(",")[0]?.trim() ??
    "nadlanconnect.replit.app";
  return `https://${domain}`;
}

export async function serveListingsPage(res: Response): Promise<void> {
  try {
    const template = getHtmlTemplate();
    const canonical = `${getCanonicalBase()}/listings`;
    const html = injectMeta(template, {
      title: "Catalogue Immobilier en Israël — NadlanConnect",
      description:
        "Parcourez les annonces immobilières en Israël : appartements, villas, programmes neufs à Tel Aviv, Jérusalem, Haïfa et partout en Israël. Filtrez par ville, type et budget.",
      canonical,
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(html);
  } catch (err) {
    logger.error({ err }, "ssr-pages: failed to serve /listings");
    res.status(500).send("Internal Server Error");
  }
}

export async function serveListingDetailPage(
  idOrSlug: string,
  res: Response
): Promise<void> {
  try {
    const isNumeric = /^\d+$/.test(idOrSlug);
    const whereClause = isNumeric
      ? or(eq(listingsTable.slug, idOrSlug), eq(listingsTable.id, parseInt(idOrSlug, 10)))
      : eq(listingsTable.slug, idOrSlug);

    const rows = await db
      .select({
        title: listingsTable.title,
        description: listingsTable.description,
        ville: listingsTable.ville,
        quartier: listingsTable.quartier,
        surface: listingsTable.surface,
        price: listingsTable.price,
        investmentScore: listingsTable.investmentScore,
        slug: listingsTable.slug,
      })
      .from(listingsTable)
      .where(whereClause)
      .limit(1);

    const listing = rows[0];
    const template = getHtmlTemplate();
    const base = getCanonicalBase();

    if (!listing) {
      const html = injectMeta(template, {
        title: "Bien introuvable — NadlanConnect",
        description:
          "Cette propriété n'existe pas ou n'est plus disponible sur NadlanConnect.",
        canonical: `${base}/listings`,
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(404).send(html);
      return;
    }

    const villeLabel = VILLE_LABELS[listing.ville] ?? listing.ville;
    const canonical = `${base}/listings/${listing.slug}`;
    const title = `${listing.title} — ${villeLabel} | NadlanConnect`;
    const desc = `${listing.title} à ${villeLabel}${listing.quartier ? ` · ${listing.quartier}` : ""} — ${listing.surface} m², ${listing.price.toLocaleString("fr-FR")} ₪. Score d'investissement : ${listing.investmentScore ?? "—"}/100. Découvrez ce bien sur NadlanConnect.`;

    const html = injectMeta(template, { title, description: desc, canonical });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(html);
  } catch (err) {
    logger.error({ err }, "ssr-pages: failed to serve /listings/:slug");
    res.status(500).send("Internal Server Error");
  }
}

export async function serveProgrammeDetailPage(
  slug: string,
  res: Response
): Promise<void> {
  try {
    const rows = await db
      .select({
        title: programsTable.title,
        description: programsTable.description,
        ville: programsTable.ville,
        quartier: programsTable.quartier,
        slug: programsTable.slug,
      })
      .from(programsTable)
      .where(eq(programsTable.slug, slug))
      .limit(1);

    const programme = rows[0];
    const template = getHtmlTemplate();
    const base = getCanonicalBase();

    if (!programme) {
      const html = injectMeta(template, {
        title: "Programme introuvable — NadlanConnect",
        description:
          "Ce programme immobilier n'existe pas ou n'est plus disponible sur NadlanConnect.",
        canonical: `${base}/listings`,
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(404).send(html);
      return;
    }

    const villeLabel = VILLE_LABELS[programme.ville] ?? programme.ville;
    const canonical = `${base}/programme/${programme.slug}`;
    const title = `${programme.title} — Programme Neuf à ${villeLabel} | NadlanConnect`;
    const desc = `${programme.title} à ${villeLabel}${programme.quartier ? ` · ${programme.quartier}` : ""} — Programme immobilier neuf en Israël. Découvrez les projets et appartements disponibles sur NadlanConnect.`;

    const html = injectMeta(template, { title, description: desc, canonical });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(html);
  } catch (err) {
    logger.error({ err }, "ssr-pages: failed to serve /programme/:slug");
    res.status(500).send("Internal Server Error");
  }
}

export async function serveAnalyseIAPage(res: Response): Promise<void> {
  try {
    const template = getHtmlTemplate();
    const canonical = `${getCanonicalBase()}/outils/analyse-ia`;
    const html = injectMeta(template, {
      title: "Analyse IA Immobilière — Dashboard Investisseur | NadlanConnect",
      description:
        "Analysez n'importe quel bien immobilier en Israël grâce à l'IA : estimation du prix au m², rendement locatif, budget rénovation, potentiel urbain TAMA38/Pinoui Binoui et score d'investissement personnalisé.",
      canonical,
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(html);
  } catch (err) {
    logger.error({ err }, "ssr-pages: failed to serve /outils/analyse-ia");
    res.status(500).send("Internal Server Error");
  }
}
