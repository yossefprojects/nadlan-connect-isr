import { Router } from "express";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { db } from "@workspace/db";
import { profilesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  RegisterPromoteurBody,
  RegisterAgenceBody,
  AdminUpdateLicenceStatutBody,
  AdminListProfilesQueryParams,
} from "@workspace/api-zod";

const router = Router();

async function isAdmin(userId: string): Promise<boolean> {
  const u = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return u[0]?.role === "admin";
}

// Public-safe projection of a profile (never expose passwordHash).
function serializeProfile(p: typeof profilesTable.$inferSelect) {
  return {
    id: p.id,
    role: p.role,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    phone: p.phone,
    companyName: p.companyName,
    ville: p.ville,
    plan: p.plan,
    status: p.status,
    licenceStatut: p.licenceStatut,
    licenseNumber: p.licenseNumber,
    nbAgents: p.nbAgents,
    nbProgrammes: p.nbProgrammes,
    website: p.website,
    specialties: p.specialties,
    createdAt: p.createdAt.toISOString(),
  };
}

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

// GET /admin/profiles — list B2B onboarding profiles (admin only)
router.get("/admin/profiles", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!(await isAdmin(req.user!.id))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsedQuery = AdminListProfilesQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: parsedQuery.error.message });
    return;
  }
  const role = parsedQuery.data.role;

  const rows = role
    ? await db
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.role, role))
        .orderBy(desc(profilesTable.createdAt))
    : await db.select().from(profilesTable).orderBy(desc(profilesTable.createdAt));

  res.json(rows.map(serializeProfile));
});

// PATCH /admin/profiles/:profileId/licence — update Risha'yon verification (admin only)
router.patch("/admin/profiles/:profileId/licence", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!(await isAdmin(req.user!.id))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const profileId = Number(req.params.profileId);
  if (!Number.isInteger(profileId)) {
    res.status(400).json({ error: "Invalid profile id" });
    return;
  }

  const parsed = AdminUpdateLicenceStatutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(profilesTable)
    .set({ licenceStatut: parsed.data.licenceStatut })
    .where(eq(profilesTable.id, profileId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(serializeProfile(updated));
});

export default router;
