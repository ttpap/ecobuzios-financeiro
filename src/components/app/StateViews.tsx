import { ReactNode } from "react";
import { Loader2, AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Carregando…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border bg-white p-8 text-center text-sm text-[hsl(var(--muted-ink))]",
        className
      )}
    >
      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[hsl(var(--brand))]" />
      {label}
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl border bg-white p-5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-3 h-6 w-2/3" />
          <Skeleton className="mt-2 h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border bg-white p-8 text-center",
        className
      )}
    >
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-black/5 text-[hsl(var(--muted-ink))]">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <div className="text-base font-semibold text-[hsl(var(--ink))]">{title}</div>
      {description && (
        <div className="mx-auto mt-1 max-w-md text-sm text-[hsl(var(--muted-ink))]">
          {description}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-red-200 bg-red-50 p-6 text-center",
        className
      )}
    >
      <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-red-100 text-red-600">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="text-sm font-semibold text-red-900">Algo deu errado</div>
      {message && (
        <div className="mx-auto mt-1 max-w-md text-sm text-red-700">{message}</div>
      )}
      {onRetry && (
        <Button
          variant="outline"
          className="mt-4 rounded-full border-red-300 text-red-700 hover:bg-red-100"
          onClick={onRetry}
        >
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
