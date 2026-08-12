# Plan - Firestore as Sole Source of Truth for Agenda & Dashboard

Refactor the agenda data flow to ensure real-time synchronization between the "Home" (Dashboard) and "Agenda" tabs, using Firestore as the single source of truth and hardening data normalization to prevent missing records (like `userId: null`).

## User Review Required

> [!IMPORTANT]
> - The `GOD` role for `julianotimoteo` will be enforced via hardcoded check in normalization to ensure administrative access is never lost.
> - Status updates for "Iniciado" and "Finalizado" will now atomically update the Fleet (Frotas) status to "ALOCADO" and "DISPONÍVEL" respectively.

## Technical Details

### 1. Data Hardening (Firestore Normalization)
- Update `src/lib/firestore/normalizers.ts`:
    - Harden `normalizeUserRole` to explicitly recognize `julianotimoteo@usinapitangueiras.com.br` as `GOD`.
    - Harden `normalizeReserva` to handle `userId: null` and ensure `solicitanteNome` fallbacks to `solicitante` or "Solicitante" so records aren't filtered out by UI checks.
    - Map `data`, `hora`, and `horarioRetirada` consistently to avoid empty fields in cards.

### 2. Global Subscription & Filtering
- Ensure `src/features/reservas/useReservas.ts` and `src/features/dashboard/useDashboardData.ts` both use the same `subscribeToAgenda` from `src/lib/firestore/agenda.ts`.
- Remove restrictive frontend filters in `ReservaList.tsx` that might hide `userId: null` records for administrators.
- Update `useDashboardData.ts` to include "Pendente" records in "Próximos Transportes" for administrative roles.

### 3. State Machine Synchronization
- Update `updateReservaStatus` in `useReservas.ts`:
    - When status transitions to `Iniciado`, atomically update the corresponding `frotas` document to `ALOCADO`.
    - When status transitions to `Finalizado` or `Concluído`, update `frotas` to `DISPONÍVEL`.

### 4. UI Alignment
- Standardize Status Badges in `ReservaList.tsx` and `Dashboard.tsx` with the requested labels (e.g., `🟢 EM OPERAÇÃO`, `🟣 EM TRÂNSITO`).
- Update the Dashboard Card in `Dashboard.tsx` to match the "Professional Card" design (Large Frota ID, Source → Destination, Date/Time).

## Verification Plan

### Automated Checks
- `bunx tsc` to ensure no type regressions after normalization changes.
- Check build output for any syntax errors in React components.

### Manual Verification (via Playwright)
- Navigate to Dashboard and verify "PRÓXIMOS TRANSPORTES" shows record `8E2Qhyv4w550cAhDvA8b`.
- Navigate to Agenda and verify the same record is visible.
- Check that `julianotimoteo` profile correctly displays `GOD` role.
- Trigger a status change from "Aprovado" to "Iniciado" and verify (via console/logs) that the fleet status updates.
