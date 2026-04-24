import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/lib/appStore";
import {
  BarChart3,
  Building2,
  FileBarChart,
  FileText,
  FolderKanban,
  ReceiptText,
  Repeat,
  Settings,
  Table2,
  Archive,
  Search,
} from "lucide-react";

type Project = { id: string; name: string; project_number?: string | null; execution_year?: number | null };

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: BarChart3 },
  { label: "Balancete PRO", to: "/balancete", icon: Table2 },
  { label: "Execução", to: "/balancete/execucao", icon: ReceiptText },
  { label: "Relatórios", to: "/balancete/relatorios", icon: FileBarChart },
  { label: "Fornecedores", to: "/fornecedores", icon: Building2 },
  { label: "Documentos", to: "/documentos", icon: FileText },
  { label: "Projetos", to: "/projects", icon: FolderKanban },
  { label: "Arquivados", to: "/arquivados", icon: Archive },
  { label: "Configurações", to: "/settings", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setActiveProjectId = useAppStore((s) => s.setActiveProjectId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const projectsQuery = useQuery({
    queryKey: ["projects-for-palette"],
    enabled: open,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, project_number, execution_year")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Project[];
    },
  });

  const filteredProjects = useMemo(() => {
    const list = projectsQuery.data ?? [];
    if (!search.trim()) return list.slice(0, 8);
    const q = search.toLowerCase();
    return list
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.project_number ?? "").toLowerCase().includes(q) ||
          String(p.execution_year ?? "").includes(q)
      )
      .slice(0, 12);
  }, [projectsQuery.data, search]);

  function go(to: string) {
    setOpen(false);
    setSearch("");
    navigate(to);
  }

  function switchToProject(id: string) {
    setOpen(false);
    setSearch("");
    setActiveProjectId(id);
    qc.invalidateQueries();
    navigate("/dashboard");
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar projeto ou página… (Ctrl+K)"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>

        {filteredProjects.length > 0 && (
          <CommandGroup heading="Trocar projeto">
            {filteredProjects.map((p) => (
              <CommandItem
                key={p.id}
                value={`proj-${p.id}-${p.name}-${p.project_number ?? ""}`}
                onSelect={() => switchToProject(p.id)}
              >
                <Repeat className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {p.project_number ? `#${p.project_number} · ` : ""}
                  {p.name}
                </span>
                {p.execution_year && (
                  <span className="ml-auto text-xs text-[hsl(var(--muted-ink))]">
                    {p.execution_year}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Ir para">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.to}
                value={`nav-${item.to}-${item.label}`}
                onSelect={() => go(item.to)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações">
          <CommandItem
            value="action-select-project"
            onSelect={() => {
              setOpen(false);
              setActiveProjectId(null);
              navigate("/selecionar-projeto");
            }}
          >
            <Search className="mr-2 h-4 w-4" />
            Trocar projeto (ir para seletor)
          </CommandItem>
          <CommandItem
            value="action-logout"
            onSelect={() => {
              setOpen(false);
              supabase.auth.signOut();
            }}
          >
            Sair
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
