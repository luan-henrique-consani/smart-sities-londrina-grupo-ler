import type { Metadata } from "next";
import { AlertsView } from "@/components/views/AlertsView";

export const metadata: Metadata = { title: "Alertas" };

// A tela depende da sessão e de dados da API (tudo no cliente): sem validação de navegação instantânea.
export const instant = false;

export default function AlertsPage() {
  return <AlertsView />;
}
