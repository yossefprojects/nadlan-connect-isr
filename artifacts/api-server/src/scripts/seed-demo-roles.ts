/**
 * Full 3-role demo scenario for the live presentation:
 *   • 1 apporteur d'affaires (introducer) who publishes projects,
 *   • 2 promoteurs (developer) who compete with offers,
 *   • 1 agence immobilière (agent, verified) available for resale mandates,
 *   • 3 projects owned by the apporteur:
 *       – 2 ACTIVE, each with two competing offers (accept one live on stage),
 *       – 1 already 'offer_locked' (Alpha accepted, connection validated) so the
 *         winning promoteur can immediately mandate the agence for resale.
 *
 * Common password: Demo1234!
 * Idempotent: the apporteur's listings are wiped first (cascade clears their
 * offers + connections), and users/profiles are upserted by email.
 */
import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  profilesTable,
  demolitionListingsTable,
  demolitionOffersTable,
  demolitionConnectionsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const PASSWORD = "Demo1234!";

interface SeedActor {
  email: string;
  firstName: string;
  lastName: string;
  role: "introducer" | "developer" | "agent";
  company: string;
  ville: string;
  phone: string;
  plan: string;
  companyNumber?: string;
  licenseNumber?: string;
  nbProgrammes?: number;
  specialties?: string[];
}

const APPORTEUR: SeedActor = {
  email: "apporteur-demo@nadlanconnect.test",
  firstName: "Sarah",
  lastName: "Lévy",
  role: "introducer",
  company: "Lévy Opportunités",
  ville: "Tel Aviv",
  phone: "+972 50 111 1111",
  plan: "starter",
};

const DEVELOPERS: SeedActor[] = [
  {
    email: "promoteur-alpha@nadlanconnect.test",
    firstName: "Daniel",
    lastName: "Azoulay",
    role: "developer",
    company: "Alpha Construction",
    ville: "Tel Aviv",
    phone: "+972 50 222 2222",
    plan: "pro",
    companyNumber: "515123456",
    nbProgrammes: 12,
  },
  {
    email: "promoteur-beta@nadlanconnect.test",
    firstName: "Yossef",
    lastName: "Mizrahi",
    role: "developer",
    company: "Beta Real Estate",
    ville: "Ramat Gan",
    phone: "+972 50 333 3333",
    plan: "free",
    companyNumber: "515987654",
    nbProgrammes: 5,
  },
];

const AGENCE: SeedActor = {
  email: "agence-demo@nadlanconnect.test",
  firstName: "David",
  lastName: "Cohen",
  role: "agent",
  company: "Cohen Immobilier",
  ville: "Tel Aviv",
  phone: "+972 50 444 4444",
  plan: "free",
  licenseNumber: "RY-2024-8891",
  specialties: ["luxe", "investissement", "diaspora_francophone"],
};

async function upsertUser(a: SeedActor, passwordHash: string): Promise<string> {
  const fullName = `${a.firstName} ${a.lastName}`;
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, a.email))
    .limit(1);

  if (existing) {
    await db
      .update(usersTable)
      .set({
        fullName,
        firstName: a.firstName,
        lastName: a.lastName,
        role: a.role,
        company: a.company,
        passwordHash,
      })
      .where(eq(usersTable.id, existing.id));
    return existing.id;
  }

  const [created] = await db
    .insert(usersTable)
    .values({
      email: a.email,
      fullName,
      firstName: a.firstName,
      lastName: a.lastName,
      role: a.role,
      company: a.company,
      passwordHash,
    })
    .returning({ id: usersTable.id });
  return created.id;
}

async function upsertProfile(a: SeedActor, passwordHash: string): Promise<void> {
  const values = {
    role: a.role,
    firstName: a.firstName,
    lastName: a.lastName,
    phone: a.phone,
    companyName: a.company,
    ville: a.ville,
    plan: a.plan,
    passwordHash,
    status: "verified",
    licenceStatut: "verifie",
    companyNumber: a.companyNumber ?? null,
    licenseNumber: a.licenseNumber ?? null,
    nbProgrammes: a.nbProgrammes ?? null,
    specialties: a.specialties ?? null,
    cguAccepted: true,
  };

  const [existing] = await db
    .select({ id: profilesTable.id })
    .from(profilesTable)
    .where(eq(profilesTable.email, a.email))
    .limit(1);

  if (existing) {
    await db.update(profilesTable).set(values).where(eq(profilesTable.id, existing.id));
  } else {
    await db.insert(profilesTable).values({ email: a.email, ...values });
  }
}

// A competing offer. The "strong" one wins on price, area, standing, amenities,
// timeline and bank guarantee so the comparison score is clearly higher.
function offerValues(listingId: number, promoterId: string, strong: boolean) {
  return strong
    ? {
        listingId,
        promoterId,
        pricePerUnit: 2_400_000,
        newUnitArea: 110,
        newUnitsOffer: 1,
        estimatedDeliveredValue: 3_200_000,
        standing: "high_end",
        materials: "Pierre de Jérusalem, parquet chêne, cuisine équipée",
        floors: 9,
        parkingPerUnit: 1,
        elevator: true,
        bikeStorage: true,
        gym: true,
        lobby: true,
        replacementHousing: true,
        replacementHousingQuality: "Appartement équivalent dans le quartier",
        constructionDurationMonths: 28,
        startDelayMonths: 6,
        bankGuarantee: true,
        projectReferences: "Tour Rothschild 22, Florentin 8",
        message: "Offre haut de gamme — garantie bancaire, démarrage rapide.",
      }
    : {
        listingId,
        promoterId,
        pricePerUnit: 2_050_000,
        newUnitArea: 95,
        newUnitsOffer: 1,
        estimatedDeliveredValue: 2_700_000,
        standing: "standard",
        materials: "Finitions standard",
        floors: 7,
        parkingPerUnit: 1,
        elevator: true,
        bikeStorage: false,
        gym: false,
        lobby: false,
        replacementHousing: false,
        constructionDurationMonths: 36,
        startDelayMonths: 12,
        bankGuarantee: false,
        projectReferences: "",
        message: "Proposition standard.",
      };
}

