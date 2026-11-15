import type { Metadata } from "next";
import { ComingSoon } from "@/components/views/ComingSoon";

export const metadata: Metadata = { title: "Pontos reincidentes" };

// A tela depende da sessão e de dados da API (tudo no cliente): sem validação de navegação instantânea.
export const instant = false;

export default function PointsPage() {
  return (
    <ComingSoon
      title="Pontos reincidentes"
      items={[
        "Lista de pontos reincidentes com filtros e ordenação",
        "Linha do tempo de episódios e padrão de horário",
        "Registro de decisões sobre cada ponto",
      ]}
    >
      Esta tela chega na próxima etapa. Enquanto isso, abra um ponto pelo mapa para ver o resumo
      dele.
    </ComingSoon>
  );
}
