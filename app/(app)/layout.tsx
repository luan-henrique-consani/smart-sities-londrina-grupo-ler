import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/States";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense
      fallback={
        <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center p-6">
          <span className="sr-only">Carregando a Prevora…</span>
          <div className="flex w-full max-w-sm flex-col gap-3">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
