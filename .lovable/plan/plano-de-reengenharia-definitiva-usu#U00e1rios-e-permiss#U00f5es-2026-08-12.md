# Plano de Reengenharia Definitiva — Usuários e Permissões

Este plano visa consolidar a arquitetura de identidade, segurança e gestão de usuários conforme as regras operacionais da Locaprancha.

## Mudanças Técnicas

### 1. Modelo de Permissões Granulares (`src/lib/permissions/permissions.ts`)

- Implementar a matriz `DEFAULT_PERMISSIONS_BY_ROLE`.
- Alterar `hasPermission` e `canAccessTab` para priorizar o array `permissions` do documento Firestore em vez de apenas o `role` para usuários não-GOD.
- **GOD** mantém acesso total independentemente das permissões salvas.

### 2. Gestão de Usuários e Segurança (`src/features/usuarios/UsuarioForm.tsx`)

- Remover opção **GOD** do select de perfil para administradores.
- Automatizar o preenchimento dos checkboxes de permissões ao selecionar um perfil.
- Permitir personalização manual das permissões após a seleção do perfil.
- Preservar permissões customizadas ao carregar um usuário existente para edição.
- Adicionar indicador de módulos habilitados (ex: "5 de 8 módulos").
- Remover campos de UID manuais (UID deve vir do Firebase Auth).

### 3. Fluxo de Criação e Identidade (`src/features/usuarios/useUsuarios.ts`)

- Corrigir o erro "Missing or insufficient permissions" ao criar usuários.
- Como é um SPA estático sem Cloud Functions, utilizaremos uma instância secundária do Firebase Auth para criar o novo usuário sem deslogar o administrador atual.
- Garantir que o ID do documento Firestore seja sempre o UID gerado pelo Firebase Auth (`usuarios/{uid}`).
- Sincronizar campos legados (`perfil`, `nivelAcesso`, `access_level`) para garantir compatibilidade com as Security Rules existentes.

### 4. Segurança no Servidor (`firestore.rules`)

- Refatorar `canAccessTab` para validar o array `permissions` em vez de apenas `isAdmin()`.
- Reforçar a proteção da coleção `usuarios`:
  - Administradores comuns não podem criar ou editar usuários com `role: "GOD"`.
  - Administradores comuns não podem alterar o próprio `role` para "GOD".
  - Bloquear acesso operacional se `status != "ATIVO"`.

### 5. Auditoria e Logs (`src/lib/audit.ts` e `useUsuarios.ts`)

- Padronizar logs de auditoria para ações administrativas (Criação, Edição, Bloqueio, Alteração de Role/Permissões).
- Garantir registro de `actorUid`, `actorEmail` e `targetUid`.

## Critérios de Aceite

- Administrador não vê e não pode criar/editar perfis GOD.
- Checkboxes de permissões funcionam de forma inteligente (padrão por perfil + customização).
- O erro de permissão na criação de usuário foi eliminado.
- As regras de segurança do Firestore refletem as restrições de perfil e permissões.
