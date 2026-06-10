/**
 * Address geocoding + coordinate fuzzing for demolition listings.
 *
 * Exact coordinates are PRIVATE: they are geocoded once from the building's
 * address and only ever exposed to a revealed party (owner / admin / validated
 * promoter). For everyone else we publish a deterministically *fuzzed* center so
 * the map can draw an approximate circle without disclosing the exact location.
 */

export const APPROX_RADIUS_M = 400;

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Geocode a free-text address via Nominatim (OpenStreetMap) — free, no API key.
 * Best-effort: returns null on any failure so listing creation never blocks.
 * Nominatim usage policy requires a descriptive User-Agent and ≤1 req/s; this is
 * only called on listing creation / lazy backfill, well within limits.
 */
export async function geocodeAddress(
  address: string,
  city: string,
): Promise<LatLng | null> {
  const query = [address, city, "Israel"].filter(Boolean).join(", ");
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
    encodeURIComponent(query);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "NadlanConnect/1.0 (real-estate platform; geocoding)",
        "Accept-Language": "he,en",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

/**
 * Deterministic pseudo-random in [0, 1) seeded by an integer (mulberry32-style).
 * Same listing id always yields the same offset, so the published approximate
 * center is stable across requests (preventing triangulation by re-querying).
 */
function seededRand(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Offset exact coordinates by a fixed, id-seeded vector (~100–250 m) so the
 * exact point stays *inside* the published 400 m circle but is never its center.
 */
export function fuzzCoords(lat: number, lng: number, seed: number): LatLng {
  const rand = seededRand(seed + 1);
  const distanceM = 100 + rand() * 150; // 100–250 m
  const angle = rand() * 2 * Math.PI;
  const dNorth = distanceM * Math.cos(angle);
  const dEast = distanceM * Math.sin(angle);
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos((lat * Math.PI) / 180) || 1;
  return {
    lat: lat + dNorth / metersPerDegLat,
    lng: lng + dEast / metersPerDegLng,
  };
}
