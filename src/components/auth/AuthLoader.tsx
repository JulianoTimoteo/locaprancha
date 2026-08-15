import React from "react";
import { Loader2 } from "lucide-react";

interface AuthLoaderProps {
  message?: string;
}

export function AuthLoader({ message = "Aguarde..." }: AuthLoaderProps) {
  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
        <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
      </div>
      <div className="mt-8 text-center space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-primary animate-pulse">
          {message}
        </p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
          Sincronizando com Servidor Seguro
        </p>
      </div>
    </div>
  );
}
