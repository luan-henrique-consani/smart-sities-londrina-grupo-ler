import type { Metadata } from "next";
import { MyDataView } from "@/components/views/MyDataView";

export const metadata: Metadata = { title: "Meus dados" };

// A tela depende da sessão (tudo no cliente): sem validação de navegação instantânea.
export const instant = false;

export default function MyDataPage() {
  return <MyDataView />;
}
