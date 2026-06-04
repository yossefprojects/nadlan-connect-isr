import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import {
  useCreateProgram,
  useUpdateProgram,
  useDeleteProgram,
  usePublishProgram,
  useGetProgram,
  getGetProgramQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/layout/language-provider";
import { DocumentManager } from "@/components/documents/document-manager";
import { Loader2, ArrowLeft, Trash2, Send, Plus, Edit } from "lucide-react";

const CITIES = ["tlv", "jer", "hfa", "bs", "nat", "ash"];

export default function DashboardProgrammeEdit() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/dashboard/programmes/:id/edit");
  const programIdParam = params?.id;
  const isEdit = !!programIdParam;

  const { data: detail, isLoading } = useGetProgram(programIdParam ?? "", {
    query: {
      enabled: isEdit,
      queryKey: getGetProgramQueryKey(programIdParam ?? ""),
    },
  });

  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const deleteProgram = useDeleteProgram();
  const publishProgram = usePublishProgram();

  const [form, setForm] = useState({
    title: "",
    description: "",
    ville: "",
    quartier: "",
  });

  useEffect(() => {
    if (detail?.program) {
      setForm({
        title: detail.program.title,
        description: detail.program.description ?? "",
        ville: detail.program.ville,
        quartier: detail.program.quartier ?? "",
      });
    }
  }, [detail]);

  const programId = detail?.program.id;

  const handleSave = async () => {
    if (!form.title || !form.ville) {
      toast({ title: t("programs.fillRequired"), variant: "destructive" });
      return;
    }
    try {
      if (isEdit && programId != null) {
        await updateProgram.mutateAsync({
          programId,
          data: {
            title: form.title,
            description: form.description,
            ville: form.ville,
            quartier: form.quartier,
          },
        });
        toast({ title: t("programs.updated") });
      } else {
        const created = await createProgram.mutateAsync({
          data: {
            title: form.title,
            description: form.description,
            ville: form.ville,
            quartier: form.quartier,
          },
        });
        toast({ title: t("programs.created") });
        setLocation(`/dashboard/programmes/${created.id}/edit`);
      }
    } catch {
      toast({ title: t("programs.saveError"), variant: "destructive" });
    }
  };

  const handlePublish = async () => {
    if (programId == null) return;
    try {
      await publishProgram.mutateAsync({ programId });
      toast({ title: t("programs.published") });
    } catch {
      toast({ title: t("programs.publishError"), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (programId == null) return;
    if (!window.confirm(t("programs.confirmDelete"))) return;
    try {
      await deleteProgram.mutateAsync({ programId });
      toast({ title: t("programs.deleted") });
      setLocation("/dashboard/programmes");
    } catch {
      toast({ title: t("programs.saveError"), variant: "destructive" });
    }
  };

  if (isEdit && isLoading) {
    return <div className="container py-8">{t("common.loading")}</div>;
  }

  return (
    <div className="container py-8 max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/programmes">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {t("programs.backToList")}
          </Button>
        </Link>
        {isEdit && detail?.program && (
          <Badge
            variant="outline"
            className={
              detail.program.status === "published"
                ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                : ""
            }
          >
            {t(`programs.status.${detail.program.status}`)}
          </Badge>
        )}
      </div>

      <h1 className="font-serif text-3xl font-bold text-primary">
        {isEdit ? t("programs.editTitle") : t("programs.newTitle")}
      </h1>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("programs.fieldTitle")}</label>
            <Input
              dir="auto"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t("programs.titlePlaceholder")}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("programs.fieldCity")}</label>
              <Select value={form.ville} onValueChange={(v) => setForm({ ...form, ville: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("listingForm.cityPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`city.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("programs.fieldQuartier")}</label>
              <Input
                dir="auto"
                value={form.quartier}
                onChange={(e) => setForm({ ...form, quartier: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("programs.fieldDescription")}</label>
            <Textarea
              dir="auto"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-3 pt-2 border-t">
            <Button onClick={handleSave} disabled={createProgram.isPending || updateProgram.isPending}>
              {(createProgram.isPending || updateProgram.isPending) && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {t("programs.save")}
            </Button>
            {isEdit && detail?.program.status !== "published" && (
              <Button variant="outline" onClick={handlePublish} disabled={publishProgram.isPending} className="gap-2">
                <Send className="h-4 w-4" /> {t("programs.publish")}
              </Button>
            )}
            {isEdit && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="gap-2 text-destructive hover:text-destructive ms-auto"
              >
                <Trash2 className="h-4 w-4" /> {t("programs.delete")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isEdit && programId != null && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl text-primary">{t("documents.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentManager programId={programId} canManage />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-xl text-primary">{t("programs.projets")}</CardTitle>
              <Link href={`/dashboard/listings/new?programId=${programId}`}>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" /> {t("programs.addProjet")}
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!detail?.projets || detail.projets.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("programs.noProjets")}</p>
              ) : (
                <ul className="divide-y">
                  {detail.projets.map((projet) => (
                    <li key={projet.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium">{projet.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {t(`city.${projet.ville}`)} · {t(`status.${projet.status}`)}
                        </div>
                      </div>
                      <Link href={`/dashboard/listings/${projet.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8 gap-1">
                          <Edit className="h-4 w-4" /> {t("dashboard.edit")}
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
