import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { calcEstimation, calcInvestmentScore } from "../lib/engine.js";

// Mock @workspace/db so the listing routes run against an in-memory fake instead
// of a real Postgres connection. The fake records the values handed to
// insert()/update() so the test can assert the engine outputs are persisted.
const mock = vi.hoisted(() => {
  const tables = {
    listingsTable: { __t: "listings" },
    listingImagesTable: { __t: "listing_images" },
    favoritesTable: { __t: "favorites" },
    usersTable: { __t: "users" },
    documentsTable: { __t: "documents" },
    sessionsTable: { __t: "sessions" },
    programsTable: { __t: "programs" },
  };

  const state: {
    existingListing: Record<string, unknown> | null;
    slugRows: Array<{ id: number; slug: string }>;
    images: Array<{
      id: number;
      listingId: number;
      url: string;
      position: number;
    }>;
    userRole: string;
    lastInsertValues: Record<string, unknown> | null;
    lastUpdateValues: Record<string, unknown> | null;
  } = {
    existingListing: null,
    slugRows: [],
    images: [],
    userRole: "agent",
    lastInsertValues: null,
    lastUpdateValues: null,
  };

  type Builder = {
    _op: string | null;
    _table: unknown;
    _selectArg: unknown;
    _captured: Record<string, unknown> | null;
    select: (arg?: unknown) => Builder;
    from: (t: unknown) => Builder;
    $dynamic: () => Builder;
    where: () => Builder;
    limit: () => Builder;
    offset: () => Builder;
    orderBy: () => Builder;
    groupBy: () => Builder;
    set: (v: Record<string, unknown>) => Builder;
    values: (v: Record<string, unknown>) => Builder;
    returning: () => unknown;
    then: (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) => Promise<unknown>;
  };

  function resolve(b: Builder): unknown {
    if (b._op === "select") {
      if (b._table === tables.listingsTable) {
        // uniqueSlug passes a projection object to select(); the existing-listing
        // fetch in PATCH calls select() with no argument.
        if (b._selectArg) return state.slugRows;
        return state.existingListing ? [state.existingListing] : [];
      }
      if (b._table === tables.listingImagesTable) return state.images;
      if (b._table === tables.usersTable) return [{ role: state.userRole }];
      return [];
    }
    if (b._op === "insert") {
      state.lastInsertValues = b._captured;
      return [{ id: 1, createdAt: new Date(), ...b._captured }];
    }
    if (b._op === "update") {
      state.lastUpdateValues = b._captured;
      return [{ ...(state.existingListing ?? {}), ...b._captured }];
    }
    return [];
  }

  function makeBuilder(): Builder {
    const b: Builder = {
      _op: null,
      _table: null,
      _selectArg: undefined,
      _captured: null,
      select(arg) {
        b._op = "select";
        b._selectArg = arg;
        return b;
      },
      from(t) {
        b._table = t;
        return b;
      },
      $dynamic() {
        return b;
      },
      where() {
        return b;
      },
      limit() {
        return b;
      },
      offset() {
        return b;
      },
      orderBy() {
        return b;
      },
      groupBy() {
        return b;
      },
      set(v) {
        b._captured = v;
        return b;
      },
      values(v) {
        b._captured = v;
        return b;
      },
      returning() {
        return resolve(b);
      },
      then(onF, onR) {
        return Promise.resolve(resolve(b)).then(onF, onR);
      },
    };
    return b;
  }

  const db = {
    select(arg?: unknown) {
      return makeBuilder().select(arg);
    },
    insert(t: unknown) {
      const b = makeBuilder();
      b._op = "insert";
      b._table = t;
      return b;
    },
    update(t: unknown) {
      const b = makeBuilder();
      b._op = "update";
      b._table = t;
      return b;
    },
    delete(t: unknown) {
      const b = makeBuilder();
      b._op = "delete";
      b._table = t;
      return b;
    },
  };

  return { tables, state, db };
});

vi.mock("@workspace/db", () => ({
  db: mock.db,
  ...mock.tables,
}));

const AUTH_USER = {
  id: "user-1",
  email: "agent@example.com",
  role: "agent",
};

