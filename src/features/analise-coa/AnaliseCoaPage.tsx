import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnaliseCoa } from "./useAnaliseCoa";
import { useReservas } from "@/features/reservas/useReservas";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileSpreadsheet, Upload, Download } from "lucide-react";

export const AnaliseCoaPage = () => {
  const { reservas } = useReservas();
  const { stats, handleFileUpload } = useAnaliseCoa(reservas);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
            Análise COA{" "}
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">V2.0</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Módulo de Importação e Análise de Desempenho Operacional
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative overflow-hidden">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <Upload className="w-4 h-4" />
              Importar XLSX
            </Button>
            <input
              type="file"
              accept=".xlsx, .xls"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileUpload}
            />
          </div>
          <Button variant="default" className="w-full sm:w-auto gap-2">
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Viagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.totalViagens}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Km Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.totalKms.toLocaleString()} km</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Consumo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.avgConsumo.toFixed(2)} L/km</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Gráfico de Desempenho por Frota</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.records}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="frota" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                itemStyle={{ color: "#fff" }}
              />
              <Bar dataKey="kms" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
