"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "@/lib/clientLog";
import { ErrorState } from "@/components/States";

type Props = { children: ReactNode; component?: string; fallback?: ReactNode };
type State = { error: Error | null };

/** Error Boundary reutilizável: isola falhas de um bloco e as envia para /api/logs/client. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError({
      message: error.message,
      stack: `${error.stack ?? ""}\n${info.componentStack ?? ""}`,
      component: this.props.component ?? "ErrorBoundary",
    });
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <ErrorState
            title="Esta área não pôde ser exibida"
            error={new Error("Ocorreu um erro inesperado neste bloco. O restante do sistema continua funcionando.")}
            onRetry={() => this.setState({ error: null })}
          />
        )
      );
    }
    return this.props.children;
  }
}
