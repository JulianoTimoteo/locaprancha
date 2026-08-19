# Plano de Integração Total ao Firebase (Locaprancha)

Este plano detalha a transição completa para o Firebase (Auth + Firestore) como única fonte da verdade, eliminando dados mockados e integrando coleções reais em tempo real.

## 1. Autenticação (Auth + Nickname)

- [ ] **Ajustar LoginPage.tsx**:
  - Implementar a resolução de nickname: se o input não for e-mail, buscar na coleção `usuarios` o e-mail associado ao nickname antes de chamar `signInWithEmailAndPassword`.
  - Integrar `sendPasswordResetEmail` com suporte a nickname.
- [ ] **Ajustar AuthContext.tsx**:
  - Garantir que o `profile` seja carregado via `onSnapshot` (tempo real) em vez de um `getDoc` único, para refletir mudanças de permissão ou status instantaneamente.

## 2. Padronização das Coleções e Hooks

- [ ] **Mapeamento de Frota (`frotas`)**:
  - Unificar `src/features/frota/useFleet.ts` para usar a coleção `frotas` (Firestore real) em vez de `pranchas` (local/anterior).
  - Normalizar os campos detectados: `numero`, `status`/`situacao`, `frenteId`.
- [ ] **Mapeamento de Agenda (`agenda`)**:
  - Ajustar `src/features/reservas/useReservas.ts` para ler da coleção `agenda` real.
  - Campos: `data` (string), `hora`, `origem`, `destino`, `status`, `userId`.
- [ ] **Audit Logs (`audit_logs`)**:
  - Garantir que `logAction` e os hooks de leitura usem o nome exato da coleção no Firestore.
- [ ] **Hooks Unificados**:
  - Migrar todos os hooks para utilizarem os serviços em `src/lib/firestore/` que já implementam `onSnapshot`.

## 3. Interface e Visualização Real

- [ ] **Dashboard**:
  - Refinar `useDashboardData.ts` para garantir que o cálculo de KPIs (disponíveis, alocadas, oficina) utilize o mapeamento correto dos documentos reais da coleção `frotas`.
- [ ] **Listas de Dados**:
  - Atualizar as views de `ReservaList`, `PranchaList` e `UsuarioList` para exibir os campos reais do banco.
  - Implementar Skeletons durante o carregamento inicial (`loading` state).

## Detalhes Técnicos

- **Segurança**: Remocão de qualquer lógica de "auto-criação" de perfil no login que utilize dados mockados. O perfil deve existir previamente no Firestore ou ser criado seguindo o schema oficial.
- **Listeners**: Garantir que todos os `onSnapshot` possuam o `unsubscribe` no retorno do `useEffect`.
- **Filtros e Ordenação**: Implementar ordenação por `data + hora` na agenda diretamente no query do Firestore (ou via JS se necessário para campos compostos).
