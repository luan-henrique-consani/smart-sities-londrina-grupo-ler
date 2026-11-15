import type { Metadata } from "next";
import { ComingSoon } from "@/components/views/ComingSoon";

export const metadata: Metadata = { title: "Previsões e resultados" };

// A tela depende da sessão e de dados da API (tudo no cliente): sem validação de navegação instantânea.
export const instant = false;

export default function ForecastsPage() {
  return (
    <ComingSoon
      title="Previsões e resultados"
      items={[
        "Indicadores de impacto antes × depois do início das previsões",
        "Gráficos por ano (2022–2026) e próximos 3 meses: sem ação × com o plano",
        "Calendário de riscos sazonais e resumo gerado por IA",
      ]}
    >
      Esta tela chega na próxima etapa, com as previsões e a comparação de cenários.
    </ComingSoon>
  );
}
