import Link from "next/link";
import { IconShield } from "@/components/icons";

/** Tela amigável para rotas fora do perfil Visitante (não revela nada do conteúdo interno). */
export function AccessRestricted() {
  return (
    <section
      role="alert"
      aria-labelledby="acesso-restrito-titulo"
      className="card mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 p-8 text-center"
    >
      <IconShield size={40} />
      <h1 id="acesso-restrito-titulo" className="font-display text-2xl font-bold">
        Acesso restrito
      </h1>
      <p className="text-muted">
        Esta funcionalidade está disponível apenas para usuários autorizados da Prevora.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-bold text-on-primary"
      >
        Voltar ao painel
      </Link>
    </section>
  );
}
