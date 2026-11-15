import type { Metadata } from "next";
import { Suspense } from "react";
import { AwarenessView } from "@/components/views/AwarenessView";
import { LoadingBlock } from "@/components/States";

export const metadata: Metadata = { title: "Conscientização" };

// A tela depende da sessão e de dados da API (tudo no cliente): sem validação de navegação instantânea.
export const instant = false;

export default function AwarenessPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Carregando…" className="h-64" />}>
      <AwarenessView />
    </Suspense>
  );
}
