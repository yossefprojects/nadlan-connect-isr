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
  newUnitArea: number;
  standing: string;
  constructionDurationMonths: number;
  message: string | null;
}

const NIS = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} ₪`;

const STANDING_LABEL: Record<string, string> = {
  standard: "Standard",
  high_end: "Haut de gamme",
  luxury: "Luxe",
};

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
        <tr><td style="padding:8px 0;color:#6b7280;">Surface du nouveau logement</td><td style="padding:8px 0;text-align:right;font-weight:600;">${data.newUnitArea} m²</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Nouveaux logements proposés</td><td style="padding:8px 0;text-align:right;font-weight:600;">${data.newUnitsOffer}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Standing</td><td style="padding:8px 0;text-align:right;font-weight:600;">${STANDING_LABEL[data.standing] ?? data.standing}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Durée de construction</td><td style="padding:8px 0;text-align:right;font-weight:600;">${data.constructionDurationMonths} mois</td></tr>
      </table>
      ${
        data.message
          ? `<div style="background:#F8F7F4;border-radius:8px;padding:16px;font-size:14px;">
        <p style="margin:0 0 6px;color:#6b7280;">Message du promoteur :</p>
        <p style="margin:0;white-space:pre-wrap;">${data.message}</p>
      </div>`
          : ""
      }
      <p style="font-size:13px;color:#6b7280;margin-top:24px;">Connectez-vous à votre espace NadlanConnect pour consulter et comparer toutes les offres reçues.</p>
    </div>
  </div>`;

  const text = `Bonjour ${data.ownerName},

Vous avez reçu une nouvelle offre de ${promoter} pour votre immeuble situé au ${data.buildingAddress}, ${data.buildingCity}.

Prix par appartement : ${NIS(data.pricePerUnit)}
Surface du nouveau logement : ${data.newUnitArea} m²
Nouveaux logements proposés : ${data.newUnitsOffer}
Standing : ${STANDING_LABEL[data.standing] ?? data.standing}
Durée de construction : ${data.constructionDurationMonths} mois
${data.message ? `\nMessage du promoteur :\n${data.message}\n` : ""}
Connectez-vous à votre espace NadlanConnect pour consulter toutes les offres.`;

  try {
    await sendEmail({ to: data.ownerEmail, subject, html, text });
  } catch (err) {
    logger.error({ err }, "Failed to send new-offer notification email");
  }
}

interface ConnectionValidatedEmailData {
  promoterName: string | null;
  promoterEmail: string | null;
  ownerName: string;
  ownerEmail: string;
  buildingAddress: string;
  buildingCity: string;
}

/**
 * Notify both parties that an introduction has been validated by NadlanConnect,
 * and that the exact address is now shared with the chosen promoter.
 * Best-effort: callers should not block their HTTP response on this.
 */
