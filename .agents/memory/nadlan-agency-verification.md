---
name: NadlanConnect B2B verification (agence Risha'yon + promoteur company)
description: How agence AND promoteur verification work, the shared licenceStatut model, and which badge-display surfaces still need foundations built.
---

# B2B verification (agence Risha'yon + promoteur company number)

Both pro types register via the `profiles` table. Trust is tracked by the SHARED
`profiles.licence_statut` (`en_attente` | `verifie` | `rejete`, default `en_attente`)
for BOTH roles — despite the "licence" name, it is the generic verification state.
An admin manually flips it from the admin panel via the admin-only API
(`GET /admin/profiles?role=`, `PATCH /admin/profiles/:id/licence`). The PATCH handler
guards: a profile CANNOT be set `verifie` without its identifier — agent needs
`licenseNumber` (Risha'yon), developer needs `companyNumber` (ח״פ / Teudat Hitagdout).
This also blocks verifying legacy rows predating the field.

- **Agence** (role `agent`): identifier = `licenseNumber` (Risha'yon), collected on the
  agence registration form. Admin section "Vérification des agences".
- **Promoteur** (role `developer`): identifier = `companyNumber` (ח״פ), collected on the
  promoteur registration form. Admin section "Vérification des promoteurs". A promoteur is
  NOT an agent so it has no Risha'yon — that is by design.

`VerifiedBadge` defaults to "Agence vérifiée"; pass `label` (e.g. generic "Vérifié")
when showing it for a promoteur so the copy is not agency-specific.

**Why manual:** the official REIT/Rasham registry API integration was intentionally
deferred; verification is a human admin step for now.

## Deferred badge-display surfaces — NOT yet buildable without new foundations
The "show the badge to buyers/promoteurs" parts of the spec could not be wired because
the underlying surfaces don't exist yet:
- **No public agency profile page** exists at all.
- **No email infrastructure** exists (so "badge in buyer emails" is impossible today).
- **Listings link agencies via `users` + mandates (agentId → usersTable), NOT the
  `profiles` table.** So a listing has no direct path to a profile's `licence_statut`.
  Bridging requires linking `users` ↔ `profiles` (e.g. by email or an explicit FK).

**How to apply:** before promising badge-on-listing or badge-in-email work, build (a) a
public agency profile page, (b) a users↔profiles link, and (c) email infra — in that order.
