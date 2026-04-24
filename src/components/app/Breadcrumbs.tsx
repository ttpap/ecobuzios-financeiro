import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projetos",
  "selecionar-projeto": "Selecionar projeto",
  balancete: "Balancete PRO",
  planilha: "Planilha",
  execucao: "Execução",
  importar: "Importar",
  montar: "Montar",
  lancamentos: "Lançamentos",
  relatorios: "Relatórios",
  alertas: "Alertas",
  configuracoes: "Configurações",
  linha: "Linha",
  fornecedores: "Fornecedores",
  documentos: "Documentos",
  arquivados: "Arquivados",
  api: "API",
  settings: "Configurações",
};

function labelFor(segment: string) {
  if (LABELS[segment]) return LABELS[segment];
  if (/^[0-9a-f-]{8,}$/i.test(segment)) return "…";
  return segment.replace(/-/g, " ");
}

export function Breadcrumbs({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length || segments[0] === "selecionar-projeto") return null;

  const crumbs = segments.map((seg, i) => ({
    label: labelFor(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "mb-4 flex items-center gap-1 text-xs text-[hsl(var(--muted-ink))]",
        className
      )}
    >
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-black/5"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <div key={c.href} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            {isLast ? (
              <span className="rounded-full px-2 py-1 font-medium text-[hsl(var(--ink))]">
                {c.label}
              </span>
            ) : (
              <Link
                to={c.href}
                className="rounded-full px-2 py-1 hover:bg-black/5"
              >
                {c.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
