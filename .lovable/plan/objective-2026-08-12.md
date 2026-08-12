---
title: LOCAPRANCHA — Mobile-First Operation & GOD Access
---

## Objective
Rebuild the interface as a mobile-first operational application while ensuring the user's `GOD` status is correctly mapped to the Firestore schema (`access_level` and `nivelAcesso`).

## Technical Details

### UI/UX Refactor (Mobile-First)
- **Dashboard**: Redesigned with a 2-column mobile grid, semantic status icons (🟢🟡🔴), and improved Recharts responsiveness.
- **Agenda (Reservas)**: Implemented Card-based view for mobile with quick action buttons (Aprovar, Iniciar, Concluir) and a Floating Action Button (FAB) for new requests.
- **Frota (Pranchas)**: Standardized naming and added semantic iconography.
- **Layout**: Simplified menu labels and improved touch targets. Added bottom navigation safe areas.

### Data & Authorization
- **GOD Mapping**: Updated `normalizeUserProfile` to support the user's Firestore fields:
  - `access_level` -> "GOD"
  - `nivelAcesso` -> "GOD"
  - `fullName` -> Display name
- **Normalizers**: Enhanced `normalizeReserva` to handle legacy fields like `userId`, `frenteTrabalho`, and `hora`.
- **RBAC**: Unified permission checks in `permissions.ts` to ensure all 12 modules are visible to the `GOD` role.

### Operational Features
- **Firebase Sync**: Switched to a robust `onSnapshot` listener in all operational hooks.
- **Security Hardening**: Enforced strict typing and error boundaries across all modules.

## Validation Plan
1. Test responsive breakpoints: 360px (Mobile) to 1920px (Desktop).
2. Verify all menu items appear for `julianotimoteo@usinapitangueiras.com.br`.
3. Test the "Solicitar Reserva" flow on mobile layout.
