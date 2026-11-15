import type { Metadata } from "next";
import { InviteView } from "@/components/views/InviteView";

export const metadata: Metadata = { title: "Convite" };

// A tela depende da sessão (tudo no cliente): sem validação de navegação instantânea.
export const instant = false;

export default function InvitePage() {
  return <InviteView />;
}
