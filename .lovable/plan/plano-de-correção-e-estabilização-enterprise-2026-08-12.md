# Plano de Correção e Estabilização Enterprise

Este plano visa resolver o erro `auth/email-already-in-use` e consolidar a segurança do Firestore.

## 1. Tratamento de Erros no Cadastro
- **Ajuste em `useUsuarios.ts`**: Adicionar verificação explícita para o erro `auth/email-already-in-use`.
- **Ação**: Se o e-mail já existe no Auth mas não há perfil no Firestore, o sistema deve sugerir a recuperação ou informar que o perfil precisa ser migrado/vinculado.

## 2. Refinamento das Security Rules
- **Ajuste em `firestore.rules`**:
  - Garantir que `hasRole` verifique corretamente o campo `role`.
  - Incluir suporte para o campo `permissions` granular.
  - Bloquear explicitamente que `ADMINISTRADOR` promova alguém a `GOD`.

## 3. Matriz de Permissões Granulares
- **Ajuste em `permissions.ts`**: Unificar a lógica de `canAccessTab` entre frontend e backend (Security Rules).
- **Ação**: Validar que a lista de checkboxes no `UsuarioForm.tsx` reflete fielmente as capacidades definidas.

## 4. Auditoria e Logs
- **Ajuste em `AuditoriaList.tsx`**: Garantir que o log de `auth/email-already-in-use` seja registrado se ocorrer durante uma tentativa administrativa.

## Detalhes Técnicos
- Utilização de `firebase/auth` erro codes.
- Sincronização de campos legados (`perfil`, `access_level`) para retrocompatibilidade com regras de segurança existentes.