// The currently "logged in" user for a given request. Tests mutate this to
// impersonate the owner, a non-owner, an admin, or an anonymous visitor.
// `null` means the request is unauthenticated.
let currentUser: typeof AUTH_USER | null = AUTH_USER;

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const listingsRouter = (await import("./listings.js")).default;
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (currentUser) {
      (req as unknown as { user: typeof AUTH_USER }).user = currentUser;
    } else {
      (req as unknown as { user: typeof AUTH_USER | undefined }).user =
        undefined;
    }
    (req as unknown as { isAuthenticated: () => boolean }).isAuthenticated =
      () => currentUser != null;
    next();
  });
  app.use(listingsRouter);

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  mock.state.existingListing = null;
  mock.state.slugRows = [];
  mock.state.images = [];
  mock.state.userRole = "agent";
  mock.state.lastInsertValues = null;
  mock.state.lastUpdateValues = null;
  currentUser = AUTH_USER;
});

describe("POST /listings persists engine outputs", () => {
  it("attaches a non-null estimatedPrice and an investmentScore in 0-100", async () => {
    const body = {
      type: "resale",
      title: "Bel appartement lumineux",
      ville: "tlv",
      surface: 80,
      nbPieces: 3,
      etage: 3,
      price: 4_000_000,
    };

    const res = await fetch(`${baseUrl}/listings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(201);
    const json = (await res.json()) as {
      estimatedPrice: number | null;
      investmentScore: number | null;
    };

    const { estimatedPrice } = calcEstimation({
      ville: body.ville,
      surface: body.surface,
      nbPieces: body.nbPieces,
      etage: body.etage,
      type: body.type,
    });
    const { score } = calcInvestmentScore({
      ville: body.ville,
      type: body.type,
      price: body.price,
      estimatedPrice,
      surface: body.surface,
    });

    // The serialized response carries the engine outputs.
    expect(json.estimatedPrice).not.toBeNull();
    expect(json.estimatedPrice).toBe(estimatedPrice);
    expect(json.investmentScore).toBe(score);
    expect(json.investmentScore).toBeGreaterThanOrEqual(0);
    expect(json.investmentScore).toBeLessThanOrEqual(100);

    // The values actually written to the DB match the engine.
    expect(mock.state.lastInsertValues).not.toBeNull();
    expect(mock.state.lastInsertValues!.estimatedPrice).toBe(estimatedPrice);
    expect(mock.state.lastInsertValues!.investmentScore).toBe(score);
  });
});

describe("PATCH /listings/:listingId recomputes engine outputs", () => {
  it("re-derives estimatedPrice and a 0-100 investmentScore when price changes", async () => {
    mock.state.existingListing = {
      id: 7,
      ownerId: AUTH_USER.id,
      programId: null,
      type: "resale",
      title: "Bel appartement lumineux",
      slug: "bel-appartement-lumineux-tel-aviv",
      description: null,
      ville: "tlv",
      quartier: null,
      surface: 80,
      nbPieces: 3,
      etage: 3,
      price: 4_000_000,
      estimatedPrice: 4_400_000,
      investmentScore: 88,
      status: "draft",
      createdAt: new Date(),
    };

    const newPrice = 3_900_000;
    const res = await fetch(`${baseUrl}/listings/7`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ price: newPrice }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      estimatedPrice: number | null;
      investmentScore: number | null;
    };

    const { estimatedPrice } = calcEstimation({
      ville: "tlv",
      surface: 80,
      nbPieces: 3,
      etage: 3,
      type: "resale",
    });
    const { score } = calcInvestmentScore({
      ville: "tlv",
      type: "resale",
      price: newPrice,
      estimatedPrice,
      surface: 80,
    });

    expect(json.estimatedPrice).not.toBeNull();
    expect(json.estimatedPrice).toBe(estimatedPrice);
    expect(json.investmentScore).toBe(score);
    expect(json.investmentScore).toBeGreaterThanOrEqual(0);
    expect(json.investmentScore).toBeLessThanOrEqual(100);

    // The recomputed values were written back to the DB.
    expect(mock.state.lastUpdateValues).not.toBeNull();
    expect(mock.state.lastUpdateValues!.estimatedPrice).toBe(estimatedPrice);
    expect(mock.state.lastUpdateValues!.investmentScore).toBe(score);
  });
});

// Helper: build a stored listing owned by `ownerId` (defaults to a stranger so
// authorization tests start from a non-owner state).
function seedListing(ownerId = "someone-else"): void {
  mock.state.existingListing = {
    id: 7,
    ownerId,
    programId: null,
    type: "resale",
    title: "Bel appartement lumineux",
    slug: "bel-appartement-lumineux-tel-aviv",
    description: null,
    ville: "tlv",
    quartier: null,
    surface: 80,
    nbPieces: 3,
    etage: 3,
    price: 4_000_000,
    estimatedPrice: 4_400_000,
    investmentScore: 88,
    status: "draft",
    createdAt: new Date(),
  };
}

describe("PATCH /listings/:listingId authorization", () => {
  it("returns 403 for an authenticated non-owner (non-admin)", async () => {
    seedListing("someone-else");
    mock.state.userRole = "agent"; // the impersonated user's role lookup

    const res = await fetch(`${baseUrl}/listings/7`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Hijacked title" }),
    });

    expect(res.status).toBe(403);
    // No write should have happened.
    expect(mock.state.lastUpdateValues).toBeNull();
  });

  it("returns 200 for the owner", async () => {
    seedListing(AUTH_USER.id);

    const res = await fetch(`${baseUrl}/listings/7`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Owner-updated title" }),
    });

    expect(res.status).toBe(200);
    expect(mock.state.lastUpdateValues).not.toBeNull();
  });

  it("returns 200 for an admin editing someone else's listing", async () => {
    seedListing("someone-else");
    mock.state.userRole = "admin"; // role lookup for the non-owner returns admin

    const res = await fetch(`${baseUrl}/listings/7`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Admin-moderated title" }),
    });

    expect(res.status).toBe(200);
    expect(mock.state.lastUpdateValues).not.toBeNull();
  });

  it("returns 401 when unauthenticated", async () => {
    seedListing(AUTH_USER.id);
    currentUser = null;

    const res = await fetch(`${baseUrl}/listings/7`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Anonymous title" }),
    });

    expect(res.status).toBe(401);
    expect(mock.state.lastUpdateValues).toBeNull();
  });
});

describe("DELETE /listings/:listingId authorization", () => {
  it("returns 403 for an authenticated non-owner (non-admin)", async () => {
    seedListing("someone-else");
    mock.state.userRole = "agent";

    const res = await fetch(`${baseUrl}/listings/7`, { method: "DELETE" });

    expect(res.status).toBe(403);
  });

  it("returns success for the owner", async () => {
    seedListing(AUTH_USER.id);

    const res = await fetch(`${baseUrl}/listings/7`, { method: "DELETE" });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean };
    expect(json.success).toBe(true);
  });

  it("returns success for an admin deleting someone else's listing", async () => {
    seedListing("someone-else");
    mock.state.userRole = "admin";

    const res = await fetch(`${baseUrl}/listings/7`, { method: "DELETE" });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean };
    expect(json.success).toBe(true);
  });

  it("returns 401 when unauthenticated", async () => {
    seedListing(AUTH_USER.id);
    currentUser = null;

    const res = await fetch(`${baseUrl}/listings/7`, { method: "DELETE" });

    expect(res.status).toBe(401);
  });
});

describe("Unauthenticated mutations are rejected", () => {
  it("returns 401 for POST /listings", async () => {
    currentUser = null;

    const res = await fetch(`${baseUrl}/listings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "resale",
        title: "Bel appartement lumineux",
        ville: "tlv",
        surface: 80,
        nbPieces: 3,
        etage: 3,
        price: 4_000_000,
      }),
    });

    expect(res.status).toBe(401);
    expect(mock.state.lastInsertValues).toBeNull();
  });

  it("returns 401 for POST /listings/:listingId/publish", async () => {
    seedListing(AUTH_USER.id);
    currentUser = null;

    const res = await fetch(`${baseUrl}/listings/7/publish`, {
      method: "POST",
    });

    expect(res.status).toBe(401);
    expect(mock.state.lastUpdateValues).toBeNull();
  });
});