async function main(): Promise<void> {
  const passwordHash = bcrypt.hashSync(PASSWORD, 10);

  const apporteurId = await upsertUser(APPORTEUR, passwordHash);
  await upsertProfile(APPORTEUR, passwordHash);

  const devIds: string[] = [];
  for (const d of DEVELOPERS) {
    devIds.push(await upsertUser(d, passwordHash));
    await upsertProfile(d, passwordHash);
  }

  await upsertUser(AGENCE, passwordHash);
  await upsertProfile(AGENCE, passwordHash);

  // Clean slate for re-runs (cascade removes this apporteur's offers + connections).
  await db
    .delete(demolitionListingsTable)
    .where(eq(demolitionListingsTable.ownerId, apporteurId));

  const ownerCommon = {
    ownerName: `${APPORTEUR.firstName} ${APPORTEUR.lastName}`,
    ownerEmail: APPORTEUR.email,
    ownerPhone: APPORTEUR.phone,
    isPaid: true,
  };

  // Projects 1 & 2 — ACTIVE with two competing offers each.
  const activeDefs = [
    { address: "Rehov Florentin 14", city: "Tel Aviv", neighborhood: "Florentin", units: 12, buildYear: 1968, projectType: "pinui_binui" },
    { address: "Rehov Balfour 7", city: "Bat Yam", neighborhood: "Centre", units: 8, buildYear: 1972, projectType: "tama38" },
  ];
  const createdActive: number[] = [];
  for (const p of activeDefs) {
    const [listing] = await db
      .insert(demolitionListingsTable)
      .values({ ownerId: apporteurId, ...p, status: "active", ...ownerCommon })
      .returning();
    await db
      .insert(demolitionOffersTable)
      .values([offerValues(listing.id, devIds[0], true), offerValues(listing.id, devIds[1], false)]);
    createdActive.push(listing.id);
  }

  // Project 3 — already 'offer_locked' (Alpha accepted, connection validated) so
  // the winning promoteur can mandate the agence for resale right away.
  const [p3] = await db
    .insert(demolitionListingsTable)
    .values({
      ownerId: apporteurId,
      address: "Rehov Bialik 30",
      city: "Ramat Gan",
      neighborhood: "Marom Naveh",
      units: 16,
      buildYear: 1965,
      projectType: "pinui_binui",
      status: "active",
      ...ownerCommon,
    })
    .returning();
  const offers3 = await db
    .insert(demolitionOffersTable)
    .values([offerValues(p3.id, devIds[0], true), offerValues(p3.id, devIds[1], false)])
    .returning();
  const winning = offers3[0]; // Alpha
  await db.update(demolitionOffersTable).set({ status: "accepted" }).where(eq(demolitionOffersTable.id, winning.id));
  await db.update(demolitionOffersTable).set({ status: "rejected" }).where(eq(demolitionOffersTable.id, offers3[1].id));
  await db
    .update(demolitionListingsTable)
    .set({ status: "offer_locked", acceptedOfferId: winning.id })
    .where(eq(demolitionListingsTable.id, p3.id));
  await db.insert(demolitionConnectionsTable).values({
    listingId: p3.id,
    promoterId: devIds[0],
    offerId: winning.id,
    status: "validated",
    commissionStatus: "due",
    validatedAt: new Date(),
  });

  console.log("\n✅ Scénario démo 3 rôles créé.\n");
  console.log(`Mot de passe commun : ${PASSWORD}\n`);
  console.log("Comptes :");
  console.log(`  Apporteur  : ${APPORTEUR.email}  → « Mes projets » (3 projets)`);
  console.log(`  Promoteur  : ${DEVELOPERS[0].email}  (${DEVELOPERS[0].company}, offre retenue)`);
  console.log(`  Promoteur  : ${DEVELOPERS[1].email}  (${DEVELOPERS[1].company})`);
  console.log(`  Agence     : ${AGENCE.email}  (${AGENCE.company}, vérifiée)\n`);
  console.log("Projets de l'apporteur :");
  console.log(`  Actif + 2 offres  → /demolition/${createdActive[0]}  (Tel Aviv, Florentin)`);
  console.log(`  Actif + 2 offres  → /demolition/${createdActive[1]}  (Bat Yam)`);
  console.log(`  Offre acceptée    → /demolition/${p3.id}  (Ramat Gan) — prêt pour la revente`);
  console.log("\n👉 Démo revente : connecte-toi en PROMOTEUR Alpha, ouvre");
  console.log(`   /demolition/${p3.id} et clique « Mandater une agence » → Cohen Immobilier.`);
  console.log("👉 Démo offres : en APPORTEUR, ouvre un projet actif et accepte une offre.\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
