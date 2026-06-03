export const CITY_LABELS: Record<string, string> = {
  tlv: "Tel Aviv",
  jer: "Jérusalem",
  hfa: "Haïfa",
  bs: "Beer-Sheva",
  nat: "Netanya",
  ash: "Ashdod",
};

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildListingSlug(title: string, ville: string): string {
  const titleSlug = slugify(title);
  const citySlug = slugify(CITY_LABELS[ville] ?? ville);
  const base =
    !citySlug || titleSlug.includes(citySlug)
      ? titleSlug
      : `${titleSlug}-${citySlug}`;
  return base || "bien";
}
