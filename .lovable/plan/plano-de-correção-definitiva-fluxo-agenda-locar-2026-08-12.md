# Plano de Correção Definitiva — Fluxo Agenda × Locar

O objetivo é unificar o fluxo de dados via Firestore, implementar o botão **LOCAR** real com modal dedicado e garantir que todos os registros apareçam na agenda com a ordenação operacional correta.

## Alterações Técnicas

### 1. Types & Normalizers

- Revisar `normalizeReserva` em `src/lib/firestore/normalizers.ts` para garantir fallbacks agressivos (userId null, campos faltantes).
- Garantir que `tipoOperacao` seja suportado.

### 2. Hook de Reservas (`src/features/reservas/useReservas.ts`)

- Implementar `alocarDireto` usando `runTransaction` (obrigatório conforme item 11/12).
- Fluxo da transação: Ler prancha -> Validar status DISPONÍVEL -> Criar agenda (Iniciado) -> Atualizar frota (Alocado) -> Registrar auditoria.
- Garantir que `updateReservaStatus` para "Finalizado" também atualize a frota para "DISPONÍVEL" de forma atômica.

### 3. Interface da Agenda (`src/features/reservas/ReservaList.tsx`)

- Adicionar o botão **🚜 LOCAR** no topo, visível apenas para GOD, ADMIN e LIDER.
- Implementar estado local `locarModalOpen` (React state, sem variáveis globais).
- Criar a visualização de cards diferenciada para `tipoOperacao === 'LOCACAO_DIRETA'`.
- Ajustar a mensagem de "Nenhum transporte" para garantir que só apareça se o array estiver realmente vazio.
- Implementar a ordenação operacional: Iniciado -> Agendado/Pendente/Aprovado -> Finalizado/Cancelado/Recusado.

### 4. Formulário de Locação (`src/features/reservas/ReservaForm.tsx`)

- Adaptar para o modo "Locação Direta":
  - Filtrar pranchas estritamente pelo status `DISPONÍVEL`.
  - Campos: Seleção de prancha, Frente, Origem, Destino, Observações.
  - Omitir campos de data/hora futura (usa `serverTimestamp`).

### 5. Dashboard (`src/features/dashboard/Dashboard.tsx`)

- Unificar a visualização de cards com a da Agenda.
- Garantir que o clique em "ABRIR AGENDA" dispare a navegação correta.

### 6. Sistema de Validação (`src/features/auditoria/AuditoriaList.tsx`)

- Readequar o sistema de testes automáticos para refletir o novo fluxo atômico e gerar o relatório visual solicitado no item 26.

## Checklist de Validação

- [ ] Botão LOCAR visível para perfis autorizados.
- [ ] Alocação via transação (atômica).
- [ ] Sincronização em tempo real entre Agenda e Dashboard.
- [ ] Documentos com `userId: null` aparecem na lista.
- [ ] Teste de concorrência (tentar locar prancha ocupada).
