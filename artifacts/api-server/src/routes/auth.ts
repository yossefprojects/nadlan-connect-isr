import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCurrentAuthUserResponse,
  LoginWithPasswordBody,
  RegisterWithPasswordBody,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  clearSession,
  getSessionId,
  createSession,
  hashPassword,
  verifyPassword,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string })?.code === "23505";
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const parsed = LoginWithPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email ou mot de passe invalide." });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Email ou mot de passe incorrect." });
    return;
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Email ou mot de passe incorrect." });
    return;
  }

  const sessionData: SessionData = {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    },
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);

  res.json(
    GetCurrentAuthUserResponse.parse({ user: sessionData.user }),
  );
});

router.post("/auth/register", async (req: Request, res: Response) => {
  const parsed = RegisterWithPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const fullName = parsed.data.fullName.trim();
  const [firstName, ...rest] = fullName.split(" ");
  const lastName = rest.join(" ") || null;

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Un compte existe déjà avec cet email." });
    return;
  }

  try {
    const [user] = await db
      .insert(usersTable)
      .values({
        email,
        passwordHash: await hashPassword(parsed.data.password),
        fullName,
        firstName: firstName || null,
        lastName,
        role: "buyer",
        phone: parsed.data.phone ?? null,
      })
      .returning();

    const sessionData: SessionData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      },
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);

    res
      .status(201)
      .json(GetCurrentAuthUserResponse.parse({ user: sessionData.user }));
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "Un compte existe déjà avec cet email." });
      return;
    }
    throw err;
  }
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

export default router;
