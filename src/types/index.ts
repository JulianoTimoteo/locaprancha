export type UserRole = 'GOD' | 'ADMINISTRADOR' | 'LIDER' | 'MOTORISTA' | 'SOLICITANTE';

export interface UserProfile {
  uid: string;
  name: string;
  nickname: string;
  email: string;
  emailTipo: 'REAL' | 'FAKE';
  role: UserRole;
  perfil?: string; // Campo legado para compatibilidade com Security Rules
  access_level?: string;
  nivelAcesso?: string;
  permissions: string[];
  status: 'ATIVO' | 'BLOQUEADO' | 'INATIVO';
  criadoEm: any;
  atualizadoEm: any;
  ultimoAcesso: any | null;
}

export type StatusFrota = 'DISPONÍVEL' | 'ALOCADO' | 'OFICINA';

export interface Frota {
  id: string;
  frota: string;
  placa: string;
  marca: string;
  modelo: string;
  nome: string;
  tipo: string;
  status: StatusFrota;
  justificativaManutencao?: string;
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
  updatedBy?: string;
}

// Para compatibilidade legada enquanto migramos
export type PranchaStatus = StatusFrota;
export interface Prancha extends Frota {
  numero: string; // Mapeado de frota
}

export interface Equipamento {
  id: string;
  nome: string;
  codigo: string;
  tipo: string;
  status: 'DISPONÍVEL' | 'EM_USO' | 'MANUTENÇÃO';
  frenteId?: string;
}

export interface Frente {
  id: string;
  nome: string;
  codigo: string;
  responsavel: string;
  status: 'ATIVA' | 'INATIVA';
}

export type AgendaStatus = 'Pendente' | 'Agendado' | 'Aprovado' | 'Iniciado' | 'Em Trânsito' | 'Finalizado' | 'Concluído' | 'Recusado' | 'Cancelado';

export interface Reserva {
  id: string;
  tipoOperacao: 'SOLICITACAO' | 'LOCACAO_DIRETA';
  status: AgendaStatus;
  
  // Identidade
  usuarioId?: string | null;
  solicitanteId: string | null;
  solicitanteNome: string;
  solicitante: string;
  userId?: string | null; // Adicionado para consistência Firestore

  // Frota / Equipamento
  pranchaId: string;
  frotaId?: string | null;
  frotaNumero?: string | null;
  equipamentoId: string | null;
  equipamentoNome: string;
  
  // Logística
  data: string;
  hora: string;
  horarioRetirada: string;
  horarioDevolucaoPrevisto: string;
  
  origem: string;
  destino: string;
  frenteId: string;
  frenteTrabalho: string;
  
  // Operação
  motoristaId: string | null;
  motoristaNome: string;
  
  horarioInicioReal: any | null;
  horarioFimReal: any | null;
  iniciadoEm?: any | null;
  iniciadoPor?: string | null;
  finalizadoEm?: any | null;
  finalizadoPor?: string | null;
  
  observacao: string;
  relatorio: any | null;
  motivoRecusa: string;
  createdAt: any | null;
  testeSistema?: boolean;
}

export interface AuditLog {
  id: string;
  uid: string;
  usuario: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  timestamp: any;
  dadosAnteriores?: any;
  dadosNovos?: any;
}