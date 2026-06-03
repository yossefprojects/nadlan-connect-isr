---
name: NadlanConnect agency (Risha'yon) verification
description: How agency license verification works and which badge-display surfaces still need foundations built.
---

# Agency Risha'yon license verification

Agencies register via the `profiles` table (role `agent`). License trust is tracked
by `profiles.licence_statut` (`en_attente` | `verifie` | `rejete`), default `en_attente`.
An admin manually flips it from the admin panel ("Vérification des agences" section),
which calls the admin-only API (`GET /admin/profiles`, `PATCH /admin/profiles/:id/licence`).
A verified agency shows the reusable `VerifiedBadge` ("Agence vérifiée").

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
