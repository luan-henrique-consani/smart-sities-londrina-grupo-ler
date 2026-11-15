"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";

const CACHE_PREFIX = "prevora:cache:";

function readCache<T>(path: string): T | null {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + path);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCache(path: string, data: unknown): void {
  try {
    window.localStorage.setItem(CACHE_PREFIX + path, JSON.stringify(data));
  } catch {
    // armazenamento indisponível ou cheio: segue sem cache
  }
}

/** Limpa os dados em cache (chamado no logout). */
export function clearApiCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // ignora
  }
}

type Result<T> = { key: string; data?: T; error?: ApiError; stale?: boolean };

export type ApiState<T> = {
  data: T | undefined;
  error: ApiError | undefined;
  loading: boolean;
  /** True quando os dados vêm do cache por falta de conexão. */
  stale: boolean;
  reload: () => void;
};

/**
 * Busca um endpoint GET. Em falha de conexão, usa os últimos dados em cache
 * (marcados como `stale`) para o sistema continuar útil offline.
 */
export function useApi<T>(path: string | null): ApiState<T> {
  const [result, setResult] = useState<Result<T> | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    api
      .get<T>(path)
      .then((data) => {
        writeCache(path, data);
        if (alive) setResult({ key: `${path}#${nonce}`, data });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const error =
          err instanceof ApiError
            ? err
            : new ApiError({
                message: "Erro inesperado ao carregar os dados.",
                status: 0,
                code: "unknown",
                kind: "unknown",
              });
        const cached = error.isConnectivity ? readCache<T>(path) : null;
        if (cached) setResult({ key: `${path}#${nonce}`, data: cached, stale: true });
        else setResult({ key: `${path}#${nonce}`, error });
      });
    return () => {
      alive = false;
    };
  }, [path, nonce]);

  const reload = useCallback(() => {
    setResult(null);
    setNonce((n) => n + 1);
  }, []);

  const current = path !== null && result?.key === `${path}#${nonce}` ? result : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: path !== null && current === null,
    stale: current?.stale ?? false,
    reload,
  };
}
