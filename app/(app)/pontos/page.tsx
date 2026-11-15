import type { Metadata } from "next";
import { PointsListView } from "@/components/views/PointsListView";

export const metadata: Metadata = { title: "Pontos reincidentes" };

// A tela depende da sessão e de dados da API (tudo no cliente): sem validação de navegação instantânea.
export const instant = false;

export default function PointsPage() {
  return <PointsListView />;
}
