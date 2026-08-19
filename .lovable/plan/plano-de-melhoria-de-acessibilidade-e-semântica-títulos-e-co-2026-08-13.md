# Plano de Melhoria de Acessibilidade e Semântica (Títulos e Controles)

Este plano visa corrigir as falhas de acessibilidade identificadas, garantindo que todas as páginas possuam um título principal (H1) único, hierarquia lógica de títulos (H2 para seções) e que todos os controles interativos possuam nomes acessíveis.

## Alterações Propostas

### 1. Ajuste de Hierarquia de Títulos (H1 e H2)

- **Dashboard (`Dashboard.tsx`):**
  - Remover `sr-only` do H1 ou ajustá-lo para ser o título visível da página.
  - Alterar títulos de cards (`CardTitle`) e seções para H2 onde apropriado para manter a hierarquia.
- **Gestão de Frota (`FrotaList.tsx`):**
  - Verificar o H1 "Gestão de Frota".
  - Alterar o H3 "Frota de Pranchas" para H2.
- **Agenda Operacional (`ReservaList.tsx`):**
  - Confirmar H1 "Agenda Operacional".
  - Adicionar H2 para divisões lógicas (ex: Filtros, Lista).
- **Relatórios (`RelatorioPage.tsx`):**
  - Garantir H1 "Relatórios Operacionais".
  - Usar H2 para seções como "Filtros", "KPIs" e "Histórico".
- **Usuários, Equipamentos e Frentes:**
  - Garantir que os títulos principais sejam H1.
  - Seções internas (como legendas ou filtros) devem usar H2.

### 2. Nomes Acessíveis para Controles Interativos

- **Campos de Busca (`Input`):**
  - Adicionar `aria-label` descritivo a todos os campos de busca em todas as páginas (ex: `aria-label="Buscar frota, placa ou equipamento"`).
- **Filtros de Status (`FrotaFilters.tsx`):**
  - Adicionar `aria-label` aos botões de filtro (ex: `aria-label="Filtrar por status: Disponível"`).
- **Botões de Ação em Tabelas/Cards:**
  - Garantir que botões de ícone (Editar, Excluir, Oficina) tenham `aria-label` ou `sr-only` text (ex: `aria-label="Editar equipamento 123"`).
- **Componentes de UI (`RadialMenu.tsx`, `UserAccountMenu.tsx`):**
  - Melhorar `aria-label` nos gatilhos de menu.
  - Adicionar `aria-label` aos itens do menu radial.

## Detalhes Técnicos

- **Arquivos afetados:**
  - `src/features/dashboard/Dashboard.tsx`
  - `src/features/frota/FrotaList.tsx`
  - `src/features/frota/FrotaFilters.tsx`
  - `src/features/reservas/ReservaList.tsx`
  - `src/features/relatorios/RelatorioPage.tsx`
  - `src/features/usuarios/UsuarioList.tsx`
  - `src/features/equipamentos/EquipamentoList.tsx`
  - `src/features/frentes/FrenteList.tsx`
  - `src/components/layout/RadialMenu.tsx`
  - `src/components/layout/UserAccountMenu.tsx`
  - `src/features/auditoria/AuditoriaList.tsx`

- **Abordagem:** Substituições pontuais para adicionar atributos `aria-label` e ajustar tags HTML de `H1-H6`.

## Verificação

- Auditoria visual do código para garantir a hierarquia `H1 > H2`.
- Verificação via console do navegador (inspeção de acessibilidade) para confirmar `aria-label` em campos de entrada e botões de ícone.
