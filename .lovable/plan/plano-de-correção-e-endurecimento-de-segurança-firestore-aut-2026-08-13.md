# Plano de Correção e Endurecimento de Segurança (Firestore & Auth)

Este plano visa corrigir as vulnerabilidades identificadas na auditoria de segurança, movendo a lógica de autorização para as regras do Firestore, prevenindo escalação de privilégios e endurecendo a criação de usuários.

## Alterações Propostas

### 1. Firestore Security Rules (`firestore.rules`)

- **Bloqueio de Usuários**: Atualizar `userExists()` para verificar se o status do usuário é `ATIVO`. Usuários `BLOQUEADO` perderão acesso instantaneamente a todas as operações de escrita, mesmo que tenham permissões administrativas no perfil.
- **Segurança da Agenda**:
  - Restringir a alteração do status 'Aprovado' exclusivamente para perfis `GOD` ou `ADMINISTRADOR`.
  - Garantir que o solicitante não possa aprovar sua própria reserva.
- **Validação de Auditoria**:
  - Implementar validação de campos na criação de `audit_logs`, garantindo que o `uid` e `usuario` no log correspondam ao usuário autenticado (prevenindo logs forjados).
- **Proteção de Permissões**:
  - Impedir que qualquer `ADMINISTRADOR` (não-GOD) crie ou atualize usuários com a permissão `auditoria`.

### 2. Criação de Usuários (`src/features/usuarios/useUsuarios.ts`)

- **Endurecimento de Senhas**:
  - Remover a senha padrão `'mudar123'`.
  - Gerar uma senha aleatória segura para novos usuários criados pelo administrador.
  - Opcional: Sugerir a implementação de fluxo de "Esqueci minha senha" para o primeiro acesso.

## Detalhes Técnicos

### Regras Firestore

```javascript
// Exemplo de melhoria no userExists
function userExists() {
  return isAuthenticated()
    && exists(/databases/$(database)/documents/usuarios/$(request.auth.uid))
    && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.status == "ATIVO";
}

// Exemplo de validação de auditoria
match /audit_logs/{logId} {
  allow create: if isAuthenticated()
    && request.resource.data.uid == request.auth.uid
    && request.resource.data.usuario == getUserData().nickname; // ou name
}
```

### Hook useUsuarios

```typescript
// Geração de senha segura
const generateSecurePassword = () => {
  return (
    Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase()
  );
};
```

## Benefícios

- **Conformidade com Least Privilege**: A segurança não dependerá apenas da interface React.
- **Imutabilidade da Auditoria**: Logs não poderão ser forjados por usuários mal-intencionados.
- **Resposta Instantânea a Bloqueios**: Perfis comprometidos perdem acesso ao banco no momento em que o status é alterado para `BLOQUEADO`.
