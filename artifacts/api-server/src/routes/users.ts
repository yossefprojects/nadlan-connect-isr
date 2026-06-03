import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/authMiddleware";
import {
  GetMyProfileResponse,
  UpdateMyProfileBody,
  SetMyRoleBody,
  AdminUpdateUserBody,
  AdminUpdateUserParams,
  ListUsersQueryParams,
} from "@workspace/api-zod";

const router = Router();

// GET /auth/user — current auth user (handled by auth route)
// GET /users/me
router.get("/users/me", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id))
    .limit(1);

  if (!user[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const u = user[0];
  const profile = {
    id: u.id,
    email: u.email ?? null,
    fullName: u.fullName ?? (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName ?? null),
    role: u.role ?? null,
    phone: u.phone ?? null,
    company: u.company ?? null,
    avatarUrl: u.avatarUrl ?? u.profileImageUrl ?? null,
    createdAt: u.createdAt.toISOString(),
  };

  res.json(GetMyProfileResponse.parse(profile));
});

// PATCH /users/me
router.patch("/users/me", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = UpdateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.fullName !== undefined) updates.fullName = parsed.data.fullName;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.company !== undefined) updates.company = parsed.data.company;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.user!.id))
    .returning();

  const profile = {
    id: updated.id,
    email: updated.email ?? null,
    fullName: updated.fullName ?? (updated.firstName && updated.lastName ? `${updated.firstName} ${updated.lastName}` : updated.firstName ?? null),
    role: updated.role ?? null,
    phone: updated.phone ?? null,
    company: updated.company ?? null,
    avatarUrl: updated.avatarUrl ?? updated.profileImageUrl ?? null,
    createdAt: updated.createdAt.toISOString(),
  };

  res.json(profile);
});

// PATCH /users/me/role
router.patch("/users/me/role", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = SetMyRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ role: parsed.data.role })
    .where(eq(usersTable.id, req.user!.id))
    .returning();

  const profile = {
    id: updated.id,
    email: updated.email ?? null,
    fullName: updated.fullName ?? (updated.firstName && updated.lastName ? `${updated.firstName} ${updated.lastName}` : updated.firstName ?? null),
    role: updated.role ?? null,
    phone: updated.phone ?? null,
    company: updated.company ?? null,
    avatarUrl: updated.avatarUrl ?? updated.profileImageUrl ?? null,
    createdAt: updated.createdAt.toISOString(),
  };

  res.json(profile);
});

// GET /users (admin)
router.get("/users", requireAdmin, async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  let query = db.select().from(usersTable).$dynamic();
  if (params.success && params.data.role) {
    query = query.where(eq(usersTable.role, params.data.role));
  }
  const users = await query;
  res.json(
    users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      fullName: u.fullName ?? (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName ?? null),
      role: u.role ?? null,
      phone: u.phone ?? null,
      company: u.company ?? null,
      avatarUrl: u.avatarUrl ?? u.profileImageUrl ?? null,
      createdAt: u.createdAt.toISOString(),
    }))
  );
});

// PATCH /users/:userId (admin)
router.patch("/users/:userId", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateUserParams.safeParse(req.params);
  const parsed = AdminUpdateUserBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, params.data.userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: updated.id,
    email: updated.email ?? null,
    fullName: updated.fullName ?? (updated.firstName && updated.lastName ? `${updated.firstName} ${updated.lastName}` : updated.firstName ?? null),
    role: updated.role ?? null,
    phone: updated.phone ?? null,
    company: updated.company ?? null,
    avatarUrl: updated.avatarUrl ?? updated.profileImageUrl ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
