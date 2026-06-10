// Resend email integration (via Replit Connectors proxy).
// Added through the Replit "resend" integration — credentials are served by the
// connectors proxy; no API key is stored in the project.
import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "./logger";

const connectors = new ReplitConnectors();

// Sender address. Resend requires a verified domain in production; until a domain
// is verified, Resend's shared "onboarding@resend.dev" sender works for testing.
const FROM_ADDRESS = process.env.DEMOLITION_EMAIL_FROM ?? "NadlanConnect <onboarding@resend.dev>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<void> {
  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      html,
      ...(text ? { text } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend responded ${response.status}: ${detail}`);
  }
}

interface NewOfferEmailData {
  ownerName: string;
  ownerEmail: string;
  buildingAddress: string;
  buildingCity: string;
  promoterName: string | null;
  promoterCompany: string | null;
  pricePerUnit: number;
  newUnitsOffer: number;
  timeline: string;
  message: string;
}

const NIS = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} ₪`;

/**
 * Notify the building owner that a promoter submitted a new offer.
 * Best-effort: callers should not block their HTTP response on this — log and
 * swallow failures so a flaky email provider never breaks the offer flow.
 */
export async function sendNewOfferEmail(data: NewOfferEmailData): Promise<void> {
  const promoter = data.promoterCompany
    ? `${data.promoterName ?? "Un promoteur"} (${data.promoterCompany})`
    : data.promoterName ?? "Un promoteur";

  const subject = `Nouvelle offre pour votre immeuble — ${data.buildingAddress}, ${data.buildingCity}`;

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color: #0F2235; max-width: 560px; margin: 0 auto;">
    <div style="background:#0F2235;padding:24px 28px;border-radius:12px 12px 0 0;">
      <h1 style="color:#C9A84C;margin:0;font-size:20px;">NadlanConnect</h1>
      <p style="color:#F8F7F4;margin:6px 0 0;font-size:14px;">Marché Tama 38 / Pinui-Binui</p>
    </div>
    <div style="border:1px solid #e5e2da;border-top:none;border-radius:0 0 12px 12px;padding:28px;">
      <p style="font-size:15px;">Bonjour ${data.ownerName},</p>
      <p style="font-size:15px;">Vous avez reçu une <strong>nouvelle offre</strong> de la part de <strong>${promoter}</strong> pour votre immeuble situé au <strong>${data.buildingAddress}, ${data.buildingCity}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr><td style="padding:8px 0;color:#6b7280;">Prix par appartement</td><td style="padding:8px 0;text-align:right;font-weight:600;">${NIS(data.pricePerUnit)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Nouveaux logements proposés</td><td style="padding:8px 0;text-align:right;font-weight:600;">${data.newUnitsOffer}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Délai estimé</td><td style="padding:8px 0;text-align:right;font-weight:600;">${data.timeline}</td></tr>
      </table>
      <div style="background:#F8F7F4;border-radius:8px;padding:16px;font-size:14px;">
        <p style="margin:0 0 6px;color:#6b7280;">Message du promoteur :</p>
        <p style="margin:0;white-space:pre-wrap;">${data.message}</p>
      </div>
      <p style="font-size:13px;color:#6b7280;margin-top:24px;">Connectez-vous à votre espace NadlanConnect pour consulter et comparer toutes les offres reçues.</p>
    </div>
  </div>`;

  const text = `Bonjour ${data.ownerName},

Vous avez reçu une nouvelle offre de ${promoter} pour votre immeuble situé au ${data.buildingAddress}, ${data.buildingCity}.

Prix par appartement : ${NIS(data.pricePerUnit)}
Nouveaux logements proposés : ${data.newUnitsOffer}
Délai estimé : ${data.timeline}

Message du promoteur :
${data.message}

Connectez-vous à votre espace NadlanConnect pour consulter toutes les offres.`;

  try {
    await sendEmail({ to: data.ownerEmail, subject, html, text });
  } catch (err) {
    logger.error({ err }, "Failed to send new-offer notification email");
  }
}
