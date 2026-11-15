import type { Metadata } from "next";
import { Suspense } from "react";
import { PointView } from "@/components/views/PointView";
import { LoadingBlock } from "@/components/States";

export const metadata: Metadata = { title: "Ponto de descarte" };

// A tela depende da sessão e de dados da API (tudo no cliente): sem validação de navegação instantânea.
export const instant = false;

export default function PointPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Carregando o ponto…" className="h-64" />}>
      <PointView />
    </Suspense>
  );
}
