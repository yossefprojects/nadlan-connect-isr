/**
 * Post-build prerender script for NadlanConnect.
 *
 * Run after `vite build`. Reads dist/public/index.html as a template and
 * generates per-route HTML files with route-specific <title>, <meta>, OG tags,
 * JSON-LD structured data, and a <noscript> content block for crawlers.
 *
 * Requires DATABASE_URL to prerender dynamic listing/programme routes.
 * If DATABASE_URL is absent, only static routes are prerendered.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { safeJsonLd } from "./src/lib/prerender-utils.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, "dist/public");
const TEMPLATE_PATH = join(DIST_DIR, "index.html");

// ─── Site metadata ────────────────────────────────────────────────────────────

const DOMAINS = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim() ?? "";
const SITE_URL = DOMAINS ? `https://${DOMAINS}` : "https://nadlanconnect.com";
const DEFAULT_IMAGE = `${SITE_URL}/opengraph.jpg`;
const DEFAULT_TITLE = "NadlanConnect — Immobilier en Israël";
const DEFAULT_DESC =
  "NadlanConnect : achetez, investissez et trouvez les meilleures propriétés en Israël. Annonces exclusives, estimation IA, score d'investissement, et connexion directe avec promoteurs et agences.";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CITY_LABELS: Record<string, string> = {
  tlv: "Tel Aviv",
  jer: "Jérusalem",
  hfa: "Haïfa",
  bs: "Beer-Sheva",
  nat: "Netanya",
  ash: "Ashdod",
};

function cityLabel(ville: string): string {
  return CITY_LABELS[ville] ?? ville;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function esc(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─── HTML injection ───────────────────────────────────────────────────────────

interface RouteOptions {
  title: string;
  description: string;
  image?: string;
  url: string;
  noindex?: boolean;
  jsonLd?: object;
  noscriptHtml?: string;
}

function buildHead(opts: RouteOptions): string {
  const {
    title,
    description,
    image = DEFAULT_IMAGE,
    url,
    noindex = false,
    jsonLd,
    noscriptHtml,
  } = opts;

  const robotsContent = noindex ? "noindex, nofollow" : "index, follow";
  const jsonLdBlock = jsonLd
    ? `  <script type="application/ld+json">${safeJsonLd(jsonLd)}</script>`
    : "";

  return `  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="robots" content="${robotsContent}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <link rel="canonical" href="${esc(url)}" />
${jsonLdBlock}`;
}

/**
 * Replace the <head> meta content in the template HTML and optionally inject a
 * <noscript> static content block into the <body> for crawlers.
 */
function renderPage(template: string, opts: RouteOptions): string {
  // Strip existing title, description, robots, og, twitter meta tags and any
  // existing canonical so we can inject fresh ones.
  let html = template
    .replace(/<title>[^<]*<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/gi, "")
    .replace(/<meta\s+name="robots"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "");

  // Inject before </head>
  html = html.replace("</head>", `${buildHead(opts)}\n</head>`);

  // Inject noscript static content before </body> for non-JS crawlers
  if (opts.noscriptHtml) {
    html = html.replace(
      "</body>",
      `<noscript id="prerender-content" aria-hidden="true" style="display:none">${opts.noscriptHtml}</noscript>\n</body>`,
    );
  }

  return html;
}

// ─── Write a route's HTML file ────────────────────────────────────────────────

async function writeRoute(
  template: string,
  routePath: string,
  opts: RouteOptions,
): Promise<void> {
  const html = renderPage(template, opts);
  // e.g. routePath="" → dist/public/index.html
  //      routePath="listings" → dist/public/listings/index.html
  const filePath = routePath
    ? join(DIST_DIR, routePath, "index.html")
    : join(DIST_DIR, "index.html");
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, html, "utf-8");
  console.log(`  ✓ /${routePath}`);
}

// ─── Static routes ────────────────────────────────────────────────────────────

