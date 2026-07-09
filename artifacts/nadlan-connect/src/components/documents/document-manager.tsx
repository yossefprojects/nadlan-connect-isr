import { useState } from "react";
import {
  useListProgramDocuments,
  useListListingDocuments,
  useAddProgramDocument,
  useAddListingDocument,
  useDeleteDocument,
  getListProgramDocumentsQueryKey,
  getListListingDocumentsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@workspace/object-storage-web";
import { useLanguage } from "@/components/layout/language-provider";
import { Loader2, FileText, ImageIcon, ShieldAlert, Trash2, ExternalLink } from "lucide-react";

type Category = "photo" | "plan" | "authorization";

interface DocumentManagerProps {
  programId?: number;
  listingId?: number;
  /** When true, shows upload + delete controls (owner/admin only). */
  canManage?: boolean;
}

const CATEGORY_ICON: Record<Category, typeof FileText> = {
  photo: ImageIcon,
  plan: FileText,
  authorization: ShieldAlert,
};

export function DocumentManager({
  programId,
  listingId,
  canManage = false,
}: DocumentManagerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const programDocs = useListProgramDocuments(programId ?? 0, {
    query: {
      enabled: programId != null,
      queryKey: getListProgramDocumentsQueryKey(programId ?? 0),
    },
  });
  const listingDocs = useListListingDocuments(listingId ?? 0, {
    query: {
      enabled: listingId != null,
      queryKey: getListListingDocumentsQueryKey(listingId ?? 0),
    },
  });

  const query = programId != null ? programDocs : listingDocs;
  const documents = query.data ?? [];

  const addProgramDoc = useAddProgramDocument();
  const addListingDoc = useAddListingDocument();
  const deleteDoc = useDeleteDocument();

  const [category, setCategory] = useState<Category>("photo");
  const [file, setFile] = useState<File | null>(null);

  const { uploadFile, isUploading } = useUpload({
    onError: () => toast({ title: t("documents.uploadError"), variant: "destructive" }),
  });

  const isBusy = isUploading || addProgramDoc.isPending || addListingDoc.isPending;

  const handleUpload = async () => {
    if (!file) {
      toast({ title: t("documents.selectFile"), variant: "destructive" });
      return;
    }
    try {
      const res = await uploadFile(file);
      if (!res?.objectPath) return;
      const data = {
        category,
        objectPath: res.objectPath,
        fileName: file.name,
        mimeType: file.type || undefined,
      };
      if (programId != null) {
        await addProgramDoc.mutateAsync({ programId, data });
      } else if (listingId != null) {
        await addListingDoc.mutateAsync({ listingId, data });
      }
      setFile(null);
      toast({ title: t("documents.uploaded") });
      await query.refetch();
    } catch {
      toast({ title: t("documents.uploadError"), variant: "destructive" });
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!window.confirm(t("documents.confirmDelete"))) return;
    try {
      await deleteDoc.mutateAsync({ documentId });
      toast({ title: t("documents.deleted") });
      await query.refetch();
    } catch {
      toast({ title: t("documents.deleteError"), variant: "destructive" });
    }
  };

  const groups: { category: Category; label: string }[] = [
    { category: "photo", label: t("documents.photos") },
    { category: "plan", label: t("documents.plans") },
    { category: "authorization", label: t("documents.authorizations") },
  ];

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("documents.category")}
              </label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">{t("documents.category.photo")}</SelectItem>
                  <SelectItem value="plan">{t("documents.category.plan")}</SelectItem>
                  <SelectItem value="authorization">
                    {t("documents.category.authorization")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("documents.file")}
              </label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="button" onClick={handleUpload} disabled={isBusy}>
              {isBusy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("documents.upload")}
            </Button>
          </div>
          {category === "authorization" && (
            <p className="text-xs text-amber-700 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> {t("documents.privateHint")}
            </p>
          )}
        </div>
      )}

      <div className="space-y-5">
        {groups.map(({ category: cat, label }) => {
          const docs = documents.filter((d) => d.category === cat);
          const Icon = CATEGORY_ICON[cat];
          if (docs.length === 0 && !canManage) return null;
          return (
            <div key={cat}>
              <h4 className="text-sm font-semibold text-primary flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" /> {label}
              </h4>
              {docs.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("documents.empty")}</p>
              ) : (
                <ul className="space-y-2">
                  {docs.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-sm"
                    >
                      <span className="truncate flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{doc.fileName ?? `#${doc.id}`}</span>
                        {doc.visibility === "private" && (
                          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 shrink-0">
                            {t("documents.visibility.private")}
                          </Badge>
                        )}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <a href={doc.url.startsWith("/objects/") ? `/api/storage${doc.url}` : doc.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-8">
                            <ExternalLink className="h-4 w-4 me-1" /> {t("documents.view")}
                          </Button>
                        </a>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
