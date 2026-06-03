import { Router } from "express";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterPromoteurBody, RegisterAgenceBody } from "@workspace/api-zod";

const router = Router();

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

// Postgres unique-violation error code (covers the race where two concurrent
// requests pass the pre-check but only one insert can win).
function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string })?.code === "23505";
}

const SUCCESS_MESSAGE = "Compte créé — vérification sous 24h";

// POST /profiles/promoteur — promoteur (developer) onboarding application
router.post("/profiles/promoteur", async (req, res): Promise<void> => {
  const parsed = RegisterPromoteurBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  if (!data.cguAccepted) {
    res.status(400).json({ error: "Vous devez accepter les CGU." });
    return;
  }

  const email = data.email.trim().toLowerCase();

  const existing = await db
    .select({ id: profilesTable.id })
    .from(profilesTable)
    .where(eq(profilesTable.email, email))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Un compte existe déjà avec cet email." });
    return;
  }

  try {
    const [profile] = await db
      .insert(profilesTable)
      .values({
        role: "developer",
        firstName: data.firstName,
        lastName: data.lastName,
        email,
        phone: data.phone ?? null,
        companyName: data.companyName,
        ville: data.ville,
        plan: data.plan,
        passwordHash: await hashPassword(data.password),
        nbProgrammes: data.nbProgrammes,
        website: data.website ?? null,
        cguAccepted: data.cguAccepted,
        status: "pending",
      })
      .returning();

    res.status(201).json({
      success: true,
      id: profile.id,
      role: "developer",
      status: profile.status,
      message: SUCCESS_MESSAGE,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "Un compte existe déjà avec cet email." });
      return;
    }
    throw err;
  }
});

// POST /profiles/agence — agence (agent) onboarding application
router.post("/profiles/agence", async (req, res): Promise<void> => {
  const parsed = RegisterAgenceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  if (!data.cguAccepted) {
    res.status(400).json({ error: "Vous devez accepter les CGU." });
    return;
  }

  const email = data.email.trim().toLowerCase();

  const existing = await db
    .select({ id: profilesTable.id })
    .from(profilesTable)
    .where(eq(profilesTable.email, email))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Un compte existe déjà avec cet email." });
    return;
  }

  try {
    const [profile] = await db
      .insert(profilesTable)
      .values({
        role: "agent",
        firstName: data.firstName,
        lastName: data.lastName,
        email,
        phone: data.phone ?? null,
        companyName: data.companyName,
        ville: data.ville,
        plan: data.plan,
        passwordHash: await hashPassword(data.password),
        licenseNumber: data.licenseNumber,
        nbAgents: data.nbAgents,
        specialties: data.specialties ?? [],
        cguAccepted: data.cguAccepted,
        status: "pending",
      })
      .returning();

    res.status(201).json({
      success: true,
      id: profile.id,
      role: "agent",
      status: profile.status,
      message: SUCCESS_MESSAGE,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "Un compte existe déjà avec cet email." });
      return;
    }
    throw err;
  }
});

export default router;
