# Plano de Correção Definitiva — Sistema de Permissões e Acesso

O sistema atual apresenta falhas na cadeia de autorização, resultando em bloqueios indevidos ("Acesso Restrito") mesmo para usuários autenticados com perfis válidos. Este plano visa unificar a fonte de verdade, normalizar dados legados e garantir que o carregamento do perfil seja respeitado antes de qualquer decisão de acesso.

## Alterações Técnicas

### 1. Normalização e Tipagem
- Unificar a interface `UserProfile` para usar `role` como campo principal e `permissions` como lista de permissões granulares.
- Reforçar o `normalizeUserProfile` para lidar com campos legados (`perfil`, `nivelAcesso`, `access_level`) e garantir que o `status` seja interpretado corretamente.

### 2. Serviço de Permissões Centralizado (`src/lib/permissions/`)
- Criar funções utilitárias: `hasPermission`, `hasRole`, `isGod`, `isActive`.
- Implementar a lógica de que o `GOD` ignora restrições de permissões individuais, mas ainda respeita o status de bloqueio.

### 3. Contexto de Autenticação (`src/features/auth/AuthContext.tsx`)
- Adicionar estados de carregamento granulares para distinguir entre `authLoading` e `profileLoading`.
- Garantir que o `profile` seja atualizado em tempo real via `onSnapshot` e que o estado de carregamento só mude para `false` após a tentativa de carregar o documento do Firestore.

### 4. Proteção de Rotas e UI (`src/App.tsx` e `src/components/layout/Layout.tsx`)
- Modificar o `App.tsx` para mostrar um loader enquanto o perfil está sendo carregado, evitando o flash de "Acesso Restrito".
- Implementar uma tela específica para usuários bloqueados ("Seu acesso está bloqueado").
- Unificar a lógica de visibilidade do menu e das abas usando o serviço central de permissões.

### 5. Gestão de Usuários
- Atualizar a interface de gerenciamento de usuários para permitir a atribuição de permissões individuais.
- Garantir que a alteração de permissões no Firestore reflita instantaneamente na UI do usuário afetado.

## Relatório de Entrega (Previsão)

- **Autenticação**: Resolvido o race condition entre Auth e Firestore.
- **Normalização**: Mapeados campos legados para um modelo único.
- **RBAC**: Implementado sistema de permissões granulares respeitando roles existentes.
- **Segurança**: Bloqueio de acesso para usuários inativos e validação de rota consistente com o menu.
