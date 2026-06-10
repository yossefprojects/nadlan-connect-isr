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
    userRole: string;
    lastInsertValues: Record<string, unknown> | null;
    lastUpdateValues: Record<string, unknown> | null;
  } = {
    existingListing: null,
    slugRows: [],
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

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const listingsRouter = (await import("./listings.js")).default;
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as unknown as { user: typeof AUTH_USER }).user = AUTH_USER;
    (req as unknown as { isAuthenticated: () => boolean }).isAuthenticated =
      () => true;
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
  mock.state.userRole = "agent";
  mock.state.lastInsertValues = null;
  mock.state.lastUpdateValues = null;
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
