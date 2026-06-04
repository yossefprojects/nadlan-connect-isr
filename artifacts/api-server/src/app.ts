import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import { db } from "@workspace/db";
import { listingsTable, programsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  serveListingsPage,
  serveListingDetailPage,
  serveProgrammeDetailPage,
  serveAnalyseIAPage,
} from "./lib/ssr-pages";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.get("/sitemap.xml", async (_req: Request, res: Response) => {
  try {
    const domain =
      process.env["REPLIT_DOMAINS"]?.split(",")[0]?.trim() ??
      "nadlanconnect.replit.app";
    const base = `https://${domain}`;

    const [listings, programmes] = await Promise.all([
      db
        .select({ slug: listingsTable.slug, updatedAt: listingsTable.updatedAt })
        .from(listingsTable)
        .where(eq(listingsTable.status, "published")),
      db
        .select({ slug: programsTable.slug, updatedAt: programsTable.updatedAt })
        .from(programsTable)
        .where(eq(programsTable.status, "published")),
    ]);

    const today = new Date().toISOString().split("T")[0];

    const staticUrls = [
      { loc: base, changefreq: "daily", priority: "1.0" },
      { loc: `${base}/listings`, changefreq: "daily", priority: "0.9" },
      {
        loc: `${base}/outils/analyse-ia`,
        changefreq: "monthly",
        priority: "0.7",
      },
      { loc: `${base}/cgu`, changefreq: "yearly", priority: "0.3" },
      { loc: `${base}/cgv`, changefreq: "yearly", priority: "0.3" },
    ];

    const listingUrls = listings.map((l) => ({
      loc: `${base}/listings/${l.slug}`,
      lastmod: l.updatedAt
        ? new Date(l.updatedAt).toISOString().split("T")[0]
        : today,
      changefreq: "weekly",
      priority: "0.8",
    }));

    const programmeUrls = programmes.map((p) => ({
      loc: `${base}/programme/${p.slug}`,
      lastmod: p.updatedAt
        ? new Date(p.updatedAt).toISOString().split("T")[0]
        : today,
      changefreq: "weekly",
      priority: "0.8",
    }));

    const allUrls = [...staticUrls, ...listingUrls, ...programmeUrls];

    const urlXml = allUrls
      .map((u) => {
        const lastmod = "lastmod" in u ? `\n    <lastmod>${u.lastmod}</lastmod>` : "";
        return `  <url>
    <loc>${u.loc}</loc>${lastmod}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlXml}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    logger.error({ err }, "Failed to generate sitemap");
    res.status(500).send("Internal Server Error");
  }
});

app.use("/api", router);

app.get("/listings", (_req: Request, res: Response) => {
  serveListingsPage(res);
});

app.get("/listings/:idOrSlug", (req: Request, res: Response) => {
  serveListingDetailPage(String(req.params.idOrSlug), res);
});

app.get("/programme/:slug", (req: Request, res: Response) => {
  serveProgrammeDetailPage(String(req.params.slug), res);
});

app.get("/outils/analyse-ia", (_req: Request, res: Response) => {
  serveAnalyseIAPage(res);
});

export default app;
