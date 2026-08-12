# Plan: User Account Menu Implementation & Profile Display Correction

This plan implements a professional account menu and fixes user profile identification issues while strictly adhering to the existing architecture, security rules, and visual theme.

## 1. Professional Account Menu
- **Integrated Component**: Created `src/components/layout/UserAccountMenu.tsx` using `DropdownMenu` and `Dialog` from shadcn/ui.
- **Visual Integration**: Follows the existing Cyber Glass theme and semantic colors.
- **Menu Items**:
    - **Meu Perfil**: Modal displaying Name, Email, Role (GOD, ADMIN, etc.), and Status (ATIVO).
    - **Alterar Senha**: Modal for secure password updates via Firebase Authentication with full validation and reauthentication support.
    - **Sair**: Logout option with a confirmation dialog, integrated with existing Firebase `signOut`.

## 2. Profile Identification & Security
- **Correction**: Updated `Layout.tsx` to use the new `UserAccountMenu`, which correctly pulls and displays the `UserProfile` data.
- **Role Display**: Ensures roles like `GOD`, `ADMINISTRADOR`, etc., are shown instead of the default "Visitante".
- **Safety**: No passwords will be stored in Firestore; all sensitive operations are handled by the Firebase Auth service.

## 3. Technical Implementation Details
- **UI Components**: Uses `@radix-ui/react-dropdown-menu` and existing shadcn components.
- **State Management**: Uses `AuthContext` to access real-time profile data from Firestore.
- **Responsiveness**: Mobile-first touch-friendly menus and centered modals for desktop/tablet.

## 4. Verification
- **Build**: `npm run build` confirmed success.
- **Manual Check**: Verify profile data loading, modal interactions, and logout flow.
- **Regressions**: Zero changes to Agenda, Fleet Management, or existing navigation logic.