export async function sendConnectionValidatedEmail(
  data: ConnectionValidatedEmailData,
): Promise<void> {
  const location = `${data.buildingAddress}, ${data.buildingCity}`;
  const promoterName = data.promoterName ?? "le promoteur";

  const shell = (greeting: string, body: string) => `
  <div style="font-family: Arial, Helvetica, sans-serif; color: #0F2235; max-width: 560px; margin: 0 auto;">
    <div style="background:#0F2235;padding:24px 28px;border-radius:12px 12px 0 0;">
      <h1 style="color:#C9A84C;margin:0;font-size:20px;">NadlanConnect</h1>
      <p style="color:#F8F7F4;margin:6px 0 0;font-size:14px;">Marché Tama 38 / Pinui-Binui</p>
    </div>
    <div style="border:1px solid #e5e2da;border-top:none;border-radius:0 0 12px 12px;padding:28px;">
      <p style="font-size:15px;">${greeting}</p>
      ${body}
      <p style="font-size:13px;color:#6b7280;margin-top:24px;">Connectez-vous à votre espace NadlanConnect pour poursuivre les échanges.</p>
    </div>
  </div>`;

  // Notify the promoter — they can now see the exact address.
  if (data.promoterEmail) {
    try {
      await sendEmail({
        to: data.promoterEmail,
        subject: `Mise en relation validée — ${location}`,
        html: shell(
          `Bonjour ${promoterName},`,
          `<p style="font-size:15px;">Votre mise en relation pour l'immeuble <strong>${location}</strong> a été <strong>validée</strong> par NadlanConnect. L'adresse exacte et les coordonnées du propriétaire sont désormais visibles dans votre espace.</p>`,
        ),
        text: `Bonjour ${promoterName},\n\nVotre mise en relation pour l'immeuble ${location} a été validée par NadlanConnect. L'adresse exacte et les coordonnées du propriétaire sont désormais visibles dans votre espace.`,
      });
    } catch (err) {
      logger.error({ err }, "Failed to send connection-validated email to promoter");
    }
  }

  // Notify the owner — their chosen promoter has been put in touch.
  try {
    await sendEmail({
      to: data.ownerEmail,
      subject: `Mise en relation validée — ${location}`,
      html: shell(
        `Bonjour ${data.ownerName},`,
        `<p style="font-size:15px;">La mise en relation avec <strong>${promoterName}</strong> pour votre immeuble <strong>${location}</strong> a été <strong>validée</strong>. Le promoteur dispose maintenant de vos coordonnées pour vous contacter.</p>`,
      ),
      text: `Bonjour ${data.ownerName},\n\nLa mise en relation avec ${promoterName} pour votre immeuble ${location} a été validée. Le promoteur dispose maintenant de vos coordonnées pour vous contacter.`,
    });
  } catch (err) {
    logger.error({ err }, "Failed to send connection-validated email to owner");
  }
}

interface OfferDecisionEmailData {
  promoterName: string | null;
  promoterEmail: string | null;
  buildingCity: string;
  buildingNeighborhood: string | null;
}

