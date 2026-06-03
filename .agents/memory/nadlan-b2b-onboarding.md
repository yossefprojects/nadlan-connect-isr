---
name: NadlanConnect B2B onboarding profiles
description: Why promoteur/agence registration forms write to a separate profiles table instead of the auth users flow
---

# B2B onboarding = applications, not auth accounts

The promoteur (`/auth/register/promoteur`) and agence (`/auth/register/agence`)
registration forms do NOT create login accounts. NadlanConnect end-user auth is
Replit Auth (OIDC, no passwords). These B2B forms capture *onboarding
applications* into a dedicated `profiles` table (role `developer`/`agent`,
`status` default `pending`) for manual review ("vérification sous 24h").

**Why:** the product needs a B2B intake/vetting pipeline (license check, etc.)
separate from consumer sign-in. A captured password is stored scrypt-hashed
(`salt:hash`) for a future activation flow, but no login is wired today.

**How to apply:**
- Treat `profiles` as the source of truth for B2B applicants; the Replit-Auth
  `users` table is for end users. Do not conflate them.
- `profiles.email` is unique (case-insensitive: emails are lowercased before
  insert/lookup, and a DB unique constraint backs the app-level pre-check —
  map Postgres `23505` to HTTP 409 for the concurrent-insert race).
- Success message is a fixed contract string: `Compte créé — vérification sous 24h`.
