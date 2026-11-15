import type { Metadata } from "next";
import { ComingSoon } from "@/components/views/ComingSoon";

export const metadata: Metadata = { title: "Conscientização" };

// A tela depende da sessão e de dados da API (tudo no cliente): sem validação de navegação instantânea.
export const instant = false;

export default function AwarenessPage() {
  return (
    <ComingSoon
      title="Conscientização"
      items={[
        "Cartaz, post para redes, roteiro porta a porta e plano de ação de 30 dias",
        "Seletores de público e tom, com versões alternativas",
        "Textos com o selo “Gerado por IA · revise antes de usar”",
      ]}
    >
      Esta tela chega na próxima etapa, com os materiais gerados a partir dos pontos reincidentes.
    </ComingSoon>
  );
}