describe("POST /listings/:listingId/publish authorization", () => {
  it("returns 403 for an authenticated non-owner (non-admin)", async () => {
    seedListing("someone-else");
    mock.state.userRole = "agent";

    const res = await fetch(`${baseUrl}/listings/7/publish`, {
      method: "POST",
    });

    expect(res.status).toBe(403);
    // No write should have happened.
    expect(mock.state.lastUpdateValues).toBeNull();
  });

  it("returns 200 for the owner and publishes", async () => {
    seedListing(AUTH_USER.id);

    const res = await fetch(`${baseUrl}/listings/7/publish`, {
      method: "POST",
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string };
    expect(json.status).toBe("published");
    expect(mock.state.lastUpdateValues).not.toBeNull();
    expect(mock.state.lastUpdateValues!.status).toBe("published");
  });

  it("returns 200 for an admin publishing someone else's listing", async () => {
    seedListing("someone-else");
    mock.state.userRole = "admin";

    const res = await fetch(`${baseUrl}/listings/7/publish`, {
      method: "POST",
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string };
    expect(json.status).toBe("published");
    expect(mock.state.lastUpdateValues).not.toBeNull();
    expect(mock.state.lastUpdateValues!.status).toBe("published");
  });

  it("returns 404 when the listing does not exist", async () => {
    mock.state.existingListing = null;

    const res = await fetch(`${baseUrl}/listings/7/publish`, {
      method: "POST",
    });

    expect(res.status).toBe(404);
    expect(mock.state.lastUpdateValues).toBeNull();
  });
});

describe("Listing photos surface in galleryImageUrls (regression guard)", () => {
  // Three images in non-trivial position order; the DB returns them ordered by
  // position (orderBy in the route), so we seed them already ordered to mirror
  // that contract. The first photo is the cover.
  const ORDERED_PHOTOS = [
    { id: 11, listingId: 7, url: "https://cdn.example/cover.jpg", position: 0 },
    { id: 12, listingId: 7, url: "https://cdn.example/second.jpg", position: 1 },
    { id: 13, listingId: 7, url: "https://cdn.example/third.jpg", position: 2 },
  ];

  it("GET /listings/:slug returns the photos in galleryImageUrls with the first as coverImageUrl", async () => {
    seedListing(AUTH_USER.id);
    mock.state.images = ORDERED_PHOTOS;

    const res = await fetch(
      `${baseUrl}/listings/bel-appartement-lumineux-tel-aviv`
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      listing: { galleryImageUrls: string[]; coverImageUrl: string | null };
    };

    // The detail contract must expose every photo via galleryImageUrls (the
    // field clients read), ordered by position — not only via images[].
    expect(json.listing.galleryImageUrls).toEqual(
      ORDERED_PHOTOS.map((p) => p.url)
    );
    expect(json.listing.coverImageUrl).toBe(ORDERED_PHOTOS[0].url);
  });

  it("GET /listings (list/grid) returns galleryImageUrls for the same listing", async () => {
    seedListing(AUTH_USER.id);
    mock.state.images = ORDERED_PHOTOS;

    const res = await fetch(`${baseUrl}/listings?ownerId=${AUTH_USER.id}`);

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      listings: Array<{
        galleryImageUrls: string[];
        coverImageUrl: string | null;
      }>;
    };

    expect(json.listings).toHaveLength(1);
    expect(json.listings[0].galleryImageUrls).toEqual(
      ORDERED_PHOTOS.map((p) => p.url)
    );
    expect(json.listings[0].coverImageUrl).toBe(ORDERED_PHOTOS[0].url);
  });
});

describe("GET /admin/listings authorization (requireAdmin)", () => {
  it("returns 401 when unauthenticated", async () => {
    currentUser = null;

    const res = await fetch(`${baseUrl}/admin/listings`);

    expect(res.status).toBe(401);
  });

  it("returns 403 for an authenticated non-admin", async () => {
    mock.state.userRole = "agent"; // role lookup returns a non-admin

    const res = await fetch(`${baseUrl}/admin/listings`);

    expect(res.status).toBe(403);
  });

  it("returns 200 for an admin", async () => {
    seedListing("someone-else");
    mock.state.userRole = "admin"; // role lookup returns admin

    const res = await fetch(`${baseUrl}/admin/listings`);

    expect(res.status).toBe(200);
    const json = (await res.json()) as Array<{ id: number }>;
    expect(Array.isArray(json)).toBe(true);
  });
});

describe("PATCH /admin/listings/:listingId/status authorization (requireAdmin)", () => {
  it("returns 401 when unauthenticated", async () => {
    seedListing("someone-else");
    currentUser = null;

    const res = await fetch(`${baseUrl}/admin/listings/7/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });

    expect(res.status).toBe(401);
    expect(mock.state.lastUpdateValues).toBeNull();
  });

  it("returns 403 for an authenticated non-admin", async () => {
    seedListing("someone-else");
    mock.state.userRole = "agent"; // role lookup returns a non-admin

    const res = await fetch(`${baseUrl}/admin/listings/7/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });

    expect(res.status).toBe(403);
    // The guard must reject before any write happens.
    expect(mock.state.lastUpdateValues).toBeNull();
  });

  it("returns 200 for an admin and writes the new status", async () => {
    seedListing("someone-else");
    mock.state.userRole = "admin"; // role lookup returns admin

    const res = await fetch(`${baseUrl}/admin/listings/7/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string };
    expect(json.status).toBe("published");
    expect(mock.state.lastUpdateValues).not.toBeNull();
    expect(mock.state.lastUpdateValues!.status).toBe("published");
  });
});
