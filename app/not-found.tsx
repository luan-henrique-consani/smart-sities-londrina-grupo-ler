import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-4 p-6">
      <Logo />
      <h1 className="font-display text-3xl font-bold">Página não encontrada</h1>
      <p className="text-muted">O endereço que você abriu não existe ou foi movido.</p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-semibold text-on-primary"
      >
        Voltar ao painel
      </Link>
    </main>
  );
}
