import type { Metadata } from "next";
import { Suspense } from "react";
import { MapPanel } from "@/components/map/MapPanel";
import { LoadingBlock } from "@/components/States";

export const metadata: Metadata = { title: "Mapa e alertas" };

// A tela depende da sessão e de dados da API (tudo no cliente): sem validação de navegação instantânea.
export const instant = false;

export default function MapPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <header>
        <h1 className="font-display text-3xl font-bold">Mapa e alertas</h1>
        <p className="mt-1 max-w-3xl text-muted">
          Pontos de descarte irregular e áreas de risco de alagamento de Londrina. Use os filtros
          para focar no que exige ação e clique em um alerta para ver o local no mapa.
        </p>
      </header>
      <Suspense fallback={<LoadingBlock label="Carregando o mapa…" className="h-96" />}>
        <MapPanel />
      </Suspense>
    </div>
  );
}