// Generic branded shell reused by the accept/reject notifications. The exact
// address is deliberately NOT included — it is revealed only after an admin
// validates the introduction (commission gate).
function offerEmailShell(greeting: string, body: string): string {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; color: #0F2235; max-width: 560px; margin: 0 auto;">
    <div style="background:#0F2235;padding:24px 28px;border-radius:12px 12px 0 0;">
      <h1 style="color:#C9A84C;margin:0;font-size:20px;">NadlanConnect</h1>
      <p style="color:#F8F7F4;margin:6px 0 0;font-size:14px;">Marché Tama 38 / Pinui-Binui</p>
    </div>
    <div style="border:1px solid #e5e2da;border-top:none;border-radius:0 0 12px 12px;padding:28px;">
      <p style="font-size:15px;">${greeting}</p>
      ${body}
      <p style="font-size:13px;color:#6b7280;margin-top:24px;">Connectez-vous à votre espace NadlanConnect pour suivre vos dossiers.</p>
    </div>
  </div>`;
}

function offerLocationLabel(data: OfferDecisionEmailData): string {
  return data.buildingNeighborhood
    ? `${data.buildingNeighborhood}, ${data.buildingCity}`
    : data.buildingCity;
}

/**
 * Notify the winning promoter that the owner accepted their offer. The exact
 * address is NOT shared yet — it is revealed once NadlanConnect validates the
 * introduction. Best-effort: callers should not block their HTTP response.
 */
export async function sendOfferAcceptedEmail(
  data: OfferDecisionEmailData,
): Promise<void> {
  if (!data.promoterEmail) return;
  const name = data.promoterName ?? "Cher promoteur";
  const location = offerLocationLabel(data);
  try {
    await sendEmail({
      to: data.promoterEmail,
      subject: `Votre offre a été retenue — ${location}`,
      html: offerEmailShell(
        `Bonjour ${name},`,
        `<p style="font-size:15px;">Félicitations — le propriétaire a <strong>retenu votre offre</strong> pour le projet situé à <strong>${location}</strong>.</p>
         <p style="font-size:15px;">Votre mise en relation est en cours de validation par NadlanConnect. Dès qu'elle est validée, l'<strong>adresse exacte</strong> et les coordonnées du propriétaire vous seront communiquées dans votre espace.</p>`,
      ),
      text: `Bonjour ${name},\n\nFélicitations — le propriétaire a retenu votre offre pour le projet situé à ${location}.\n\nVotre mise en relation est en cours de validation par NadlanConnect. Dès qu'elle est validée, l'adresse exacte et les coordonnées du propriétaire vous seront communiquées.`,
    });
  } catch (err) {
    logger.error({ err }, "Failed to send offer-accepted email to promoter");
  }
}

/**
 * Notify a non-selected promoter that the project has been awarded to someone
 * else and is no longer available. Best-effort.
 */
export async function sendOfferRejectedEmail(
  data: OfferDecisionEmailData,
): Promise<void> {
  if (!data.promoterEmail) return;
  const name = data.promoterName ?? "Cher promoteur";
  const location = offerLocationLabel(data);
  try {
    await sendEmail({
      to: data.promoterEmail,
      subject: `Projet attribué — ${location}`,
      html: offerEmailShell(
        `Bonjour ${name},`,
        `<p style="font-size:15px;">Le projet situé à <strong>${location}</strong>, pour lequel vous aviez soumis une offre, a été attribué à un autre promoteur. <strong>Ce projet n'est plus disponible.</strong></p>
         <p style="font-size:15px;">Merci de votre participation. D'autres opportunités de Pinui-Binui / Tama 38 sont régulièrement publiées sur NadlanConnect.</p>`,
      ),
      text: `Bonjour ${name},\n\nLe projet situé à ${location}, pour lequel vous aviez soumis une offre, a été attribué à un autre promoteur. Ce projet n'est plus disponible.\n\nMerci de votre participation. D'autres opportunités sont régulièrement publiées sur NadlanConnect.`,
    });
  } catch (err) {
    logger.error({ err }, "Failed to send offer-rejected email to promoter");
  }
}

interface ResaleMandateEmailData {
  agentName: string | null;
  agentEmail: string | null;
  promoterName: string | null;
  promoterCompany: string | null;
  buildingCity: string;
  buildingNeighborhood: string | null;
}

/**
 * Notify an agence that a winning promoter mandated them to resell an acquired
 * project. Best-effort: callers should not block their HTTP response on this.
 */
export async function sendResaleMandateEmail(
  data: ResaleMandateEmailData,
): Promise<void> {
  if (!data.agentEmail) return;
  const name = data.agentName ?? "Chère agence";
  const location = data.buildingNeighborhood
    ? `${data.buildingNeighborhood}, ${data.buildingCity}`
    : data.buildingCity;
  const promoter = data.promoterCompany
    ? `${data.promoterName ?? "Un promoteur"} (${data.promoterCompany})`
    : data.promoterName ?? "Un promoteur";
  try {
    await sendEmail({
      to: data.agentEmail,
      subject: `Mandat de revente — ${location}`,
      html: offerEmailShell(
        `Bonjour ${name},`,
        `<p style="font-size:15px;"><strong>${promoter}</strong> vous a <strong>mandatée pour la revente</strong> d'un projet immobilier situé à <strong>${location}</strong>.</p>
         <p style="font-size:15px;">Connectez-vous à votre espace NadlanConnect, rubrique <strong>« Projets à revendre »</strong>, pour consulter le détail du projet et les coordonnées du promoteur.</p>`,
      ),
      text: `Bonjour ${name},\n\n${promoter} vous a mandatée pour la revente d'un projet immobilier situé à ${location}.\n\nConnectez-vous à votre espace NadlanConnect, rubrique « Projets à revendre », pour consulter le détail du projet et les coordonnées du promoteur.`,
    });
  } catch (err) {
    logger.error({ err }, "Failed to send resale-mandate email to agence");
  }
}
