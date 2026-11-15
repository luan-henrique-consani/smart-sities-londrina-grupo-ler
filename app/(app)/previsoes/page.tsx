import type { Metadata } from "next";
import { ForecastsView } from "@/components/views/ForecastsView";

export const metadata: Metadata = { title: "Previsões e resultados" };

// A tela depende da sessão e de dados da API (tudo no cliente): sem validação de navegação instantânea.
export const instant = false;

export default function ForecastsPage() {
  return <ForecastsView />;
}
