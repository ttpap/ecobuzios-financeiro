import { PropsWithChildren } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Archive,
  BarChart3,
  Building2,
  FileText,
  FileBarChart,
  FolderKanban,
  LogOut,
  MoreHorizontal,
  Settings,
  Table2,
  ReceiptText,
  Code2,
  Repeat,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/lib/appStore";
import type { Project } from "@/lib/supabaseTypes";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { useProjectInvalidation } from "@/hooks/useProjectInvalidation";
import { CommandPalette } from "@/components/app/CommandPalette";
import { Search } from "lucide-react";

const primaryNav = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/balancete", label: "Balancete PRO", icon: Table2, match: "/balancete" },
  { to: "/balancete/execucao", label: "Execução", icon: ReceiptText },
  { to: "/balancete/relatorios", label: "Relatórios", icon: FileBarChart },
];

const secondaryNav = [
  { to: "/fornecedores", label: "Fornecedores", icon: Building2 },
  { to: "/documentos", label: "Documentos", icon: FileText },
];

const moreNav = [
  { to: "/projects", label: "Projetos", icon: FolderKanban },
  { to: "/arquivados", label: "Arquivados", icon: Archive },
  { to: "/api", label: "API", icon: Code2 },
  { to: "/settings", label: "Configurações", icon: Settings },
];

const allNav = [...primaryNav, ...secondaryNav, ...moreNav];

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const setActiveProjectId = useAppStore((s) => s.setActiveProjectId);
  useProjectInvalidation();

  const activeProjectQuery = useQuery({
    queryKey: ["project", activeProjectId],
    enabled: !!activeProjectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, project_number, execution_year")
        .eq("id", activeProjectId!)
        .maybeSingle();
      if (error) throw error;
      return data as Pick<Project, "id" | "name" | "project_number" | "execution_year"> | null;
    },
  });

  const activeProject = activeProjectQuery.data;

  function switchProject() {
    setActiveProjectId(null);
    navigate("/selecionar-projeto");
  }

  function openCommandPalette() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--app-bg))]">
      <CommandPalette />
      <header className="sticky top-0 z-30 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/dashboard" className="group flex items-center gap-2">
            <img src="/favicon.png" alt="EcoBúzios" className="h-10 w-auto" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-[hsl(var(--ink))]">
                EcoBúzios
              </div>
              <div className="text-xs text-[hsl(var(--muted-ink))]">
                Orçamento • Execução • Relatórios
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {primaryNav.map((item) => {
              const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/balancete"}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]"
                      : "text-[hsl(var(--ink))] hover:bg-black/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
            <div className="mx-1 h-5 w-px bg-black/10" />
            {secondaryNav.map((item) => {
              const active = location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]"
                      : "text-[hsl(var(--ink))] hover:bg-black/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition",
                    moreNav.some((i) => location.pathname.startsWith(i.to))
                      ? "bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]"
                      : "text-[hsl(var(--ink))] hover:bg-black/5"
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  Mais
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl">
                <DropdownMenuLabel>Gerenciar</DropdownMenuLabel>
                {moreNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.to} asChild>
                      <Link to={item.to} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden rounded-full md:inline-flex"
              onClick={openCommandPalette}
              title="Buscar (Ctrl+K)"
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar
              <kbd className="ml-2 rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold text-[hsl(var(--muted-ink))]">
                ⌘K
              </kbd>
            </Button>
            {activeProject && (
              <Button
                variant="outline"
                className="hidden rounded-full md:inline-flex"
                onClick={switchProject}
                title={activeProject.name}
              >
                <Repeat className="mr-2 h-4 w-4" />
                <span className="max-w-[180px] truncate">
                  {activeProject.project_number ? `#${activeProject.project_number} · ` : ""}
                  {activeProject.name}
                </span>
              </Button>
            )}
            <Button
              variant="outline"
              className="rounded-full md:hidden"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {activeProject && (
          <div className="mb-4 md:hidden">
            <Button
              variant="outline"
              className="w-full justify-start rounded-2xl"
              onClick={switchProject}
            >
              <Repeat className="mr-2 h-4 w-4" />
              <span className="truncate">
                {activeProject.project_number ? `#${activeProject.project_number} · ` : ""}
                {activeProject.name}
              </span>
            </Button>
          </div>
        )}
        <div className="mb-6 md:hidden">
          <div className="rounded-2xl border bg-white p-2">
            <div className="grid grid-cols-2 gap-2">
              {primaryNav.map((item) => {
                const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/balancete"}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                      active
                        ? "bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]"
                        : "text-[hsl(var(--ink))] hover:bg-black/5"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2">
              {secondaryNav.map((item) => {
                const active = location.pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                      active
                        ? "bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]"
                        : "text-[hsl(var(--ink))] hover:bg-black/5"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "col-span-2 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                      moreNav.some((i) => location.pathname.startsWith(i.to))
                        ? "bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]"
                        : "text-[hsl(var(--ink))] hover:bg-black/5"
                    )}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    Mais opções
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="rounded-2xl">
                  {moreNav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.to} asChild>
                        <Link to={item.to} className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Separator className="mt-6" />
        </div>

        <Breadcrumbs />
        {children}
      </div>

      <footer className="border-t bg-white/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-xs text-[hsl(var(--muted-ink))] md:px-6">
          <span>Feito para controle de execução financeira por rubrica.</span>
          <span>v0.2 (módulo)</span>
        </div>
      </footer>
    </div>
  );
}