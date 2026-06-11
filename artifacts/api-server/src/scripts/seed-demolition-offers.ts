/**
 * Seed a ready-to-test demolition (Tama 38 / Pinui-Binui) scenario:
 *   • a test owner account,
 *   • two test promoter (developer) accounts,
 *   • one ACTIVE demolition listing owned by the test owner,
 *   • two competing offers (Alpha clearly stronger) so the comparison score differs.
 *
 * After running, log in as the printed OWNER account, open the listing and click
 * "Accepter cette offre" on the Alpha offer to verify the open-bidding lock end
 * to end (Alpha → accepted, Beta → rejected, listing → offer_locked).
 *
 * Idempotent: the test owner's previous listings are removed first (cascade also
 * clears their offers + connections), so re-running always leaves exactly one
 * fresh scenario.
 */
import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  demolitionListingsTable,
  demolitionOffersTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const PASSWORD = "Test1234!";

interface SeedUser {
  email: string;
  fullName: string;
  role: "buyer" | "developer";
  company?: string;
}

const OWNER: SeedUser = {
  email: "test-owner@nadlanconnect.test",
  fullName: "Test Propriétaire",
  role: "buyer",
};

const DEVELOPERS: SeedUser[] = [
  {
    email: "test-dev1@nadlanconnect.test",
    fullName: "Promoteur Alpha",
    role: "developer",
    company: "Alpha Construction",
  },
  {
    email: "test-dev2@nadlanconnect.test",
    fullName: "Promoteur Beta",
    role: "developer",
    company: "Beta Real Estate",
  },
];

async function upsertUser(u: SeedUser, passwordHash: string): Promise<string> {
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, u.email))
    .limit(1);

  if (existing) {
    await db
      .update(usersTable)
      .set({
        fullName: u.fullName,
        role: u.role,
        company: u.company ?? null,
        passwordHash,
      })
      .where(eq(usersTable.id, existing.id));
    return existing.id;
  }

  const [created] = await db
    .insert(usersTable)
    .values({
      email: u.email,
      fullName: u.fullName,
      firstName: u.fullName.split(" ")[0],
      role: u.role,
      company: u.company ?? null,
      passwordHash,
    })
    .returning({ id: usersTable.id });
  return created.id;
}

async function main(): Promise<void> {
  const passwordHash = bcrypt.hashSync(PASSWORD, 10);

  const ownerId = await upsertUser(OWNER, passwordHash);
  const devIds: string[] = [];
  for (const d of DEVELOPERS) devIds.push(await upsertUser(d, passwordHash));

  // Clean slate for re-runs (cascade removes this owner's offers + connections).
  await db
    .delete(demolitionListingsTable)
    .where(eq(demolitionListingsTable.ownerId, ownerId));

  const [listing] = await db
    .insert(demolitionListingsTable)
    .values({
      ownerId,
      address: "Rehov HaTest 12",
      city: "Tel Aviv",
      neighborhood: "Florentin",
      units: 12,
      buildYear: 1968,
      projectType: "pinui_binui",
      ownerName: OWNER.fullName,
      ownerEmail: OWNER.email,
      ownerPhone: "+972 50 000 0000",
      status: "active",
      isPaid: true,
    })
    .returning();

  // Alpha is the stronger offer (price, area, amenities, faster, bank guarantee).
  await db.insert(demolitionOffersTable).values([
    {
      listingId: listing.id,
      promoterId: devIds[0],
      pricePerUnit: 2_400_000,
      newUnitArea: 110,
      newUnitsOffer: 1,
      estimatedDeliveredValue: 3_200_000,
      standing: "high_end",
      materials: "Pierre de Jérusalem, parquet chêne, cuisine haut de gamme",
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
      projectReferences: "Tour Rothschild 22, Projet Florentin 8",
      message: "Offre Alpha — standing élevé, garantie bancaire, démarrage rapide.",
    },
    {
      listingId: listing.id,
      promoterId: devIds[1],
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
      message: "Offre Beta — proposition standard.",
    },
  ]);

  console.log("\n✅ Scénario de test démolition créé.\n");
  console.log("Bien (listing) :");
  console.log(
    `  #${listing.id} — ${listing.neighborhood}, ${listing.city} (statut: ${listing.status})`,
  );
  console.log(`  URL : /demolition/${listing.id}\n`);
  console.log(`Comptes (mot de passe commun : ${PASSWORD}) :`);
  console.log(`  Propriétaire : ${OWNER.email}`);
  for (const d of DEVELOPERS) {
    console.log(`  Promoteur    : ${d.email} (${d.company})`);
  }
  console.log(
    "\n👉 Connecte-toi en PROPRIÉTAIRE, ouvre le bien et clique « Accepter cette offre » sur l'offre Alpha.",
  );
  console.log(
    "   Attendu : Alpha « retenue », Beta « non retenue », le bien passe en « offer_locked ».\n",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
