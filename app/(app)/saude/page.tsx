import type { Metadata } from "next";
import { HealthView } from "@/components/views/HealthView";

export const metadata: Metadata = { title: "Saúde do sistema" };

// A tela depende da sessão e de dados da API (tudo no cliente): sem validação de navegação instantânea.
export const instant = false;

export default function HealthPage() {
  return <HealthView />;
}
