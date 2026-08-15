# Plano de Reconstrução, Segurança e Deploy Definitivo — LOCAPRANCHA

Este plano estabelece a estratégia para transformar o projeto atual em uma aplicação robusta, segura e compatível com hospedagem estática no GitHub Pages, utilizando Firebase como backend server-authoritative.

## 1. Auditoria e Limpeza Arquitetural

- Remover qualquer resquício de TanStack Start ou SSR que exija runtime Node.js.
- Consolidar a navegação baseada em estado React no `App.tsx` para evitar erros 404 em caminhos virtuais.
- Configurar o `vite.config.ts` com `base: "/locaprancha/"` para compatibilidade total com o GitHub Pages.

## 2. Endurecimento Crítico de Segurança (Zero Trust)

- **Firestore Rules**: Implementar autoridade total no servidor. Nenhuma escrita será permitida sem validação de UID, role e status da conta (`ATIVO`).
- **Proteção de Identidade**: Garantir que `solicitanteId` seja sempre igual ao `request.auth.uid` do remetente.
- **Imutabilidade de Auditoria**: Bloquear qualquer alteração ou exclusão na coleção `audit_logs`.
- **Prevenção de Fraude**: Impedir a criação de reservas pré-aprovadas por usuários comuns através de regras de campo (`affectedKeys`).

## 3. Fluxos Operacionais e Integridade de Dados

- **Transações Atômicas**: Utilizar `runTransaction` para operações que envolvem mudança de status de frota e criação de agenda simultaneamente.
- **Normalização**: Unificar referências de frota (Frota vs Prancha) nos normalizadores para evitar inconsistências em buscas.
- **Senhas Seguras**: Garantir que o sistema nunca utilize senhas padrão, forçando o fluxo de Auth seguro.

## 4. Pipeline de Deploy (CI/CD)

- Criar `.github/workflows/deploy.yml` para automação total: Lint -> Typecheck -> Test -> Build -> Deploy.
- Validar a integridade do diretório `dist` antes de cada publicação.

## Detalhes Técnicos

- **Stack**: React 19 + Vite 8 + TypeScript + Tailwind v4.
- **Hospedagem**: GitHub Pages (Client-side Routing via State).
- **Backend**: Firebase Web SDK (Zero Backend/SSR).
- **Identidade**: Firebase Auth + Firestore RBAC (GOD, ADMIN, LIDER, etc).
