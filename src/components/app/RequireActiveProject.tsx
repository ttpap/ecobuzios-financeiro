import { PropsWithChildren, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/appStore";

export function RequireActiveProject({ children }: PropsWithChildren) {
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeProjectId) {
      navigate("/selecionar-projeto", { replace: true });
    }
  }, [activeProjectId, navigate]);

  if (!activeProjectId) return null;
  return <>{children}</>;
}