async function prerenderStaticRoutes(template: string): Promise<void> {
  console.log("\nPrerendering static routes…");

  // Home
  await writeRoute(template, "", {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    url: SITE_URL + "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "NadlanConnect",
      url: SITE_URL,
      description: DEFAULT_DESC,
      inLanguage: ["fr", "en", "he"],
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/listings?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    noscriptHtml: `<main>
<h1>NadlanConnect — Immobilier en Israël</h1>
<p>${esc(DEFAULT_DESC)}</p>
<nav><a href="/listings">Voir toutes les annonces</a> | <a href="/outils/analyse-ia">Analyse IA</a></nav>
</main>`,
  });

  // Listings catalogue
  await writeRoute(template, "listings", {
    title: "Catalogue Immobilier en Israël — NadlanConnect",
    description:
      "Parcourez les annonces immobilières en Israël : appartements, villas, programmes neufs à Tel Aviv, Jérusalem, Haïfa et partout en Israël. Filtrez par ville, type et budget.",
    url: SITE_URL + "/listings",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Catalogue Immobilier en Israël",
      description:
        "Parcourez les annonces immobilières en Israël : appartements, villas, programmes neufs à Tel Aviv, Jérusalem, Haïfa et partout en Israël.",
      url: SITE_URL + "/listings",
      publisher: {
        "@type": "Organization",
        name: "NadlanConnect",
        url: SITE_URL,
      },
    },
    noscriptHtml: `<main>
<h1>Catalogue Immobilier en Israël</h1>
<p>Parcourez les annonces immobilières en Israël : appartements, villas, programmes neufs à Tel Aviv, Jérusalem, Haïfa et partout en Israël.</p>
<p><a href="${esc(SITE_URL)}">Retour à l'accueil</a></p>
</main>`,
  });

  // AI analysis tool
  await writeRoute(template, "outils/analyse-ia", {
    title: "Analyse IA d'un Bien Immobilier — NadlanConnect",
    description:
      "Obtenez une analyse d'investissement complète par intelligence artificielle : estimation de prix, rendement locatif, score d'investissement, potentiel de rénovation et recommandations personnalisées.",
    url: SITE_URL + "/outils/analyse-ia",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Analyse IA Immobilière",
      description:
        "Outil d'analyse d'investissement immobilier par IA pour le marché israélien.",
      url: SITE_URL + "/outils/analyse-ia",
      applicationCategory: "FinanceApplication",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
    noscriptHtml: `<main>
<h1>Analyse IA d'un Bien Immobilier</h1>
<p>Obtenez une analyse d'investissement complète : estimation de prix au m², rendement locatif, score d'investissement, et recommandations personnalisées pour le marché immobilier israélien.</p>
<p><a href="${esc(SITE_URL)}/listings">Voir les annonces</a></p>
</main>`,
  });

  // CGU
  await writeRoute(template, "cgu", {
    title: "Conditions Générales d'Utilisation — NadlanConnect",
    description:
      "Consultez les conditions générales d'utilisation de la plateforme NadlanConnect.",
    url: SITE_URL + "/cgu",
    noscriptHtml: `<main><h1>Conditions Générales d'Utilisation — NadlanConnect</h1></main>`,
  });

  // CGV
  await writeRoute(template, "cgv", {
    title: "Conditions Générales de Vente — NadlanConnect",
    description:
      "Consultez les conditions générales de vente de la plateforme NadlanConnect.",
    url: SITE_URL + "/cgv",
    noscriptHtml: `<main><h1>Conditions Générales de Vente — NadlanConnect</h1></main>`,
  });
}

// ─── Dynamic routes (DB required) ────────────────────────────────────────────

