# Plan - Implement Operational Flow and Fix Fleet Management

Implement the full operational flow for service requests (approval, execution, completion) using Firestore as the single source of truth and real-time synchronization. Additionally, fix the fleet management module which is currently not displaying data correctly.

## User Review Required

> [!IMPORTANT]
> The current system will transition to a strict Firestore-first model. Ensure Firestore collections `reservas` (or `agenda`), `equipamentos`, `frotas`, and `auditoria` are correctly set up in the Firebase console.

- **Data Consistency**: Service transitions (Approval -> In Progress -> Closed) will be managed via Firestore transactions/batches.
- **Fleet Fix**: I will unify the fleet management to use the `frotas` collection consistently across all components.

## Proposed Changes

### 1. Data Layer (Firestore & Hooks)

- Refactor `useFleet.ts` to use the `frotas` collection (matching `PranchaList.tsx` expectations) instead of `fleet`.
- Implement atomic operations for service state transitions (e.g., updating both `reserva` status and `equipamento` status).
- Update `useReservas.ts` to include "Iniciar" and "Encerrar" service logic.

### 2. Operational Flow (UI)

- **Agenda/Reservas**: Add action buttons to service cards: "ACEITAR", "RECUSAR" (Admins), "INICIAR", "ENCERRAR" (Admins/Motoristas).
- **Service Report**: Implement a modal form for closing services, capturing end time and observations.
- **Workshop Flow**: Add workshop management to equipment cards.

### 3. Real-time Synchronization

- Ensure `onSnapshot()` is used for all operational collections.
- Implement real-time counts for the Dashboard KPIs.

### 4. Technical Hardening

- Update `firestore.rules` (as reference for the user) to enforce state machine transitions.
- Implement unified normalization for all entities to prevent runtime errors from inconsistent data.

## Technical Details

- **Atomic Updates**: Using `writeBatch` to ensure `reserva.status` and `equipamento.status` are updated together.
- **Normalization**: Centralizing all Firestore reads through `src/lib/firestore/normalizers.ts`.
- **RBAC**: Enforcing access control in the UI using the existing `permissions.ts` logic.
