import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  where,
  getDocs,
  doc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuditLog, UserRole } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { SystemValidator, SystemTest, TestStep } from '@/lib/systemValidation';
import { useAuth } from '@/features/auth/AuthContext';
import { Play, CheckCircle2, XCircle, AlertTriangle, Info, Clock, Trash2, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function AuditoriaList() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [systemTests, setSystemTests] = useState<SystemTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<SystemTest | null>(null);
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState({ percent: 0, message: '' });
  const { profile } = useAuth();

  useEffect(() => {
    // Audit Logs
    const qLogs = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
      setLogs(data);
      setLoading(false);
    });

    // System Tests
    const qTests = query(collection(db, 'system_tests'), orderBy('iniciadoEm', 'desc'), limit(10));
    const unsubTests = onSnapshot(qTests, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemTest[];
      setSystemTests(data);
    });

    return () => {
      unsubLogs();
      unsubTests();
    };
  }, []);

  useEffect(() => {
    if (selectedTest?.testRunId) {
      const qSteps = query(
        collection(db, 'system_test_steps'), 
        where('testRunId', '==', selectedTest.testRunId),
        orderBy('ordem', 'asc')
      );
      const unsubSteps = onSnapshot(qSteps, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TestStep[];
        setTestSteps(data);
      });
      return () => unsubSteps();
    }
    return undefined;
  }, [selectedTest]);

  const handleRunTest = async () => {
    if (!profile) return;
    
    setIsTestRunning(true);
    const validator = new SystemValidator(profile.uid, profile.nickname || profile.name);
    
    try {
      await validator.runFullValidation((percent, message) => {
        setTestProgress({ percent, message });
      });
    } catch (error) {
      console.error(error);
      toast.error("Erro durante o teste.");
    } finally {
      setIsTestRunning(false);
      setTestProgress({ percent: 0, message: '' });
    }
  };

  const handleClearTest = async (testRunId: string) => {
    if (!confirm("Deseja realmente remover os registros deste teste?")) return;
    
    try {
      const batch = writeBatch(db);
      
      // Clear Steps
      const qSteps = query(collection(db, 'system_test_steps'), where('testRunId', '==', testRunId));
      const stepsSnap = await getDocs(qSteps);
      stepsSnap.docs.forEach(d => batch.delete(d.ref));
      
      // Clear Logs
      const qLogs = query(collection(db, 'audit_logs'), where('testRunId', '==', testRunId));
      const logsSnap = await getDocs(qLogs);
      logsSnap.docs.forEach(d => batch.delete(d.ref));
      
      // Clear Test Run Header
      const qTests = query(collection(db, 'system_tests'), where('testRunId', '==', testRunId));
      const testsSnap = await getDocs(qTests);
      testsSnap.docs.forEach(d => batch.delete(d.ref));
      
      await batch.commit();
      toast.success("Registros de teste removidos.");
      if (selectedTest?.testRunId === testRunId) setSelectedTest(null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao limpar registros.");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCESSO': case 'PASSOU': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'FALHA': case 'FALHOU': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'BLOQUEADO': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default: return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando auditoria...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Centro de Diagnóstico</h2>
          <p className="text-muted-foreground">Monitoramento de integridade e logs operacionais.</p>
        </div>

        {(profile?.role === 'GOD' || profile?.role === 'ADMINISTRADOR') && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 shadow-lg hover:shadow-green-500/20 transition-all">
                <Play className="w-4 h-4" />
                EXECUTAR VALIDAÇÃO COMPLETA
              </Button>
            </DialogTrigger>
            <DialogContent className="cyber-glass max-w-md">
              <DialogHeader>
                <DialogTitle>Validação Operacional</DialogTitle>
                <DialogDescription>
                  Este teste executará operações reais e controladas no Firestore para validar o ciclo completo do sistema.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm flex gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>O <strong>Modo Seguro</strong> está ativado. O teste utilizará pranchas disponíveis e marcará todos os registros com flag de teste.</p>
                </div>

                {isTestRunning && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{testProgress.message}</span>
                      <span>{testProgress.percent}%</span>
                    </div>
                    <Progress value={testProgress.percent} className="h-2" />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {}} disabled={isTestRunning}>CANCELAR</Button>
                <Button 
                  onClick={handleRunTest} 
                  disabled={isTestRunning}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isTestRunning ? "EXECUTANDO..." : "INICIAR TESTE"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="auditoria" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="auditoria">Histórico de Ações</TabsTrigger>
          <TabsTrigger value="validacao">Validação do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="auditoria">
          <Card className="cyber-glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Registros de Auditoria
              </CardTitle>
              <CardDescription>Últimas 50 operações realizadas no Locaprancha.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>ID Entidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-xs whitespace-nowrap">
                          {log.timestamp?.toDate ? format(log.timestamp.toDate(), "dd/MM/yy HH:mm:ss") : 'Agora'}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{log.usuario}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px] uppercase">{log.acao}</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-primary">{log.entidade}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{log.entidadeId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validacao">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 cyber-glass border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Execuções Recentes</CardTitle>
                <CardDescription>Histórico de baterias de testes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemTests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhuma validação executada ainda.
                  </div>
                ) : (
                  systemTests.map((test) => (
                    <div 
                      key={test.id}
                      onClick={() => setSelectedTest(test)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${selectedTest?.id === test.id ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        {getStatusIcon(test.status)}
                        <Badge variant={test.status === 'SUCESSO' ? 'default' : 'destructive'} className="text-[10px]">
                          {test.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-mono font-bold">{test.testRunId}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {test.iniciadoEm?.toDate ? format(test.iniciadoEm.toDate(), "dd/MM/yy HH:mm:ss") : ''}
                        </p>
                        <div className="flex justify-between items-center text-[10px] mt-2">
                          <span>Equipamento: {test.equipamentoTestado || 'N/A'}</span>
                          <span className="font-bold">{test.percentual?.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              {!selectedTest ? (
                <Card className="h-full flex items-center justify-center p-12 text-center cyber-glass">
                  <div className="space-y-4">
                    <Search className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-muted-foreground">Selecione uma execução ao lado para ver o relatório detalhado.</p>
                  </div>
                </Card>
              ) : (
                <>
                  <Card className="cyber-glass border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div>
                        <CardTitle className="flex items-center gap-3">
                          <span className="tracking-tighter font-black">
                            <span className="text-black dark:text-white">LOCA</span>
                            <span className="text-[#40800c]">PRANCHA</span>
                          </span>
                          <span className="text-muted-foreground/30 font-thin">|</span> 
                          VALIDAÇÃO DO SISTEMA
                          {selectedTest.status === 'SUCESSO' ? (
                            <Badge className="bg-green-500 hover:bg-green-600">✅ APROVADO</Badge>
                          ) : (
                            <Badge variant="destructive">❌ REPROVADO</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="font-mono mt-1">{selectedTest.testRunId}</CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleClearTest(selectedTest.testRunId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-muted-foreground font-bold">Total Testes</p>
                          <p className="text-2xl font-black">{selectedTest.totalEtapas}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-green-500 font-bold">Passaram</p>
                          <p className="text-2xl font-black text-green-500">{selectedTest.etapasConcluidas - selectedTest.etapasFalhas}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-red-500 font-bold">Falharam</p>
                          <p className="text-2xl font-black text-red-500">{selectedTest.etapasFalhas}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-primary font-bold">Sucesso</p>
                          <p className="text-2xl font-black text-primary">{selectedTest.percentual?.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cyber-glass">
                    <CardHeader>
                      <CardTitle className="text-base">Detalhamento das Etapas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {testSteps.map((step) => (
                        <div key={step.id} className="p-4 rounded-lg border bg-muted/20 flex flex-col md:flex-row gap-4 items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(step.status)}
                              <h4 className="font-bold text-sm uppercase tracking-wide">{step.etapa}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-3">
                              <div className="space-y-1">
                                <span className="text-muted-foreground uppercase font-bold text-[9px]">Esperado</span>
                                <p className="font-medium">{step.esperado}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-muted-foreground uppercase font-bold text-[9px]">Obtido</span>
                                <p className={`font-bold ${step.status === 'FALHOU' ? 'text-red-500' : 'text-green-500'}`}>{step.obtido}</p>
                              </div>
                            </div>
                            {step.mensagem && (
                              <p className="text-[10px] text-muted-foreground mt-2 bg-background/50 p-2 rounded italic border border-border/50">
                                {step.mensagem}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0 space-y-2">
                            <Badge variant="outline" className="text-[9px] font-mono">
                              {step.operacao}
                            </Badge>
                            <div className="flex items-center justify-end gap-1 text-[9px] text-muted-foreground font-mono">
                              <Clock className="w-3 h-3" />
                              {step.duracaoMs ? `${step.duracaoMs}ms` : '< 100ms'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
