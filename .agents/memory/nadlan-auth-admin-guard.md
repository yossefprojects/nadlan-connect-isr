---
name: NadlanConnect admin authorization
description: Why every admin route needs an explicit role guard now that self-registration is open.
---

# Admin authorization must be role-checked, not just authenticated

After NadlanConnect replaced Replit Auth with open email+password self-registration, several admin endpoints that only checked `req.isAuthenticated()` became a **critical privilege-escalation hole**: anyone could register a buyer and then call an unguarded admin route — including `PATCH /users/:userId` to set their own role to `admin`. The self-service `PATCH /users/me/role` enum also still listed `admin`.

**Rule:** every `/admin/*` route and the admin user-management routes must enforce `role === "admin"` server-side (a `requireAdmin` middleware), never `isAuthenticated()` alone. The self-service role-set endpoint must exclude `admin` at the schema level (RoleSelection enum = buyer|agent|developer) so a user can never self-promote.

**Why:** with closed/SSO auth the latent broken-access-control was low-risk; opening self-registration turned it critical. Whenever auth is loosened, re-audit every authorization check that implicitly relied on who could get an account.

**How to apply:** when adding any new admin/moderation route, attach the admin guard middleware. When adding a role-mutation path, confirm it cannot assign `admin`. Admin accounts are bootstrapped manually (register, then `UPDATE users SET role='admin'`).
