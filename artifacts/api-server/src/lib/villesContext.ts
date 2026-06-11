// Charge la liste de référence des villes (villes-config.json) et la met en
// forme pour être injectée dans le paramètre `system` de Claude, afin que l'IA
// dispose des prix de marché réels (₪/m²) pour ces grandes villes israéliennes.
import config from "../data/villes-config.json";

interface Ville {
  id: string;
  nom_fr: string;
  nom_he: string;
  district: string;
  prix_m2_moyen_ancien: number;
  prix_m2_moyen_neuf: number;
  cout_construction_m2: number;
  type_dominant: string;
}

const villes = (config as { villes: Ville[] }).villes;

function fmt(n: number): string {
  // Normalise les séparateurs de milliers (espaces insécables) en espace simple.
  return n.toLocaleString("fr-FR").replace(/\s/g, " ");
}

const lignes = villes
  .map(
    (v) =>
      `- ${v.nom_fr} (${v.nom_he}, district ${v.district}) : ancien ~ ${fmt(
        v.prix_m2_moyen_ancien,
      )} NIS/m2 - neuf ~ ${fmt(v.prix_m2_moyen_neuf)} NIS/m2 - cout construction ~ ${fmt(
        v.cout_construction_m2,
      )} NIS/m2 - profil : ${v.type_dominant}`,
  )
  .join("\n");

export const VILLES_MARKET_REFERENCE = `REFERENCE PRIX DE MARCHE - ${villes.length} grandes villes israeliennes (valeurs medianes indicatives, en NIS/m2) :
${lignes}

UTILISATION DE CETTE REFERENCE : lorsque le bien analyse se situe dans l'une de ces villes, sers-toi de ces valeurs comme ANCRAGE :
- marketPricePerSqm (point de depart de la methode comparative) <- prix de l'ancien de la ville ;
- estimation du neuf et chiffre d'affaires promoteur <- prix du neuf de la ville ;
- constructionCostPerSqm du bilan promoteur <- cout de construction de la ville (il remplace le defaut generique de 18 000 NIS/m2).
Ajuste ensuite ces ancrages selon le quartier precis, l'etage, l'etat, les caracteristiques et le potentiel du bien. Ces valeurs sont indicatives : affine-les avec ta connaissance du marche si necessaire.`;
