# Plano de Implementação: Cache Offline, Persistência Estilo WhatsApp e Resolução de Tela Branca

Este plano detalha as etapas para implementar a funcionalidade de cache offline, persistência de dados locais para uso sem conexão e a resolução definitiva da instabilidade que causa a "tela branca".

## 1. Correção da Estabilidade (Tela Branca)

- **Diagnóstico:** A tela branca ocorre geralmente por falhas no carregamento de módulos `lazy`, erros de contexto não capturados ou referências nulas durante a hidratação do estado inicial.
- **Ação:** Reforçar o `ErrorBoundary` global e simplificar o carregamento inicial no `App.tsx` para garantir que o estado de autenticação seja resolvido antes de qualquer renderização complexa.

## 2. Configuração de Cache Offline (PWA)

- **Estratégia:** Utilizar o `vite-plugin-pwa` com a estratégia `Stale-While-Revalidate` para assets estáticos e `Network-First` para dados operacionais.
- **Implementação:**
  - Atualizar o `vite.config.ts` para configurar o `workbox`.
  - Garantir que todos os ícones e manifestos estejam corretamente referenciados para que o navegador reconheça o app como instalável e offline-ready.

## 3. Persistência de Dados Estilo WhatsApp (Offline First)

- **Mecanismo:** Implementar uma camada de persistência local utilizando `localStorage` ou `IndexedDB` para salvar os últimos dados recebidos do Firestore.
- **Fluxo:**
  1.  Ao receber dados do Firestore (`onSnapshot`), salvar uma cópia no `localStorage`.
  2.  Ao iniciar os hooks (`useDashboardData`, `useReservas`, etc.), carregar imediatamente os dados do cache local enquanto a conexão com o Firestore é estabelecida.
  3.  Isso garante que o usuário veja os "últimos status" instantaneamente, mesmo sem internet, exatamente como o WhatsApp faz com as conversas.

## Detalhes Técnicos

- **Hooks de Sincronização:** Criar um utilitário de persistência em `src/lib/firestore/persistence.ts`.
- **Vite PWA:** Configurar `runtimeCaching` no `vite.config.ts`.
- **Auth Resilience:** Ajustar o `AuthContext.tsx` para persistir o perfil do usuário localmente, evitando bloqueios de tela por falta de rede no carregamento inicial.

---

Este conjunto de mudanças transformará o Locaprancha em uma ferramenta resiliente para uso em áreas de campo com conectividade intermitente.
