import { Router } from "express";
import { db } from "@workspace/db";
import { profilesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  RegisterPromoteurBody,
  RegisterAgenceBody,
  AdminUpdateLicenceStatutBody,
  AdminListProfilesQueryParams,
} from "@workspace/api-zod";
import { hashPassword } from "../lib/auth";
import { requireAdmin } from "../middlewares/authMiddleware";

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
    companyNumber: p.companyNumber,
    nbAgents: p.nbAgents,
    nbProgrammes: p.nbProgrammes,
    website: p.website,
    specialties: p.specialties,
    createdAt: p.createdAt.toISOString(),
  };
}

// Postgres unique-violation error code (covers the race where two concurrent
// requests pass the pre-check but only one insert can win).
function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string })?.code === "23505";
}

// Email is the shared login identity, so it must be unique across both the
// users (login) table and the profiles (B2B onboarding) table.
async function emailTaken(email: string): Promise<boolean> {
  const inUsers = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (inUsers.length > 0) return true;
  const inProfiles = await db
    .select({ id: profilesTable.id })
    .from(profilesTable)
    .where(eq(profilesTable.email, email))
    .limit(1);
  return inProfiles.length > 0;
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

  if (await emailTaken(email)) {
    res.status(409).json({ error: "Un compte existe déjà avec cet email." });
    return;
  }

  try {
    const passwordHash = await hashPassword(data.password);
    await db.insert(usersTable).values({
      email,
      passwordHash,
      fullName: `${data.firstName} ${data.lastName}`.trim(),
      firstName: data.firstName,
      lastName: data.lastName,
      role: "developer",
      phone: data.phone ?? null,
      company: data.companyName,
    });

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
        passwordHash,
        nbProgrammes: data.nbProgrammes,
        website: data.website ?? null,
        companyNumber: data.companyNumber,
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

  if (await emailTaken(email)) {
    res.status(409).json({ error: "Un compte existe déjà avec cet email." });
    return;
  }

  // Agence immobilière (licensed, role "agent") vs apporteur d'affaires
  // (no brokerage licence, role "introducer").
  const isApporteur = data.profileType === "apporteur";
  const role = isApporteur ? "introducer" : "agent";
  if (!isApporteur) {
    if (!data.companyName?.trim()) {
      res.status(400).json({ error: "Le nom de l'agence est requis." });
      return;
    }
    if (!data.licenseNumber?.trim()) {
      res.status(400).json({
        error: "Le numéro de licence (Risha'yon) est requis pour une agence immobilière.",
      });
      return;
    }
  }

  try {
    const passwordHash = await hashPassword(data.password);
    // An apporteur d'affaires may be an individual without a company — fall back
    // to their own name so the (NOT NULL) companyName is always populated.
    const companyName =
      data.companyName?.trim() || `${data.firstName} ${data.lastName}`.trim();
    await db.insert(usersTable).values({
      email,
      passwordHash,
      fullName: `${data.firstName} ${data.lastName}`.trim(),
      firstName: data.firstName,
      lastName: data.lastName,
      role,
      phone: data.phone ?? null,
      company: companyName,
    });

    const [profile] = await db
      .insert(profilesTable)
      .values({
        role,
        firstName: data.firstName,
        lastName: data.lastName,
        email,
        phone: data.phone ?? null,
        companyName,
        ville: data.ville,
        plan: data.plan,
        passwordHash,
        licenseNumber: data.licenseNumber ?? null,
        nbAgents: data.nbAgents ?? null,
        specialties: data.specialties ?? [],
        cguAccepted: data.cguAccepted,
        status: "pending",
      })
      .returning();

    res.status(201).json({
      success: true,
      id: profile.id,
      role,
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
router.get("/admin/profiles", requireAdmin, async (req, res): Promise<void> => {
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
router.patch("/admin/profiles/:profileId/licence", requireAdmin, async (req, res): Promise<void> => {
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

  const [existing] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, profileId))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  // A profile cannot be marked "verifie" without the identifier an admin is
  // supposed to check: Risha'yon licence (agence) or company number / ח״פ
  // (promoteur). This also blocks verifying legacy rows that predate the field.
  // Verification identifier rules: a promoteur (developer) needs a company
  // number (ח״פ); an agence immobilière (agent) needs a Risha'yon licence; an
  // apporteur d'affaires (introducer) needs neither.
  if (parsed.data.licenceStatut === "verifie") {
    let missing: string | null = null;
    if (existing.role === "developer" && !existing.companyNumber) {
      missing = "Numéro de société manquant — vérification impossible.";
    } else if (existing.role === "agent" && !existing.licenseNumber) {
      missing = "Numéro de licence Risha'yon manquant — vérification impossible.";
    }
    if (missing) {
      res.status(400).json({ error: missing });
      return;
    }
  }

  const [updated] = await db
    .update(profilesTable)
    .set({ licenceStatut: parsed.data.licenceStatut })
    .where(eq(profilesTable.id, profileId))
    .returning();

  res.json(serializeProfile(updated));
});

export default router;
