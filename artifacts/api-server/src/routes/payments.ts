import { Router, type Request } from "express";
import { db, subscriptionsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/authMiddleware";
import {
  generatePaymentLink,
  verifyCallback,
  payplusConfigured,
} from "../lib/payplus";
import { logger } from "../lib/logger";

const router = Router();

// Plan catalogue. Keys are unambiguous (role baked into the key); `interval`
// drives the PayPlus recurrence so the annual plan is not charged every month.
const PLANS: Record<string, { amount: number; label: string; interval: "monthly" | "yearly" }> = {
  agent_mensuel: { amount: 300, label: "NadlanConnect — Agent immobilier (mensuel)", interval: "monthly" },
  introducer_annuel: { amount: 1000, label: "NadlanConnect — Abonnement annuel", interval: "yearly" },
};

function publicBase(req: Request): string {
  return process.env.APP_URL ?? `${req.protocol}://${req.get("host")}`;
}

// POST /payments/checkout — create a PayPlus payment page for the chosen plan.
router.post("/payments/checkout", requireAuth, async (req, res): Promise<void> => {
  if (!payplusConfigured()) {
    res.status(503).json({ error: "Paiement non configuré (clés PayPlus manquantes)." });
    return;
  }
  const planKey = typeof req.body?.plan === "string" ? req.body.plan : "";
  const plan = PLANS[planKey];
  if (!plan) {
    res.status(400).json({ error: "Plan inconnu." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "Utilisateur introuvable." });
    return;
  }

  // Record a pending subscription, then create the hosted payment page.
  const [sub] = await db
    .insert(subscriptionsTable)
    .values({ userId: user.id, plan: planKey, amount: plan.amount, status: "pending" })
    .returning();

  const base = publicBase(req);
  const name =
    user.fullName ||
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email;

  try {
    const { link, pageRequestUid } = await generatePaymentLink({
      amount: plan.amount,
      planLabel: plan.label,
      customerName: name,
      customerEmail: user.email,
      recurring: true,
      recurringType: plan.interval,
      refURL_success: `${base}/abonnement/merci`,
      refURL_failure: `${base}/abonnement?status=echec`,
      refURL_callback: `${base}/payments/payplus/callback`,
    });
    await db
      .update(subscriptionsTable)
      .set({ pageRequestUid })
      .where(eq(subscriptionsTable.id, sub.id));
    res.json({ url: link });
  } catch (err) {
    logger.error({ err }, "PayPlus checkout failed");
    await db
      .update(subscriptionsTable)
      .set({ status: "failed" })
      .where(eq(subscriptionsTable.id, sub.id));
    res.status(502).json({ error: "Échec de la création du paiement." });
  }
});

// POST /payments/payplus/callback — PayPlus server-to-server IPN.
// Field names below are best-effort; the first real payload is logged so the
// mapping can be confirmed against an actual PayPlus IPN.
router.post("/payments/payplus/callback", async (req, res): Promise<void> => {
  const ok = verifyCallback(
    JSON.stringify(req.body),
    req.get("hash"),
    req.get("user-agent"),
  );
  if (!ok) {
    res.status(403).json({ error: "Invalid signature" });
    return;
  }

  logger.info({ body: req.body }, "PayPlus IPN received");

  const b = (req.body ?? {}) as Record<string, any>;
  const tx = (b.transaction ?? b.data ?? b) as Record<string, any>;
  const pageRequestUid = tx.page_request_uid ?? b.page_request_uid;
  const statusCode = tx.status_code ?? b.status_code;
  const paid =
    statusCode === "000" || statusCode === 0 || tx.status === "approved";

  if (pageRequestUid) {
    await db
      .update(subscriptionsTable)
      .set({
        status: paid ? "active" : "failed",
        transactionUid: tx.transaction_uid ?? tx.uid ?? null,
        token: tx.token ?? null,
        recurringUid: tx.recurring_uid ?? null,
        currentPeriodEnd: paid
          ? new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)
          : null,
      })
      .where(eq(subscriptionsTable.pageRequestUid, pageRequestUid));
  }

  // Always 200 once received & verified, so PayPlus stops retrying.
  res.json({ received: true });
});

// GET /payments/subscription — the caller's current subscription (gating + billing UI).
router.get("/payments/subscription", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, req.user!.id))
    .orderBy(desc(subscriptionsTable.createdAt));

  const now = new Date();
  const active = rows.find(
    (s) =>
      s.status === "active" &&
      (!s.currentPeriodEnd || s.currentPeriodEnd > now),
  );

  res.json({
    active: Boolean(active),
    plan: active?.plan ?? null,
    currentPeriodEnd: active?.currentPeriodEnd ?? null,
  });
});

export default router;
