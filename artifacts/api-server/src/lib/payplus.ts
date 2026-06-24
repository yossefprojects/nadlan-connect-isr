// PayPlus payment gateway (Israel) — hosted payment page with card / Apple Pay /
// Google Pay, recurring subscriptions, and a server-to-server IPN callback.
// Docs: https://docs.payplus.co.il/reference/post_paymentpages-generatelink
import crypto from "crypto";
import { logger } from "./logger";

const PROD = "https://restapi.payplus.co.il/api/v1.0";
const DEV = "https://restapidev.payplus.co.il/api/v1.0";

function baseUrl(): string {
  return (process.env.PAYPLUS_ENV ?? "prod").toLowerCase() === "dev" ? DEV : PROD;
}

export function payplusConfigured(): boolean {
  return Boolean(
    process.env.PAYPLUS_API_KEY &&
      process.env.PAYPLUS_SECRET_KEY &&
      process.env.PAYPLUS_PAGE_UID,
  );
}

export interface GenerateLinkParams {
  amount: number; // NIS (main unit)
  currency?: string;
  planLabel: string;
  customerName: string;
  customerEmail: string;
  recurring?: boolean;
  recurringType?: "monthly" | "yearly";
  refURL_success: string;
  refURL_failure: string;
  refURL_callback: string;
}

export async function generatePaymentLink(
  p: GenerateLinkParams,
): Promise<{ link: string; pageRequestUid: string }> {
  const body: Record<string, unknown> = {
    payment_page_uid: process.env.PAYPLUS_PAGE_UID,
    amount: p.amount,
    currency_code: p.currency ?? "ILS",
    sendEmailApproval: true,
    sendEmailFailure: false,
    // 3 = recurring charge, 1 = single charge.
    charge_method: p.recurring ? 3 : 1,
    create_token: true,
    // Wallets must also be enabled on the PayPlus account/terminal.
    allowed_charge_methods: ["credit-card", "apple-pay", "google-pay"],
    customer: { customer_name: p.customerName, email: p.customerEmail },
    items: [{ name: p.planLabel, quantity: 1, price: p.amount }],
    refURL_success: p.refURL_success,
    refURL_failure: p.refURL_failure,
    refURL_callback: p.refURL_callback,
  };
  if (p.recurring) {
    // TODO: confirm the exact recurring_settings schema against your PayPlus plan
    // (cadence / start date / number of charges). Logged IPN payloads will guide it.
    body.recurring_settings = { recurring_type: p.recurringType ?? "monthly" };
  }

  const res = await fetch(`${baseUrl()}/PaymentPages/generateLink`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.PAYPLUS_API_KEY!,
      "secret-key": process.env.PAYPLUS_SECRET_KEY!,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as
    | { results?: { status?: string }; data?: { payment_page_link?: string; page_request_uid?: string } }
    | null;

  if (!res.ok || json?.results?.status !== "success" || !json?.data?.payment_page_link) {
    logger.error({ status: res.status, json }, "PayPlus generateLink failed");
    throw new Error("PayPlus link generation failed");
  }
  return {
    link: json.data.payment_page_link,
    pageRequestUid: json.data.page_request_uid ?? "",
  };
}

/**
 * Verify a PayPlus IPN/callback is authentic:
 *   hash header === base64(HMAC-SHA256(rawJsonBody, secretKey))   and   user-agent === "PayPlus".
 */
export function verifyCallback(
  rawBody: string,
  hashHeader: string | undefined,
  userAgent: string | undefined,
): boolean {
  if (userAgent !== "PayPlus") return false;
  const secret = process.env.PAYPLUS_SECRET_KEY;
  if (!hashHeader || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(hashHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
