import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/lib/supabaseTypes";
import { useAppStore } from "@/lib/appStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Archive, RotateCcw, Trash2 } from "lucide-react";

export default function Arquivados() {
  const queryClient = useQueryClient();
  const setActiveProjectId = useAppStore((s) => s.setActiveProjectId);
  const activeProjectId = useAppStore((s) => s.activeProjectId);

  const projectsQuery = useQuery({
    queryKey: ["projects-archived"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const restoreProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ deleted_at: null } as any)
        .eq("id", projectId);
      if (error) throw error;
      return projectId;
    },
    onSuccess: () => {
      toast.success("Projeto restaurado");
      queryClient.invalidateQueries({ queryKey: ["projects-archived"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao restaurar"),
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      toast.success("Projeto excluído permanentemente");
      queryClient.invalidateQueries({ queryKey: ["projects-archived"] });
      if (activeProjectId === projectId) setActiveProjectId(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao excluir"),
  });

  const projects = projectsQuery.data ?? [];

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border bg-white p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand)/0.12)] px-3 py-1 text-xs font-medium text-[hsl(var(--brand))]">
          <Archive className="h-3.5 w-3.5" />
          Arquivados
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[hsl(var(--ink))]">
          Projetos Arquivados
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-ink))]">
          Projetos arquivados podem ser restaurados ou excluídos permanentemente.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-3xl border bg-white p-8 text-center text-sm text-[hsl(var(--muted-ink))]">
          Nenhum projeto arquivado.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((p: any) => (
            <Card key={p.id} className="rounded-3xl border bg-white p-5 shadow-sm opacity-75">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-ink))]">
                    <span>
                      {p.project_number ? `#${p.project_number}` : ""} {p.duration_months ?? 12} meses
                    </span>
                    {p.execution_year && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-black/20" />
                        <span className="rounded-full bg-black/5 px-2 py-0.5 font-medium text-[hsl(var(--ink))]">
                          Execução {p.execution_year}
                        </span>
                      </>
                    )}
                    {p.deleted_at && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-black/20" />
                        <span className="text-orange-500">
                          Arquivado em {new Date(p.deleted_at).toLocaleDateString("pt-BR")}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 text-lg font-semibold tracking-tight text-[hsl(var(--ink))]">
                    {p.name}
                  </div>
                  {p.description && (
                    <div className="mt-1 text-sm text-[hsl(var(--muted-ink))]">{p.description}</div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => restoreProject.mutate(p.id)}
                    disabled={restoreProject.isPending}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restaurar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="rounded-full text-red-600 hover:text-red-700">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação é irreversível e remove o projeto e todos os seus dados definitivamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="rounded-full bg-red-600 text-white hover:bg-red-700"
                          onClick={() => deleteProject.mutate(p.id)}
                        >
                          Excluir permanentemente
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
