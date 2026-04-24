import { useEffect } from "react";

export function useBeforeUnload(when: boolean, message = "Você tem alterações pendentes. Tem certeza que quer sair?") {
  useEffect(() => {
    if (!when) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [when, message]);
}
