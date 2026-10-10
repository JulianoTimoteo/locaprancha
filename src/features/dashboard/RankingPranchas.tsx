import React, { useState, useMemo } from "react";
import { Frota, Reserva } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { parseOperacaoTimestamp, formatarDuracao } from "@/lib/utils/reservaFormatting";
import { Trophy, TrendingUp, AlertTriangle, Clock, Truck, Wrench } from "lucide-react";

interface RankingPranchasProps {
  pranchas: Frota[];
  agenda: Reserva[];
}

type PeriodoFiltro = "hoje" | "7dias" | "mes" | "tudo";
type TipoRanking = "produtivas" | "improdutivas" | "oficina";

export function RankingPranchas({ pranchas, agenda }: RankingPranchasProps) {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("hoje");
  const [tipoRanking, setTipoRanking] = useState<TipoRanking>("produtivas");

  // Determina a janela de tempo com base no filtro selecionado
  const { inicioPeriodo, totalHorasPeriodo, rotuloPeriodo } = useMemo(() => {
    const agora = new Date();
    let inicio = new Date();
    let horas = 24;
    let rotulo = "Hoje";

    if (periodo === "hoje") {
      inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0);
      const horasCorridasHoje = Math.max(1, (agora.getTime() - inicio.getTime()) / (1000 * 60 * 60));
      horas = horasCorridasHoje;
      rotulo = "Hoje";
    } else if (periodo === "7dias") {
      inicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
      horas = 7 * 24;
      rotulo = "Últimos 7 dias";
    } else if (periodo === "mes") {
      inicio = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0);
      horas = Math.max(24, (agora.getTime() - inicio.getTime()) / (1000 * 60 * 60));
      rotulo = "Mês Atual";
    } else {
      // Tudo: últimos 90 dias como referência máxima
      inicio = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000);
      horas = 90 * 24;
      rotulo = "Histórico Geral";
    }

    return { inicioPeriodo: inicio, totalHorasPeriodo: horas, rotuloPeriodo: rotulo };
  }, [periodo]);

  // Calcula os indicadores para cada prancha cadastrada
  const dadosPranchas = useMemo(() => {
    const agoraMs = Date.now();
    const inicioMs = inicioPeriodo.getTime();

    return pranchas.map((prancha) => {
      const frotaNum = String(prancha.frota || "").trim();

      // Reservas associadas a esta prancha
      const reservasDaPrancha = agenda.filter((r) => {
        const rFrota = String(r.pranchaId || r.frotaId || "").trim();
        return rFrota === frotaNum || r.pranchaId === prancha.id;
      });

      // Filtra reservas no período
      const reservasNoPeriodo = reservasDaPrancha.filter((r) => {
        if (!r.data) return false;
        const dataReserva = new Date(`${r.data}T00:00:00`).getTime();
        return dataReserva >= inicioMs - 24 * 60 * 60 * 1000;
      });

      // 1. HORAS PRODUTIVAS (Viagens e Operação)
      let horasProdutivas = 0;
      let totalViagens = 0;

      reservasNoPeriodo.forEach((r) => {
        // Reservas canceladas ou recusadas não contam como produtivas
        if (r.status === "Cancelado" || r.status === "Recusado") return;

        totalViagens += 1;

        const start = parseOperacaoTimestamp(r.iniciadoEm);
        const end = parseOperacaoTimestamp(r.finalizadoEm);

        if (start && end) {
          const duracao = Math.max(0, (end - start) / (1000 * 60 * 60));
          horasProdutivas += duracao;
        } else if (start && ["Iniciado", "Em Trânsito"].includes(r.status)) {
          // Em andamento agora
          const duracaoAndamento = Math.max(0, (agoraMs - start) / (1000 * 60 * 60));
          horasProdutivas += Math.min(duracaoAndamento, totalHorasPeriodo);
        } else {
          // Fallback para agendamentos ou sem timestamp detalhado: estima 2.5h por transporte
          horasProdutivas += 2.5;
        }
      });

      // 2. HORAS EM OFICINA (Manutenção)
      let horasOficina = 0;
      const isOficinaAtual = prancha.status === "OFICINA";

      if (isOficinaAtual) {
        const entradaOficina = parseOperacaoTimestamp(prancha.oficinaEntradaEm) ||
          parseOperacaoTimestamp(prancha.updatedAt) ||
          inicioMs;

        const inicioRealOficina = Math.max(entradaOficina, inicioMs);
        const duracaoOficina = Math.max(0, (agoraMs - inicioRealOficina) / (1000 * 60 * 60));
        horasOficina += Math.min(duracaoOficina, totalHorasPeriodo);
      }

      // Evita que as horas ultrapassem o período total
      horasProdutivas = Math.min(horasProdutivas, totalHorasPeriodo);
      horasOficina = Math.min(horasOficina, totalHorasPeriodo - horasProdutivas);

      // 3. HORAS IMPRODUTIVAS (Parada aguardando locação)
      const horasImprodutivas = Math.max(0, totalHorasPeriodo - (horasProdutivas + horasOficina));

      // Percentual de ocupação/produtividade
      const taxaProdutividade = totalHorasPeriodo > 0
        ? Math.round((horasProdutivas / totalHorasPeriodo) * 100)
        : 0;

      return {
        prancha,
        frotaNum,
        horasProdutivas,
        horasImprodutivas,
        horasOficina,
        totalViagens,
        taxaProdutividade,
      };
    });
  }, [pranchas, agenda, inicioPeriodo, totalHorasPeriodo]);

  // Ordenações para os diferentes rankings
  const listaOrdenada = useMemo(() => {
    const lista = [...dadosPranchas];

    if (tipoRanking === "produtivas") {
      return lista.sort((a, b) => b.horasProdutivas - a.horasProdutivas || b.totalViagens - a.totalViagens);
    } else if (tipoRanking === "improdutivas") {
      return lista.sort((a, b) => b.horasImprodutivas - a.horasImprodutivas || a.horasProdutivas - b.horasProdutivas);
    } else {
      return lista.sort((a, b) => b.horasOficina - a.horasOficina);
    }
  }, [dadosPranchas, tipoRanking]);

  // Maior valor para a barra de proporção
  const maiorValor = useMemo(() => {
    if (tipoRanking === "produtivas") {
      return Math.max(1, ...listaOrdenada.map((item) => item.horasProdutivas));
    } else if (tipoRanking === "improdutivas") {
      return Math.max(1, ...listaOrdenada.map((item) => item.horasImprodutivas));
    } else {
      return Math.max(1, ...listaOrdenada.map((item) => item.horasOficina));
    }
  }, [listaOrdenada, tipoRanking]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DISPONÍVEL":
      case "DISPONIVEL":
        return <Badge className="bg-emerald-600 text-white font-bold text-[9px]">DISPONÍVEL 🟢</Badge>;
      case "ALOCADO":
        return <Badge className="bg-amber-600 text-white font-bold text-[9px]">EM OPERAÇÃO 🟡</Badge>;
      case "OFICINA":
        return <Badge variant="destructive" className="font-bold text-[9px]">OFICINA 🔴</Badge>;
      default:
        return <Badge variant="outline" className="font-bold text-[9px]">{status}</Badge>;
    }
  };

  const getPosicaoMedalha = (index: number) => {
    if (index === 0) return "🥇 1º";
    if (index === 1) return "🥈 2º";
    if (index === 2) return "🥉 3º";
    return `${index + 1}º`;
  };

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <CardTitle className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                Ranking de Utilização das Pranchas
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Desempenho operacional da frota no período ({rotuloPeriodo})
              </p>
            </div>
          </div>

          {/* Seletor de Período */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-primary/5 self-start sm:self-auto">
            <Button
              variant={periodo === "hoje" ? "default" : "ghost"}
              size="sm"
              className="text-xs font-bold h-7 px-2.5"
              onClick={() => setPeriodo("hoje")}
            >
              Hoje
            </Button>
            <Button
              variant={periodo === "7dias" ? "default" : "ghost"}
              size="sm"
              className="text-xs font-bold h-7 px-2.5"
              onClick={() => setPeriodo("7dias")}
            >
              7 dias
            </Button>
            <Button
              variant={periodo === "mes" ? "default" : "ghost"}
              size="sm"
              className="text-xs font-bold h-7 px-2.5"
              onClick={() => setPeriodo("mes")}
            >
              Mês
            </Button>
            <Button
              variant={periodo === "tudo" ? "default" : "ghost"}
              size="sm"
              className="text-xs font-bold h-7 px-2.5"
              onClick={() => setPeriodo("tudo")}
            >
              Geral
            </Button>
          </div>
        </div>

        {/* Abas dos Rankings */}
        <div className="pt-2">
          <Tabs value={tipoRanking} onValueChange={(val) => setTipoRanking(val as TipoRanking)}>
            <TabsList className="grid grid-cols-3 w-full max-w-lg">
              <TabsTrigger value="produtivas" className="text-xs font-bold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Mais</span> Produtivas
              </TabsTrigger>
              <TabsTrigger value="improdutivas" className="text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Mais</span> Improdutivas
              </TabsTrigger>
              <TabsTrigger value="oficina" className="text-xs font-bold flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-rose-600" />
                Paradas Oficina
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {listaOrdenada.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma prancha cadastrada para exibir o ranking.
          </div>
        ) : (
          listaOrdenada.map((item, index) => {
            const valorExibicao =
              tipoRanking === "produtivas"
                ? item.horasProdutivas
                : tipoRanking === "improdutivas"
                  ? item.horasImprodutivas
                  : item.horasOficina;

            const percentualBarra = Math.min(100, Math.round((valorExibicao / maiorValor) * 100));

            const corBarra =
              tipoRanking === "produtivas"
                ? "bg-emerald-500"
                : tipoRanking === "improdutivas"
                  ? "bg-amber-500"
                  : "bg-rose-500";

            return (
              <div
                key={item.prancha.id || item.frotaNum}
                className="p-3 rounded-lg border border-primary/10 bg-card hover:bg-muted/10 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black w-10 text-muted-foreground">
                      {getPosicaoMedalha(index)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-primary">
                          🚚 FROTA {item.frotaNum}
                        </span>
                        {getStatusBadge(item.prancha.status)}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {item.prancha.placa ? `${item.prancha.placa} — ` : ""}
                        {item.prancha.nome || item.prancha.modelo || "Prancha de Transporte"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-foreground">
                      {formatarDuracao(valorExibicao)}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {tipoRanking === "produtivas" && (
                        <span>{item.totalViagens} transporte{item.totalViagens === 1 ? "" : "s"} ({item.taxaProdutividade}% útil)</span>
                      )}
                      {tipoRanking === "improdutivas" && (
                        <span>Parada aguardando locação</span>
                      )}
                      {tipoRanking === "oficina" && (
                        <span>{item.prancha.status === "OFICINA" ? "Atualmente na oficina" : "Histórico manutenção"}</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso Visual */}
                <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${corBarra}`}
                    style={{ width: `${percentualBarra}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

