import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  area?: string;
}

interface State {
  hasError: boolean;
  error: Error | undefined;
}

/**
 * Regra 28: Global ErrorBoundary para evitar telas brancas
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-6 animate-in fade-in duration-500">
          <div className="bg-amber-50 p-6 rounded-full">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">
              ⚠️ Não foi possível carregar{" "}
              {this.props.area ? `esta área (${this.props.area})` : "esta área"}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto font-medium">
              Ocorreu uma falha na renderização ou no processamento de dados.
              {import.meta.env.DEV && this.state.error && (
                <span className="block mt-2 text-xs font-mono bg-muted p-2 rounded text-left overflow-auto max-h-32">
                  {this.state.error.message}
                </span>
              )}
            </p>
          </div>

          <Button
            onClick={this.handleReset}
            className="gap-2 font-bold shadow-lg shadow-primary/20"
          >
            <RefreshCcw size={18} /> TENTAR NOVAMENTE
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
