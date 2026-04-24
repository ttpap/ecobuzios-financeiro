import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/appStore";

const PROJECT_SCOPED_KEYS = [
  "project",
  "budget",
  "budgets",
  "budget-lines",
  "budget-categories",
  "lines",
  "categories",
  "transactions",
  "execucao",
  "dashboard",
  "report",
  "relatorios",
  "documentos",
];

export function useProjectInvalidation() {
  const qc = useQueryClient();
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const prev = useRef<string | null>(activeProjectId);

  useEffect(() => {
    if (prev.current === activeProjectId) return;
    prev.current = activeProjectId;

    for (const key of PROJECT_SCOPED_KEYS) {
      qc.invalidateQueries({ queryKey: [key] });
    }
  }, [activeProjectId, qc]);
}
