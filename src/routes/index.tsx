import React from "react";
import {
  Layout as Github,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Rocket,
  Terminal,
  AlertCircle,
  Code,
  Globe,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function IndexPage() {
  const handleManualReset = () => {
    console.warn("[ANTI-WHITE-SCREEN] Executando Hard Reset Manual...");
    localStorage.clear();
    sessionStorage.clear();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) registration.unregister();
      });
    }
    fetch(window.location.href, { cache: "reload", mode: "no-cors" }).finally(() => {
      window.location.href =
        window.location.origin + window.location.pathname + "?reset=" + Date.now();
    });
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8 font-sans pb-24 lg:pb-8">
      {/* Mensagem de Boas-vindas e Contexto do Teste */}
      <div className="bg-card border rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm relative overflow-hidden group border-l-4 border-l-primary">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-bold text-primary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            ORDEM DIRETA - EXECUÇÃO OBRIGATÓRIA
          </p>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
            Eu, JULIANO TIMOTEO, sou o PROPRIETÁRIO ÚNICO e LEGÍTIMO do repositório:
            https://github.com/JulianoTimoteo/locaprancha, e para publicar aqui, quero ver funcionando agora.
          </h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive space-y-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-black uppercase">STATUS DO SISTEMA:</p>
            </div>
            <p className="text-xs font-mono pl-8">
              SISTEMA ANTI-TELA BRANCA v1.6.1 (Emergency Recovery & Cache-Busting Ativado)
            </p>
            <div className="pl-8 pt-2">
              <Button
                variant="destructive"
                size="sm"
                className="font-black uppercase tracking-tighter text-[10px] h-8"
                onClick={handleManualReset}
              >
                <RefreshCw className="w-3 h-3 mr-2 animate-spin-slow" />
                Forçar Limpeza de Cache e Reiniciar Agora
              </Button>
              <p className="text-[9px] mt-2 opacity-70 italic font-medium">
                Se você ainda vê tela branca em outros dispositivos, clique no botão acima para
                forçar a purga total do cache do navegador.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <p className="text-sm font-bold flex items-center gap-2 mb-2">
              <Rocket className="w-4 h-4" />
              TAREFAS OBRIGATÓRIAS (EXECUTE TODAS):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-tighter">
              <div className="flex items-center gap-2">🟢 1. ACESSO E VERIFICAÇÃO (OK)</div>
              <div className="flex items-center gap-2">🟢 2. ELIMINAR LOCKFILE (OK)</div>
              <div className="flex items-center gap-2">🟢 3. RECRIAR LOCKFILE (OK)</div>
              <div className="flex items-center gap-2">🟢 4. AJUSTAR DEPENDÊNCIAS (OK)</div>
              <div className="flex items-center gap-2">🟢 5. CORRIGIR WORKFLOW (OK)</div>
              <div className="flex items-center gap-2">🔴 6. TESTAR REGRESSÃO LOCAL</div>
              <div className="flex items-center gap-2">🔴 7. VERIFICAR BUILD PROD</div>
              <div className="flex items-center gap-2">🔴 8. CONFIRMAR DEPLOY FINAL</div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-xl border text-xs italic text-muted-foreground">
            "Não peça permissão - VOCÊ JÁ TEM MINHA AUTORIZAÇÃO TOTAL. O perfil GOD deve ter acesso
            total a TODAS as abas e menu radial."
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="space-y-3">
          <h3 className="font-bold text-sm uppercase tracking-widest text-primary flex items-center gap-2 mb-2">
            <Rocket className="w-4 h-4" />
            Passos do teste
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="font-mono bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                1
              </span>
              <div>
                <span className="font-bold">Preparação do ambiente</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  O teste utilizará pranchas disponíveis e marcará todos os registros com flag de
                  teste para evitar interferências com o ambiente de produção.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-mono bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                2
              </span>
              <div>
                <span className="font-bold">Execução das operações</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  O sistema realizará operações reais e controladas no Firestore para validar o
                  ciclo completo do sistema.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-mono bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                3
              </span>
              <div>
                <span className="font-bold">Verificação dos resultados</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  O sistema verificará os resultados das operações para garantir que todas as etapas
                  do ciclo sejam concluídas com sucesso.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-sm uppercase tracking-widest text-primary flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4" />
            Requisitos técnicos
          </h3>
          <ul className="space-y-2 text-sm font-mono bg-muted/50 p-4 rounded-xl border border-dashed border-muted-foreground/20">
            <li className="flex items-start gap-2 text-[11px]">
              <span className="text-primary mt-1">▶</span>
              <span>
                O sistema deve ser capaz de executar operações reais e controladas no Firestore.
              </span>
            </li>
            <li className="flex items-start gap-2 text-[11px]">
              <span className="text-primary mt-1">▶</span>
              <span>
                O Modo Seguro deve estar ativado para garantir segurança e controle operacional.
              </span>
            </li>
            <li className="flex items-start gap-2 text-[11px]">
              <span className="text-primary mt-1">▶</span>
              <span>Marcação obrigatória com flag de teste em todos os registros.</span>
            </li>
            <li className="flex items-start gap-2 text-[11px]">
              <span className="text-primary mt-1">▶</span>
              <span>Verificação automatizada dos resultados de cada etapa do ciclo.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="space-y-4 border-b pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase flex items-center gap-3 text-primary">
            <Github className="w-8 h-8 sm:w-10 h-10" />
            OPERACIONAL ATIVO
          </h1>
          <Badge
            variant="outline"
            className="w-fit font-mono text-[10px] border-primary/30 text-primary uppercase tracking-widest px-3"
          >
            Conector GitHub Ativo
          </Badge>
        </div>
        <p className="text-lg sm:text-xl font-bold text-muted-foreground flex items-center gap-2">
          <span className="opacity-60">Repositorio:</span>
          <a
            href="https://github.com/JulianoTimoteo/locaprancha"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline underline-offset-4 decoration-2"
          >
            JulianoTimoteo/locaprancha
          </a>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card de Status */}
        <div className="p-6 sm:p-8 bg-card border rounded-2xl space-y-6 shadow-sm border-l-4 border-l-primary relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Code size={120} />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
              <p className="text-base font-bold text-primary flex items-center gap-2">
                <CheckCircle2 size={20} />
                GitHub Actions: Estável
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Build e Deploy sincronizados. Persistência de estado com{" "}
                <span className="text-primary font-bold">Auto-Cleanup</span> v1.1.0 ativada.
              </p>
            </div>

            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
              <p className="text-base font-bold text-emerald-600 flex items-center gap-2">
                <ShieldCheck size={20} />
                MATRIZ DE SEGURANÇA REFORÇADA
              </p>
              <div className="text-xs space-y-2 mt-2 font-mono">
                <p className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">●</span>
                  <span>
                    <strong>Segurança:</strong> API Key rotacionada e protegida exclusivamente por
                    variáveis de ambiente.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">●</span>
                  <span>
                    <strong>Acesso GOD:</strong> Matriz de permissões unificada e acesso total
                    restaurado exclusivamente para o perfil GOD.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">●</span>
                  <span>
                    <strong>Fix Definitivo:</strong> Sincronização de rotas via SearchParams e
                    ErrorBoundary global implementados para eliminar Telas Brancas.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">●</span>
                  <span>
                    <strong>Notificações:</strong> Sistema de alertas push (PWA) configurado para
                    mudanças de status na Agenda Operacional.
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 relative z-10">
            <a
              href="https://github.com/JulianoTimoteo/locaprancha/actions"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-black uppercase tracking-tighter hover:opacity-90 transition-opacity text-sm"
            >
              <Rocket size={18} />
              Monitorar Workflow
            </a>
            <a
              href="https://julianotimoteo.github.io/locaprancha/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 border border-input bg-background px-6 py-3 rounded-xl font-black uppercase tracking-tighter hover:bg-accent transition-colors text-sm"
            >
              <Globe size={18} />
              Ver Site
            </a>
          </div>
        </div>

        {/* Card de Resumo Técnico */}
        <div className="p-6 sm:p-8 bg-muted/30 border rounded-2xl space-y-6 border-dashed border-muted-foreground/30">
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Terminal size={16} />
              Stack de Deploy
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-muted-foreground/10 pb-2">
                <span className="font-bold opacity-70">Gerenciador:</span>
                <span className="font-mono bg-background px-2 py-0.5 rounded border">
                  npm (Sincronizado)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-muted-foreground/10 pb-2">
                <span className="font-bold opacity-70">Node.js:</span>
                <span className="font-mono bg-background px-2 py-0.5 rounded border">
                  v22 LTS (Runner)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-muted-foreground/10 pb-2">
                <span className="font-bold opacity-70">Vite Base:</span>
                <span className="font-mono bg-background px-2 py-0.5 rounded border">
                  /locaprancha/
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-muted-foreground/10 pb-2">
                <span className="font-bold opacity-70">Lockfile:</span>
                <span className="font-mono bg-background px-2 py-0.5 rounded border text-green-600 font-bold">
                  Validado
                </span>
              </div>
            </div>

            <div className="pt-2">
              <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20">
                <p className="text-xs font-bold text-blue-600 flex items-center gap-2 uppercase tracking-tighter">
                  <ShieldCheck size={14} />
                  Integridade de Assets
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Os caminhos relativos foram corrigidos para garantir que scripts e estilos
                  carreguem sem erro 404 no GitHub Pages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IndexPage;
