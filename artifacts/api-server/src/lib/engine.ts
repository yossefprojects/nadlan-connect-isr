// israelRealEstateEngine — simplified inline engine for NadlanConnect
// Based on the engine described in the cahier des charges

const CITY_BASE_PRICES: Record<string, number> = {
  tlv: 55000,   // Tel Aviv - ₪/m²
  jer: 32000,   // Jerusalem
  hfa: 22000,   // Haïfa
  bs:  10000,   // Beer-Sheva
  nat: 25000,   // Netanya
  ash: 18000,   // Ashdod
};

const TYPE_MULTIPLIER: Record<string, number> = {
  resale: 1.0,
  new_development: 1.15,
};

export function calcEstimation(params: {
  ville: string;
  surface: number;
  nbPieces: number;
  etage?: number | null;
  type?: string;
}): { estimatedPrice: number } {
  const basePrice = CITY_BASE_PRICES[params.ville] ?? 20000;
  const typeMultiplier = TYPE_MULTIPLIER[params.type ?? "resale"] ?? 1.0;
  const etageBonus = params.etage && params.etage > 5 ? 1.05 : 1.0;
  const roomBonus = 1 + (params.nbPieces - 3) * 0.02;

  const estimatedPrice = Math.round(
    basePrice * params.surface * typeMultiplier * etageBonus * roomBonus
  );

  return { estimatedPrice };
}

export function calcInvestmentScore(params: {
  ville: string;
  type?: string;
  price: number;
  estimatedPrice: number;
  surface: number;
}): { score: number } {
  const baseScore: Record<string, number> = {
    tlv: 80,
    jer: 70,
    hfa: 65,
    nat: 68,
    ash: 62,
    bs: 55,
  };

  let score = baseScore[params.ville] ?? 50;

  // Price vs estimated: below market = better investment
  const ratio = params.price / params.estimatedPrice;
  if (ratio < 0.9) score += 15;
  else if (ratio < 1.0) score += 8;
  else if (ratio > 1.1) score -= 10;
  else if (ratio > 1.05) score -= 5;

  // New developments get a slight bonus
  if (params.type === "new_development") score += 5;

  // Large surfaces get a bonus
  if (params.surface > 120) score += 3;
  else if (params.surface < 40) score -= 3;

  return { score: Math.min(100, Math.max(0, Math.round(score))) };
}
