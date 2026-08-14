import { Timestamp } from "firebase/firestore";

export type UserRole = "GOD" | "ADMINISTRADOR" | "LIDER" | "MOTORISTA" | "SOLICITANTE";

export interface UserProfile {
  uid: string;
  name: string;
  nickname: string;
  email: string;
  emailTipo: "REAL" | "FAKE";
  role: UserRole;
  permissions: string[];
  status: "ATIVO" | "BLOQUEADO" | "INATIVO";
  criadoEm: Timestamp | null;
  atualizadoEm: Timestamp | null;
  ultimoAcesso: Timestamp | null;
}

export type StatusFrota = "DISPONÍVEL" | "ALOCADO" | "OFICINA";

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
  createdAt?: Timestamp | null;
  createdBy?: string;
  updatedAt?: Timestamp | null;
  updatedBy?: string;
}

export type PranchaStatus = StatusFrota;
export interface Prancha extends Frota {
  numero: string;
}

export interface Equipamento {
  id: string;
  nome: string;
  codigo: string;
  tipo: string;
  status: "DISPONÍVEL" | "EM_USO" | "MANUTENÇÃO";
  frenteId?: string;
}

export interface Frente {
  id: string;
  nome: string;
  codigo: string;
  responsavel: string;
  status: "ATIVA" | "INATIVA";
}

export type AgendaStatus =
  | "Pendente"
  | "Agendado"
  | "Aprovado"
  | "Iniciado"
  | "Em Trânsito"
  | "Finalizado"
  | "Concluído"
  | "Recusado"
  | "Cancelado";

export interface Reserva {
  id: string;
  tipoOperacao: "SOLICITACAO" | "LOCACAO_DIRETA";
  status: AgendaStatus;

  usuarioId?: string | null;
  solicitanteId: string | null;
  solicitanteNome: string;
  solicitante: string;
  userId?: string | null;

  pranchaId: string;
  frotaId?: string | null;
  frotaNumero?: string | null;
  equipamentoId: string | null;
  equipamentoNome: string;

  data: string;
  hora: string;
  horarioRetirada: string;
  horarioDevolucaoPrevisto: string;

  origem: string;
  destino: string;
  frenteId: string;
  frenteTrabalho: string;

  motoristaId: string | null;
  motoristaNome: string;

  horarioInicioReal: Timestamp | null;
  horarioFimReal: Timestamp | null;
  iniciadoEm?: Timestamp | null;
  iniciadoPor?: string | null;
  finalizadoEm?: Timestamp | null;
  finalizadoPor?: string | null;

  observacao: string;
  relatorio: unknown | null;
  motivoRecusa: string;
  createdAt: Timestamp | null;
  testeSistema?: boolean;
}

export interface AuditLog {
  id: string;
  uid: string;
  usuario: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  timestamp: Timestamp | null;
  dadosAnteriores?: unknown;
  dadosNovos?: unknown;
}
