"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/clientLog";

/** Captura window.onerror e unhandledrejection e envia para POST /api/logs/client. */
export function ClientErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError({
        message: event.message || "Erro de script",
        stack: event.error instanceof Error ? event.error.stack : null,
        component: "window.onerror",
      });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      reportClientError({
        message: reason instanceof Error ? reason.message : String(reason ?? "Promessa rejeitada"),
        stack: reason instanceof Error ? reason.stack : null,
        component: "unhandledrejection",
      });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
