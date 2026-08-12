# Plan: Total Reconstruction of Locaprancha for GitHub Pages

Rebuilding the application from scratch to be a 100% client-side static application hosted on GitHub Pages, using Firebase for data and auth, with zero backend/server-side dependencies.

## 1. Environment & Infrastructure
- [ ] Reset `vite.config.ts` to standard Vite + React + TypeScript with `base: './'`.
- [ ] Configure `.github/workflows/deploy.yml` for modern GitHub Pages deployment.
- [ ] Create `public/.nojekyll`.
- [ ] Set up `.env.example` with Firebase Web SDK variables.

## 2. Dependencies
- [ ] Remove all `@tanstack/react-start`, `@tanstack/react-router`, and Lovable-specific server packages.
- [ ] Install/Ensure: `firebase`, `lucide-react`, `recharts`, `date-fns`, `react-hook-form`, `zod`, `sonner`, `html2canvas`, `jspdf`, `xlsx`, `clsx`, `tailwind-merge`.

## 3. Core Architecture
- [ ] **Navigation**: Implement a state-based router in `src/App.tsx` (using `useState` for `currentView`).
- [ ] **Firebase Lib**: Initialize Firebase Web SDK in `src/lib/firebase.ts` with provided credentials.
- [ ] **Auth Layer**: Implement `useAuth` hook and `AuthContext` to manage Firebase Authentication sessions.
- [ ] **Real-time Sync**: Use `onSnapshot` for Firestore data synchronization.

## 4. Operational Modules (Features)
- [ ] **Login/Security**: Full authentication flow + password recovery.
- [ ] **Dashboard**: Operational KPIs and summary charts.
- [ ] **Fleet Management**: CRUD for Pranchas (Disponível, Alocada, Oficina) and Equipments.
- [ ] **Frentes**: Management of work fronts.
- [ ] **Reservations**: Smart scheduling with conflict detection (no overlapping periods for the same prancha).
- [ ] **Users & Roles**: Role-based access control (GOD, ADMIN, LIDER, MOTORISTA, SOLICITANTE).
- [ ] **Audit Logs**: Automatic logging of critical actions.
- [ ] **Notifications**: Real-time alerts system.

## 5. Reports & Sharing
- [ ] **Reports Page**: Filtering and data visualization.
- [ ] **WhatsApp Export**: Formatted plain text summaries.
- [ ] **PDF/Capture**: Using `html2canvas` and `jsPDF` for visual reports.

## 6. UI/UX
- [ ] **Theme**: Dark/Light mode toggle with persistence.
- [ ] **Responsiveness**: Mobile-first layouts for all screens.
- [ ] **Feedback**: Skeletons, loading states, and friendly error messages.

## Technical Details
- **Routing**: `const [view, setView] = useState('dashboard')` in main component.
- **Persistence**: Auth via Firebase SDK, Theme via LocalStorage.
- **Rules**: Firestore Security Rules will be drafted in `firestore.rules`.
