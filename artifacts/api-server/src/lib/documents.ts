import { db } from "@workspace/db";
import { usersTable, documentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export type DocumentCategory = "photo" | "plan" | "authorization";

/** Visibility is derived server-side from the category, never trusted from the client. */
export function visibilityForCategory(
  category: DocumentCategory
): "public" | "private" {
  return category === "authorization" ? "private" : "public";
}

export async function isAdmin(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return user?.role === "admin";
}

export function serializeDocument(d: typeof documentsTable.$inferSelect) {
  return {
    id: d.id,
    programId: d.programId ?? null,
    listingId: d.listingId ?? null,
    category: d.category as DocumentCategory,
    visibility: d.visibility as "public" | "private",
    url: `/api/documents/${d.id}/download`,
    fileName: d.fileName ?? null,
    mimeType: d.mimeType ?? null,
    createdAt: d.createdAt.toISOString(),
  };
}
