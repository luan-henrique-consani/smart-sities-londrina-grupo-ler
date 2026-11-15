import type { Metadata } from "next";
import { DashboardView } from "@/components/views/DashboardView";

export const metadata: Metadata = { title: "Painel" };

// A tela depende da sessão e de dados da API (tudo no cliente): sem validação de navegação instantânea.
export const instant = false;

export default function Home() {
  return <DashboardView />;
}
