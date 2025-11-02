import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button"; // Added Button import

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true, error: _, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-destructive/10 text-destructive-foreground p-4 text-center">
          <AlertCircle className="h-16 w-16 mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Ocorreu um erro inesperado.</h1>
          <p className="text-lg mb-4">
            Algo deu errado. Por favor, tente recarregar a página.
          </p>
          <Button onClick={() => window.location.reload()} className="bg-destructive hover:bg-destructive/90">
            Recarregar Página
          </Button>
          {this.state.error && (
            <details className="mt-8 p-4 bg-destructive/20 rounded-md text-left max-w-lg overflow-auto text-sm">
              <summary className="font-semibold cursor-pointer">Detalhes do Erro</summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">
                {this.state.error.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;