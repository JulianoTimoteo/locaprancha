# Plan: Implementação da Aba Relatórios Operacionais

Implementação de uma aba de Relatórios profissional para o sistema LOCAPRANCHA, utilizando exclusivamente dados reais do Firestore e respeitando o RBAC existente.

## User Review Required

> [!IMPORTANT]
> A aba de Relatórios será construída de forma 100% segura e somente-leitura em relação às operações. Não haverá criação de coleções paralelas ou dados mockados.

- **Filtros**: O período padrão será de `01/08/2026` a `12/08/2026` conforme solicitado, mas permitindo ajuste personalizado.
- **Exportação**: Implementaremos exportação para PDF (layout profissional) e compartilhamento via WhatsApp.

## Proposed Changes

### 1. Data Layer & Hooks

- Criar `src/features/relatorios/useRelatoriosData.ts`: Hook centralizado para buscar e filtrar dados de `agenda`, `frotas`, `usuarios` e `frentes`.
- Utilizar `subscribeToAgenda`, `subscribeToFrotas`, `subscribeToUsuarios` e `subscribeToFrentes` para garantir sincronização em tempo real.
- Implementar lógica de filtragem por período, usuário, equipamento, frente e status.
- Implementar cálculos de KPIs (Total, Finalizadas, Em andamento, Canceladas, Horas operacionais, etc).

### 2. UI Components

- Reconstruir `src/features/relatorios/RelatorioPage.tsx` com:
  - **Cabeçalho**: Título, período e botões de ação (Atualizar, PDF, WhatsApp, Excel).
  - **Barra de Filtros**: Seletores modernos para todos os parâmetros solicitados.
  - **Dashboard Executivo**: 8 cards de KPI com Glassmorphism.
  - **Listagem de Operações**: Tabela ou lista de cards com detalhes operacionais.
- Garantir responsividade total e tema "Cyber Glass" (LOCA-Black/White, PRANCHA-Green #40800c).

### 3. Navigation & RBAC

- Garantir que a aba "Relatórios" esteja corretamente mapeada no `Layout.tsx` e `App.tsx` (já existe o mapeamento, mas validaremos as permissões).

## Technical Details

- **Bibliotecas**: `lucide-react` para ícones, `date-fns` para manipulação de datas, `jspdf` + `html2canvas` para PDF, `xlsx` para Excel (opcional ou CSV).
- **Cálculo de Duração**: Diferença entre `horarioFimReal` (ou `finalizadoEm`) e `horarioInicioReal` (ou `iniciadoEm`).
- **Filtros de Data**: Comparação robusta entre campos de data (`YYYY-MM-DD`) e Timestamps do Firestore.
- **Segurança**: Respeito estrito aos perfis GOD, ADMINISTRADOR e LIDER.

## Constraints & Assumptions

- Não alteraremos a coleção `agenda`.
- Usaremos o `agendaNormalizer.ts` para garantir compatibilidade com registros antigos (ex: 31220).
- Somente leitura: Nenhuma operação de escrita (exceto logs de auditoria se necessário) será feita nesta aba.
