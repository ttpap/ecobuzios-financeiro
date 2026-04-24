import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/lib/supabaseTypes";
import { useAppStore } from "@/lib/appStore";
import { useSession } from "@/context/SessionContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FolderKanban, LogOut, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import ecoLogo from "@/assets/ecobuzios-logo.png";

export default function SelectProject() {
  const navigate = useNavigate();
  const { session, isLoading } = useSession();
  const setActiveProjectId = useAppStore((s) => s.setActiveProjectId);
  const activeProjectId = useAppStore((s) => s.activeProjectId);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const grouped = useMemo(() => {
    const arr = projectsQuery.data ?? [];
    const groups = new Map<string, Project[]>();
    for (const p of arr) {
      const y = p.execution_year ? String(p.execution_year) : "Sem ano";
      groups.set(y, [...(groups.get(y) ?? []), p]);
    }
    const sortedYears = Array.from(groups.keys()).sort((a, b) => {
      if (a === "Sem ano") return 1;
      if (b === "Sem ano") return -1;
      return Number(b) - Number(a);
    });
    return sortedYears.map((y) => ({
      yearLabel: y,
      projects: (groups.get(y) ?? []).slice().sort((p1, p2) =>
        String(p2.created_at).localeCompare(String(p1.created_at))
      ),
    }));
  }, [projectsQuery.data]);

  function pick(id: string) {
    setActiveProjectId(id);
    navigate("/dashboard", { replace: true });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[hsl(var(--app-bg))]">
        <div className="rounded-2xl border bg-white px-5 py-4 text-sm text-[hsl(var(--muted-ink))]">
          Carregando…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--app-bg))]">
      <header className="sticky top-0 z-30 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <img src={ecoLogo} alt="EcoBúzios" className="h-10 w-auto" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-[hsl(var(--ink))]">
                EcoBúzios
              </div>
              <div className="text-xs text-[hsl(var(--muted-ink))]">
                Escolha o projeto
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand)/0.12)] px-3 py-1 text-xs font-medium text-[hsl(var(--brand))]">
                <FolderKanban className="h-3.5 w-3.5" />
                Projetos
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[hsl(var(--ink))]">
                Em qual projeto você vai trabalhar?
              </h1>
              <p className="mt-1 text-sm text-[hsl(var(--muted-ink))]">
                Depois de escolher, todas as telas (Balancete, Execução, Relatórios) ficam fixas neste projeto.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/projects">
                <Plus className="mr-2 h-4 w-4" />
                Gerenciar
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6">
          {projectsQuery.isLoading && (
            <div className="rounded-3xl border bg-white p-6 text-sm text-[hsl(var(--muted-ink))]">
              Carregando projetos…
            </div>
          )}

          {!projectsQuery.isLoading && !grouped.length && (
            <div className="rounded-3xl border bg-white p-6 text-sm text-[hsl(var(--muted-ink))]">
              Nenhum projeto. <Link to="/projects" className="font-medium text-[hsl(var(--brand))] underline">Crie o primeiro</Link>.
            </div>
          )}

          {grouped.map((g) => (
            <div key={g.yearLabel} className="grid gap-3">
              <div
                className={cn(
                  "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold",
                  g.yearLabel === "Sem ano"
                    ? "bg-black/5 text-[hsl(var(--muted-ink))]"
                    : "bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand-strong))]"
                )}
              >
                {g.yearLabel === "Sem ano" ? "Sem Ano de Execução" : `Execução ${g.yearLabel}`}
                <span className="ml-2 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-[hsl(var(--ink))]">
                  {g.projects.length}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {g.projects.map((p) => (
                  <Card
                    key={p.id}
                    className={cn(
                      "group cursor-pointer rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md",
                      activeProjectId === p.id && "ring-2 ring-[hsl(var(--brand)/0.35)]"
                    )}
                    onClick={() => pick(p.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-ink))]">
                          <span>
                            {p.project_number ? `#${p.project_number}` : ""} {p.duration_months ?? 12} meses
                          </span>
                          <span className="h-1 w-1 rounded-full bg-black/20" />
                          <span className="rounded-full bg-black/5 px-2 py-0.5 font-medium text-[hsl(var(--ink))]">
                            {p.execution_year ? `Execução ${p.execution_year}` : "Definir ano"}
                          </span>
                        </div>
                        <div className="mt-1 text-lg font-semibold tracking-tight text-[hsl(var(--ink))]">
                          {p.name}
                        </div>
                        {p.description ? (
                          <div className="mt-1 line-clamp-2 text-sm text-[hsl(var(--muted-ink))]">{p.description}</div>
                        ) : null}
                      </div>
                      <Button
                        className="shrink-0 rounded-full bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand-strong))]"
                        onClick={(e) => {
                          e.stopPropagation();
                          pick(p.id);
                        }}
                      >
                        Selecionar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
