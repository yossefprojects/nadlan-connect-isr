// Source unique des villes proposées dans les sélecteurs (programmes & annonces).
// Les libellés sont résolus via les clés i18n "city.<code>" (voir lib/i18n.ts),
// disponibles en FR / EN / HE.
//
// Les 6 premiers codes (tlv, jer, nat, ash, hfa, bs) sont HISTORIQUES et
// conservés tels quels pour rester compatibles avec les données déjà
// enregistrées. Les 14 autres reprennent les identifiants de
// api-server/src/data/villes-config.json (même liste de villes côté IA).
export const CITIES = [
  "tlv",
  "herzliya",
  "jer",
  "givatayim",
  "ramat-gan",
  "raanana",
  "nat",
  "rishon-lezion",
  "bat-yam",
  "petah-tikva",
  "ash",
  "holon",
  "kfar-saba",
  "hod-hasharon",
  "modiin",
  "rehovot",
  "rosh-haayin",
  "hfa",
  "bs",
  "ashkelon",
] as const;

export type CityCode = (typeof CITIES)[number];
