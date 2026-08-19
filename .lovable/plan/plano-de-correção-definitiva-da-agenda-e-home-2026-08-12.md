# Plano de Correção Definitiva da Agenda e Home

Este plano visa unificar o consumo de dados da Agenda e do Dashboard utilizando o Cloud Firestore como única fonte de verdade em tempo real.

## Problemas Identificados

- Descompasso entre Home e Agenda na visualização de documentos.
- Documentos com `userId: null` desaparecendo ou sendo filtrados incorretamente.
- Falta de um estado global ou subscrição única compartilhada.
- Home com lógica de filtragem que pode diferir da Agenda.

## Alterações Propostas

### 1. Camada de Dados (Firestore)

- **`src/lib/firestore/agenda.ts`**: Refinar a subscrição `onSnapshot` para garantir que seja totalmente aberta (sem filtros de query) e que a normalização trate corretamente campos ausentes (`userId: null`).
- **`src/lib/firestore/normalizers.ts`**: Ajustar `normalizeReserva` para ser extremamente defensivo, garantindo que `solicitante`, `equipamentoNome` e outros campos tenham fallbacks descritivos ("Não informado", "Aguardando definição", etc.).

### 2. Hooks e Estado

- **`src/features/reservas/useReservas.ts`**: Implementar estado de carregamento (`loading`) preciso. Garantir que a lista de reservas seja exposta sem filtros restritivos de permissão no nível do hook, deixando a filtragem de visibilidade para o componente UI.
- **`src/features/dashboard/useDashboardData.ts`**: Garantir que o Dashboard consuma os dados da exata mesma subscrição da Agenda, filtrando apenas para os próximos transportes relevantes.

### 3. Interface do Usuário (UI)

- **`src/features/reservas/ReservaList.tsx`**:
  - Adicionar indicador de carregamento profissional.
  - Corrigir a filtragem de visualização para que papéis administrativos (`GOD`, `ADMIN`, `LIDER`) vejam absolutamente tudo, inclusive registros com `userId: null`.
  - Garantir que "Nenhum transporte agendado" só apareça após o carregamento inicial e se realmente não houver registros visíveis.
  - Implementar a busca case-insensitive em todos os campos relevantes.
- **`src/features/dashboard/Dashboard.tsx`**:
  - Sincronizar visualmente com a Agenda.
  - Adicionar o atalho "Ver Agenda" no card de próximos transportes.
  - Garantir ordenação cronológica rigorosa (Data + Hora).

## Detalhes Técnicos

- Utilização de `onSnapshot` para tempo real (sem F5).
- Ordenação no frontend para máxima flexibilidade.
- Preservação total do design "Cyber Glass" e Usina Pitangueiras.
- Validação com os documentos reais citados (`8E2Qhyv4w550cAhDvA8b` e `r1uuLWQQ6MbIZwWV93MN`).

## Critérios de Aceite

- Documento `8E2Qhyv4w550cAhDvA8b` visível na Agenda e no Home.
- Mudanças no Firestore refletidas instantaneamente em ambas as abas.
- Navegação fluida entre Home e Agenda através de atalhos.
- Nenhuma regressão visual ou funcional.
