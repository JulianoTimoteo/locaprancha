# Plano de Correção: Agenda + Home Firestore

Este plano visa consolidar a coleção `agenda` do Firestore como a única fonte de verdade para toda a aplicação, garantindo que registros reais (mesmo legados ou incompletos) sejam exibidos e processados corretamente em tempo real, respeitando rigorosamente o RBAC e o reconhecimento do perfil GOD.

## Auditoria Realizada

- Identificado que o `subscribeToAgenda` já é universal, mas os filtros na Home e na Agenda estão omitindo registros válidos (como os com `userId: null`).
- O perfil GOD está sendo normalizado, mas precisamos garantir que o `normalizeUserProfile` seja infalível para o usuário `julianotimoteo`.
- A Home está usando uma lógica de filtragem que exclui registros passados ou concluídos de forma que impede a visão administrativa total.

## Alterações Propostas

### 1. Núcleo de Dados (Firestore & Normalizadores)

- **`src/lib/firestore/normalizers.ts`**:
  - Ajustar `normalizeUserProfile` para garantir que o role `GOD` seja atribuído prioritariamente.
  - Ajustar `normalizeReserva` para garantir que `userId: null` não cause exclusões e que campos como `data`, `hora`, `origem`, `destino` tenham fallbacks robustos.
- **`src/lib/firestore/agenda.ts`**:
  - Garantir que a assinatura não tenha filtros de consulta (`where`), permitindo que a aplicação decida o que mostrar com base no perfil.

### 2. Fluxo Operacional (Hooks & Lógica)

- **`src/features/reservas/useReservas.ts`**:
  - Padronizar os nomes de campos ao salvar (`data`, `hora`, `origem`, `destino`, `status`, `solicitante`).
  - Sincronizar atomicamente o status da frota (`frotas`) com a agenda (Iniciado -> ALOCADA, Finalizado -> DISPONÍVEL).
- **`src/features/dashboard/useDashboardData.ts`**:
  - Refatorar a filtragem de `proximosTransportes` para seguir as regras de visibilidade por perfil (GOD/ADMIN vêm tudo, SOLICITANTE vêm as suas).

### 3. Interface de Usuário (UI)

- **`src/features/reservas/ReservaList.tsx`**:
  - Corrigir os badges de status para usar as cores e emojis solicitados (🟡 Pendente, 🔵 Aprovado, 🟢 Iniciado, etc).
  - Garantir que a lista mostre registros com `userId: null` para perfis administrativos.
- **`src/features/dashboard/Dashboard.tsx`**:
  - Atualizar o card de "Próximos Transportes" para o formato profissional solicitado, priorizando o número da FROTA.

## Verificação e Testes

- Validar se o registro `8E2Qhyv4w550cAhDvA8b` aparece para o GOD.
- Testar a criação de uma nova agenda e observar a atualização em tempo real sem F5.
- Verificar se a frota muda de status automaticamente ao iniciar/finalizar um serviço.
