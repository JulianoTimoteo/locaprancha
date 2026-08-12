import React, { useRef, useState } from 'react';
import { useRelatoriosData } from './useRelatoriosData';
import { useAuth } from '@/features/auth/AuthContext';
import { isAdmin, isGod, hasPermission } from '@/lib/permissions/permissions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  FileDown, 
  MessageSquare, 
  RefreshCw, 
  X, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Timer,
  Users,
  Truck,
  MapPin,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';


const STATUS_LIST = [
  'Todos',
  'Pendente',
  'Agendado',
  'Aprovado',
  'Iniciado',
  'Em Trânsito',
  'Finalizado',
  'Concluído',
  'Recusado',
  'Cancelado'
];

export function RelatorioPage() {
  const { profile } = useAuth();
  const [filters, setFilters] = useState({
    dataInicio: '2026-08-01',
    dataFim: '2026-08-12',
    usuarioId: 'Todos',
    pranchaId: 'Todos',
    frenteId: 'Todas',
    status: 'Todos'
  });

  const { filteredData, kpis, loading, frotas, usuarios, frentes } = useRelatoriosData(filters);
  const reportRef = useRef<HTMLDivElement>(null);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    const toastId = toast.loading('Gerando PDF profissional...');
    try {
      // Ajustar escala para melhor qualidade
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`relatorio-operacional-${filters.dataInicio}-a-${filters.dataFim}.pdf`);
      toast.success('Relatório PDF exportado com sucesso!', { id: toastId });
    } catch (e) {
      toast.error('Erro ao gerar PDF', { id: toastId });
    }
  };

  const shareWhatsApp = () => {
    let text = `🚜 *LOCAPRANCHA — RELATÓRIO OPERACIONAL*\n`;
    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `📅 Período: ${filters.dataInicio} a ${filters.dataFim}\n`;
    text += `📊 Total Operações: ${kpis.total}\n`;
    text += `✅ Finalizadas: ${kpis.finalizadas} (${kpis.finalizadasPercent}%)\n`;
    text += `⏱️ Horas Operacionais: ${kpis.totalHoras}h\n`;
    text += `━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (filteredData.length > 0) {
      text += `*ÚLTIMAS ATIVIDADES:*\n`;
      filteredData.slice(0, 5).forEach(r => {
        text += `• ${r.pranchaId} ➝ ${r.frenteId} (${r.status})\n`;
      });
      if (filteredData.length > 5) text += `_... e mais ${filteredData.length - 5} registros._\n`;
    }
    
    text += `\n🔗 Gerado em: ${new Date().toLocaleString('pt-BR')}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const clearFilters = () => {
    setFilters({
      dataInicio: '2026-08-01',
      dataFim: '2026-08-12',
      usuarioId: 'Todos',
      pranchaId: 'Todos',
      frenteId: 'Todas',
      status: 'Todos'
    });
    toast.info('Filtros limpos');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <RefreshCw className="animate-spin text-primary" size={48} />
        <p className="font-bold animate-pulse">Carregando dados operacionais...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-primary/10 shadow-sm glass">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <BarChart size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Relatórios Operacionais</h1>
            <p className="text-sm text-muted-foreground font-medium">Histórico, desempenho e prestação de contas das operações.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end lg:self-center">
          <div className="flex items-center gap-2 bg-background/50 p-1 rounded-lg border">
            <Input 
              type="date" 
              className="w-40 border-none bg-transparent h-9 text-xs font-bold"
              value={filters.dataInicio}
              onChange={(e) => setFilters({...filters, dataInicio: e.target.value})}
            />
            <span className="text-muted-foreground">→</span>
            <Input 
              type="date" 
              className="w-40 border-none bg-transparent h-9 text-xs font-bold"
              value={filters.dataFim}
              onChange={(e) => setFilters({...filters, dataFim: e.target.value})}
            />
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => toast.success('Dados atualizados')}>
            <RefreshCw size={18} />
          </Button>
        </div>
      </div>

      {/* Toolbar / Buttons */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
           <Button variant="outline" className="gap-2 font-bold h-11" onClick={clearFilters}>
             <X size={16} /> Limpar Filtros
           </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2 font-bold h-11 bg-green-500/5 text-green-600 border-green-500/20 hover:bg-green-500/10" onClick={shareWhatsApp}>
            <MessageSquare size={18} /> WhatsApp
          </Button>
          <Button className="gap-2 font-bold h-11 cyber-nav-btn-active shadow-lg" onClick={exportPDF}>
            <FileDown size={18} /> Gerar PDF
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="border-primary/10 glass overflow-visible">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Usuário</label>
              <Select value={filters.usuarioId} onValueChange={(val) => setFilters({...filters, usuarioId: val})}>
                <SelectTrigger className="h-11 font-bold">
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os usuários</SelectItem>
                  {usuarios.map(u => (
                    <SelectItem key={u.uid} value={u.uid}>{u.nickname || u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Frota (Prancha)</label>
              <Select value={filters.pranchaId} onValueChange={(val) => setFilters({...filters, pranchaId: val})}>
                <SelectTrigger className="h-11 font-bold">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os equipamentos</SelectItem>
                  {frotas.map(f => (
                    <SelectItem key={f.id} value={f.frota}>{f.frota} - {f.placa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Frente de Trabalho</label>
              <Select value={filters.frenteId} onValueChange={(val) => setFilters({...filters, frenteId: val})}>
                <SelectTrigger className="h-11 font-bold">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas as frentes</SelectItem>
                  {frentes.map(f => (
                    <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status</label>
              <Select value={filters.status} onValueChange={(val) => setFilters({...filters, status: val})}>
                <SelectTrigger className="h-11 font-bold">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_LIST.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <KPICard title="Total de Operações" value={kpis.total} icon={TrendingUp} color="blue" />
        <KPICard title="Finalizadas" value={kpis.finalizadas} subtext={`${kpis.finalizadasPercent}% do total`} icon={CheckCircle2} color="green" />
        <KPICard title="Em Andamento" value={kpis.emAndamento} icon={Clock} color="orange" />
        <KPICard title="Canceladas" value={kpis.canceladas} subtext={`${kpis.canceladasPercent}% do total`} icon={AlertCircle} color="red" />
        <KPICard title="Horas Operacionais" value={`${kpis.totalHoras}h`} icon={Timer} color="emerald" />
        <KPICard title="Usuários Envolvidos" value={kpis.usuariosDistintos} icon={Users} color="indigo" />
        <KPICard title="Frotas Utilizadas" value={kpis.equipamentosDistintos} icon={Truck} color="amber" />
        <KPICard title="Frentes Atendidas" value={kpis.frentesDistintas} icon={MapPin} color="cyan" />
      </div>

      {/* Printable Report Content */}
      <Card className="border-primary/10 glass overflow-hidden shadow-xl" ref={reportRef}>
        <div className="p-8 space-y-8 bg-card">
          {/* Internal Report Header */}
          <div className="flex justify-between items-start border-b border-primary/10 pb-6">
            <div className="flex items-center gap-4">
              <img 
                src="https://usinapitangueiras.com.br/wp-content/uploads/2020/04/usina-pitangueiras-logo.png" 
                alt="Logo" 
                className="w-16 h-16 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-3xl font-black tracking-tighter">
                  <span className="text-black dark:text-white">LOCA</span>
                  <span className="text-[#40800c]">PRANCHA</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Relatório Operacional • Enterprise</span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <Badge variant="outline" className="font-bold border-primary/20 text-primary">DOCUMENTO OFICIAL</Badge>
              <p className="text-xs font-bold text-muted-foreground mt-2">Emissão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
              <p className="text-xs font-bold text-muted-foreground">Período: {filters.dataInicio} a {filters.dataFim}</p>
            </div>
          </div>

          {/* List Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <Calendar size={20} className="text-primary" /> Histórico Operacional
              </h3>
              <span className="text-xs font-bold text-muted-foreground">{filteredData.length} registros encontrados</span>
            </div>

            <div className="rounded-xl border border-primary/5 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-primary/5 border-b border-primary/10">
                    <th className="p-4 font-black uppercase tracking-wider">Data/Hora</th>
                    <th className="p-4 font-black uppercase tracking-wider">Frota</th>
                    <th className="p-4 font-black uppercase tracking-wider">Frente / Destino</th>
                    
                    <th className="p-4 font-black uppercase tracking-wider">Solicitante</th>
                    <th className="p-4 font-black uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center italic text-muted-foreground font-medium">Nenhum registro encontrado para os filtros selecionados.</td>
                    </tr>
                  ) : (
                    filteredData.map((res, i) => (
                      <tr key={res.id} className={cn("hover:bg-primary/5 transition-colors", i % 2 === 0 ? "bg-transparent" : "bg-muted/5")}>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold">{res.data}</span>
                            <span className="text-[10px] text-muted-foreground">{res.hora || res.horarioRetirada}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className="font-black bg-primary/10 text-primary border-none shadow-none">{res.pranchaId}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold">{res.frenteId}</span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{res.destino}</span>
                          </div>
                        </td>
                        
                        <td className="p-4 font-medium">{res.solicitanteNome}</td>
                        <td className="p-4 text-right">
                          <StatusBadge status={res.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-primary/10 flex justify-between items-center opacity-50">
            <span className="text-[10px] font-bold uppercase tracking-widest">Usina Pitangueiras • Gestão de Transportes</span>
            <span className="text-[10px] font-bold">Página 1 de 1</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function KPICard({ title, value, subtext, icon: Icon, color }: any) {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    green: "text-green-600 bg-green-500/10 border-green-500/20",
    orange: "text-orange-600 bg-orange-500/10 border-orange-500/20",
    red: "text-red-600 bg-red-500/10 border-red-500/20",
    emerald: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    indigo: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20",
    amber: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    cyan: "text-cyan-600 bg-cyan-500/10 border-cyan-500/20",
  };

  return (
    <Card className="border-primary/10 glass overflow-hidden group hover:border-primary/30 transition-all duration-300 shadow-sm">
      <CardContent className="p-5 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black tracking-tighter">{value}</h2>
          </div>
          {subtext && <p className="text-[10px] font-bold text-muted-foreground/60">{subtext}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", colorMap[color])}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    'Pendente': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    'Agendado': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'Aprovado': 'bg-sky-500/10 text-sky-600 border-sky-500/20',
    'Iniciado': 'bg-green-500/10 text-green-600 border-green-500/20',
    'Em Trânsito': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    'Finalizado': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    'Concluído': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    'Recusado': 'bg-red-500/10 text-red-600 border-red-500/20',
    'Cancelado': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };

  return (
    <Badge variant="outline" className={cn("font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 border-none", configs[status] || "bg-muted text-muted-foreground")}>
      {status}
    </Badge>
  );
}
