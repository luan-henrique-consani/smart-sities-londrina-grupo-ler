"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { api, errorMessage } from "@/lib/api";
import type { Decision, DecisionIn } from "@/lib/types";

const schema = z.object({
  recommendation: z.string().trim().min(3, "Descreva a recomendação (mínimo de 3 letras).").max(300, "Use até 300 caracteres."),
  decision: z.enum(["aceita", "adiada", "rejeitada"]),
  intervention: z.string().optional(),
  planned_date: z.string().optional(),
  notes: z.string().max(500, "Use até 500 caracteres.").optional(),
});

const INTERVENTIONS: [string, string][] = [
  ["limpeza", "Limpeza"],
  ["placa", "Placa de aviso"],
  ["porta_a_porta", "Ação porta a porta"],
  ["fiscalizacao", "Fiscalização no horário provável"],
  ["recuperacao_do_espaco", "Recuperação do espaço"],
  ["outra", "Outra"],
];

const FIELD = "min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground";

/** Modal (elemento <dialog>: foco preso, Esc fecha) para registrar recomendação → decisão → intervenção. */
export function DecisionDialog({
  pointId,
  open,
  suggestions,
  onClose,
  onSaved,
}: {
  pointId: string;
  open: boolean;
  suggestions: string[];
  onClose: () => void;
  onSaved: (d: Decision) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setApiError(null);
    const v = parsed.data;
    const body: DecisionIn = {
      recommendation: v.recommendation,
      decision: v.decision,
      intervention: v.decision === "aceita" && v.intervention ? v.intervention : null,
      planned_date: v.planned_date || null,
      notes: v.notes?.trim() || null,
    };
    setSaving(true);
    try {
      const saved = await api.post<Decision>(`/api/points/${encodeURIComponent(pointId)}/decisions`, body);
      onSaved(saved);
      onClose();
    } catch (err) {
      setApiError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="dec-title"
      onClose={onClose}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/50"
    >
      <form onSubmit={submit} noValidate className="flex max-h-[90vh] flex-col gap-4 overflow-y-auto p-5">
        <h2 id="dec-title" className="font-display text-xl font-semibold">
          Registrar decisão · {pointId}
        </h2>
        <p className="text-sm text-muted">
          Fica registrado só o problema e a decisão, nunca dados de moradores. No MVP o registro é
          guardado em memória e some quando o servidor reinicia.
        </p>

        <label className="flex flex-col gap-1 font-semibold">
          Recomendação do sistema
          <input
            name="recommendation"
            list="dec-sugestoes"
            defaultValue={suggestions[0] ?? ""}
            aria-invalid={!!errors.recommendation}
            aria-describedby={errors.recommendation ? "err-rec" : undefined}
            className={FIELD}
            maxLength={300}
          />
          <datalist id="dec-sugestoes">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {errors.recommendation && (
            <span id="err-rec" role="alert" className="text-sm font-medium text-critical">
              {errors.recommendation}
            </span>
          )}
        </label>

        <fieldset className="flex flex-col gap-1">
          <legend className="font-semibold">Decisão</legend>
          <div className="flex flex-wrap gap-2">
            {(["aceita", "adiada", "rejeitada"] as const).map((d, i) => (
              <label key={d} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 capitalize">
                <input type="radio" name="decision" value={d} defaultChecked={i === 0} className="h-5 w-5 accent-[var(--primary)]" />
                {d}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 font-semibold">
          Intervenção (se aceita)
          <select name="intervention" defaultValue="" className={FIELD}>
            <option value="">Nenhuma</option>
            {INTERVENTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 font-semibold">
          Data prevista
          <input type="date" name="planned_date" className={FIELD} />
        </label>

        <label className="flex flex-col gap-1 font-semibold">
          Observações
          <textarea
            name="notes"
            rows={3}
            maxLength={500}
            aria-invalid={!!errors.notes}
            className={`${FIELD} py-2`}
          />
          {errors.notes && <span role="alert" className="text-sm font-medium text-critical">{errors.notes}</span>}
        </label>

        {apiError && (
          <p role="alert" className="rounded-lg border border-critical px-3 py-2 text-critical">
            {apiError}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-border px-4 font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-lg bg-primary px-4 font-semibold text-on-primary disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Registrar decisão"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
