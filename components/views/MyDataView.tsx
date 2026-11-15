"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime, ROLE_LABEL } from "@/lib/format";
import type { DeletionRequest } from "@/lib/types";

export function MyDataView() {
  const { user, consent, logout } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    setExporting(true);
    setError(null);
    setExported(false);
    try {
      const text = await api.get<string>("/api/privacy/my-data", { raw: true });
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "meus-dados-prevora.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExported(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  async function onDelete() {
    setDeleting(true);
    setError(null);
    try {
      await api.delete<DeletionRequest>("/api/privacy/my-data");
      await logout();
      router.replace("/login");
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header>
        <h1 className="font-display text-3xl font-bold">Meus dados</h1>
        <p className="mt-1 text-muted">
          A Prevora guarda o problema, não a pessoa. Aqui está o que guardamos sobre você, servidor.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-lg border-2 border-critical bg-surface px-3 py-2 text-sm font-medium text-critical">
          {error}
        </p>
      )}

      <section aria-labelledby="md-cadastro" className="card p-5">
        <h2 id="md-cadastro" className="font-display text-xl font-semibold">
          Seu cadastro
        </h2>
        {user && (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">Nome</dt>
            <dd>{user.name}</dd>
            <dt className="text-muted">E-mail</dt>
            <dd className="break-all">{user.email}</dd>
            <dt className="text-muted">Cargo</dt>
            <dd>{user.job_title}</dd>
            <dt className="text-muted">Perfil</dt>
            <dd>{ROLE_LABEL[user.role]}</dd>
            <dt className="text-muted">Termo aceito</dt>
            <dd>
              {consent?.accepted
                ? `Versão ${consent.accepted_version}${consent.accepted_at ? `, em ${formatDateTime(consent.accepted_at)}` : ""}`
                : "Pendente"}
            </dd>
          </dl>
        )}
        <p className="mt-3 text-sm text-muted">
          Retenção: ocorrências por 5 anos; logs de acesso e trilha de auditoria por 6 meses. Leia a{" "}
          <Link href="/privacidade" className="font-semibold underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="md-exportar" className="card p-5">
        <h2 id="md-exportar" className="font-display text-xl font-semibold">
          Exportar meus dados
        </h2>
        <p className="mt-2 text-sm text-muted">
          Baixa um arquivo JSON com seu cadastro, consentimento, decisões registradas e trilha de
          acesso. A exportação fica registrada na auditoria.
        </p>
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className="mt-4 min-h-11 rounded-lg bg-primary px-4 font-semibold text-on-primary disabled:opacity-60"
        >
          {exporting ? "Gerando…" : "Baixar meus dados (JSON)"}
        </button>
        {exported && (
          <p role="status" className="mt-3 text-sm font-medium text-primary">
            ✓ Arquivo gerado.
          </p>
        )}
      </section>

      <section aria-labelledby="md-excluir" className="card border-critical p-5">
        <h2 id="md-excluir" className="font-display text-xl font-semibold">
          Pedir a exclusão dos meus dados
        </h2>
        <p className="mt-2 text-sm text-muted">
          Registramos o pedido, removemos suas decisões e seu consentimento guardados em memória e
          encerramos sua sessão. O cadastro de origem e a trilha de auditoria seguem a retenção legal
          e são tratados pelo encarregado.
        </p>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-4 min-h-11 rounded-lg border-2 border-critical px-4 font-semibold text-critical hover:bg-surface-2"
          >
            Pedir exclusão…
          </button>
        ) : (
          <div role="alertdialog" aria-label="Confirmar exclusão" className="mt-4 flex flex-col gap-3 rounded-lg bg-surface-2 p-4">
            <p className="text-sm font-semibold">Tem certeza? Você será desconectado.</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="min-h-11 rounded-lg bg-critical px-4 font-bold text-white disabled:opacity-60"
              >
                {deleting ? "Registrando…" : "Sim, excluir meus dados"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="min-h-11 rounded-lg border border-border px-4 font-medium hover:bg-surface"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