async function prerenderDynamicRoutes(template: string): Promise<void> {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production") {
      // In production the static server no longer has a /listings/* catch-all
      // rewrite, so every listing/programme URL that is not prerendered will
      // return a genuine HTTP 404.  That means DATABASE_URL MUST be available
      // at build time so all published slugs can be prerendered.
      console.error(
        "\nERROR: DATABASE_URL is required for production builds.\n" +
        "Without it, /listings/:slug and /programme/:slug routes cannot be\n" +
        "prerendered and will return 404 in the deployed app.",
      );
      process.exit(1);
    }
    console.warn(
      "\nWARN: DATABASE_URL not set — skipping dynamic routes.\n" +
      "In production builds this is a fatal error.  In development, set\n" +
      "DATABASE_URL to prerender listing/programme detail pages locally.",
    );
    return;
  }

  console.log("\nPrerendering dynamic routes…");

  // Use raw pg to avoid ESM directory-import issues with @workspace/db
  const pg = await import("pg");
  const Pool = pg.default?.Pool ?? (pg as { Pool: typeof import("pg").Pool }).Pool;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await prerenderListings(template, pool);
    await prerenderProgrammes(template, pool);
  } finally {
    await pool.end();
  }
}

interface PoolLike {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

async function prerenderListings(template: string, pool: PoolLike): Promise<void> {
  const { rows: listingsWithId } = await pool.query<{
    id: number;
    slug: string;
    title: string;
    description: string | null;
    ville: string;
    quartier: string | null;
    surface: number;
    nb_pieces: number;
    price: number;
    type: string;
    investment_score: number | null;
  }>(`
    SELECT id, slug, title, description, ville, quartier, surface, nb_pieces, price, type, investment_score
    FROM listings
    WHERE status = 'published'
    ORDER BY created_at DESC
  `);

  // Cover images (position = 0)
  const { rows: imageRows } = await pool.query<{ listing_id: number; url: string }>(`
    SELECT listing_id, url FROM listing_images WHERE position = 0
  `);
  const coverMap = new Map<number, string>();
  for (const row of imageRows) {
    if (!coverMap.has(row.listing_id)) coverMap.set(row.listing_id, row.url);
  }

  console.log(`  Found ${listingsWithId.length} published listings`);

  for (const listing of listingsWithId) {
    const nbPieces: number = (listing as unknown as { nb_pieces: number }).nb_pieces;
    const investmentScore: number | null = (listing as unknown as { investment_score: number | null }).investment_score;
    const city = cityLabel(listing.ville);
    const locationStr = listing.quartier
      ? `${listing.quartier}, ${city}`
      : city;
    const typeLabel =
      listing.type === "new_development" ? "Programme neuf" : "Revente";
    const priceStr = formatPrice(listing.price);
    const coverUrl = coverMap.get(listing.id);
    const listingUrl = `${SITE_URL}/listings/${listing.slug}`;

    const title = `${listing.title} — ${typeLabel} à ${city} | NadlanConnect`;
    const description = [
      `${typeLabel} à ${locationStr}.`,
      `${listing.surface} m², ${nbPieces} pièce${nbPieces > 1 ? "s" : ""}.`,
      `Prix : ${priceStr}.`,
      investmentScore != null
        ? `Score d'investissement : ${investmentScore}/100.`
        : "",
      listing.description
        ? listing.description.slice(0, 120) + "…"
        : "Découvrez cette propriété sur NadlanConnect.",
    ]
      .filter(Boolean)
      .join(" ");

    const jsonLd: object = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: listing.title,
      description: listing.description ?? description,
      url: listingUrl,
      ...(coverUrl ? { image: coverUrl } : {}),
      offers: {
        "@type": "Offer",
        price: listing.price,
        priceCurrency: "ILS",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: city,
        addressCountry: "IL",
        ...(listing.quartier ? { addressRegion: listing.quartier } : {}),
      },
      floorSize: {
        "@type": "QuantitativeValue",
        value: listing.surface,
        unitCode: "MTK",
      },
      numberOfRooms: nbPieces,
    };

    const noscriptHtml = `<main>
<h1>${esc(listing.title)}</h1>
<p>${esc(typeLabel)} — ${esc(locationStr)}</p>
<ul>
  <li>Surface : ${esc(String(listing.surface))} m²</li>
  <li>Pièces : ${esc(String(nbPieces))}</li>
  <li>Prix : ${esc(priceStr)}</li>
  ${investmentScore != null ? `<li>Score d'investissement : ${esc(String(investmentScore))}/100</li>` : ""}
</ul>
${listing.description ? `<p>${esc(listing.description.slice(0, 300))}</p>` : ""}
<p><a href="${esc(SITE_URL)}/listings">Voir toutes les annonces</a></p>
</main>`;

    await writeRoute(template, `listings/${listing.slug}`, {
      title,
      description,
      image: coverUrl ?? DEFAULT_IMAGE,
      url: listingUrl,
      jsonLd,
      noscriptHtml,
    });
  }
}

async function prerenderProgrammes(template: string, pool: PoolLike): Promise<void> {
  const { rows: programmes } = await pool.query(`
    SELECT id, slug, title, description, ville, quartier
    FROM programs
    WHERE status = 'published'
    ORDER BY created_at DESC
  `);

  console.log(`  Found ${programmes.length} published programmes`);

  for (const prog of programmes as Array<{
    id: number;
    slug: string;
    title: string;
    description: string | null;
    ville: string;
    quartier: string | null;
  }>) {
    const city = cityLabel(prog.ville);
    const locationStr = prog.quartier ? `${prog.quartier}, ${city}` : city;
    const progUrl = `${SITE_URL}/programme/${prog.slug}`;

    const title = `${prog.title} — Programme Neuf à ${city} | NadlanConnect`;
    const description = [
      `Programme immobilier neuf à ${locationStr}.`,
      prog.description
        ? prog.description.slice(0, 150) + "…"
        : "Découvrez ce programme neuf sur NadlanConnect.",
    ]
      .filter(Boolean)
      .join(" ");

    const jsonLd: object = {
      "@context": "https://schema.org",
      "@type": "Residence",
      name: prog.title,
      description: prog.description ?? description,
      url: progUrl,
      address: {
        "@type": "PostalAddress",
        addressLocality: city,
        addressCountry: "IL",
        ...(prog.quartier ? { addressRegion: prog.quartier } : {}),
      },
    };

    const noscriptHtml = `<main>
<h1>${esc(prog.title)}</h1>
<p>Programme neuf — ${esc(locationStr)}</p>
${prog.description ? `<p>${esc(prog.description.slice(0, 300))}</p>` : ""}
<p><a href="${esc(SITE_URL)}/listings">Voir toutes les annonces</a></p>
</main>`;

    await writeRoute(template, `programme/${prog.slug}`, {
      title,
      description,
      url: progUrl,
      jsonLd,
      noscriptHtml,
    });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Path of the pristine Vite-built template, preserved across multiple prerender
 * runs so that re-running prerender (without a full `vite build`) stays
 * idempotent and does not accumulate duplicate meta tags.
 *
 * `vite build` sets `emptyOutDir: true`, so this file is always removed before
 * a fresh build — the first prerender run after a build will recreate it from
 * the clean Vite output.
 */
const BACKUP_TEMPLATE_PATH = join(DIST_DIR, "_vite-template.html");

async function main(): Promise<void> {
  console.log("NadlanConnect prerender");
  console.log("=======================");
  console.log(`Dist dir : ${DIST_DIR}`);
  console.log(`Site URL : ${SITE_URL}`);

  if (!existsSync(TEMPLATE_PATH)) {
    console.error(`\nERROR: template not found at ${TEMPLATE_PATH}`);
    console.error("Run `vite build` first.");
    process.exit(1);
  }

  let template: string;
  if (existsSync(BACKUP_TEMPLATE_PATH)) {
    // Subsequent run — reuse the pristine Vite output so meta tags don't
    // accumulate across multiple prerender invocations.
    template = await readFile(BACKUP_TEMPLATE_PATH, "utf-8");
    console.log("Using saved Vite template (idempotent re-run).");
  } else {
    // First run after `vite build` — read the fresh output and save a backup.
    template = await readFile(TEMPLATE_PATH, "utf-8");
    await writeFile(BACKUP_TEMPLATE_PATH, template, "utf-8");
  }

  await prerenderStaticRoutes(template);
  await prerenderDynamicRoutes(template);

  console.log("\nPrerender complete.");
}

main().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
