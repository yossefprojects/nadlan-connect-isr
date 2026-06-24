import type { Request, Response, NextFunction } from "express";

type Bucket = { count: number; resetAt: number };

/**
 * Lightweight in-memory rate limiter (no external dependency).
 * Keyed by client IP. Suitable for protecting public, unauthenticated
 * endpoints (registration, login) against bulk abuse / spam.
 *
 * Note: in-memory state is per-process. For multi-instance deployments,
 * back this with a shared store (e.g. Redis) — kept in-memory here to match
 * the existing approach used for the AI routes.
 */
export function rateLimit(opts: {
  windowMs: number;
  max: number;
  name?: string;
}) {
  const hits = new Map<string, Bucket>();
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const fwd = req.headers["x-forwarded-for"];
    const ip =
      (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown";
    const key = `${opts.name ?? "rl"}:${ip}`;

    const bucket = hits.get(key);
    if (!bucket || now > bucket.resetAt) {
      hits.set(key, { count: 1, resetAt: now + opts.windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > opts.max) {
        const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
        res.setHeader("Retry-After", String(retryAfter));
        res
          .status(429)
          .json({ error: "Trop de requêtes, réessayez dans un instant." });
        return;
      }
    }

    // Opportunistic cleanup so the map can't grow unbounded.
    if (hits.size > 5000) {
      for (const [k, v] of hits) {
        if (now > v.resetAt) hits.delete(k);
      }
    }

    next();
  };
}
