# Plano de Correção Definitiva — Autenticação, RBAC e Firestore

Este plano visa reestruturar a arquitetura de identidade e permissões do LOCAPRANCHA, garantindo que o UID do Firebase Auth seja a fonte única de verdade e que o sistema de roles (GOD, ADMINISTRADOR, etc.) funcione de forma segura e consistente.

## Alterações Técnicas

### 1. Reengenharia de Identidade (UID como Document ID)
- **Migração**: Implementação de uma rotina automática no `AuthContext` que detecta usuários legados (onde o ID do documento != UID) e cria/atualiza o documento correto em `usuarios/{uid}`.
- **Normalização**: Centralização da normalização no `src/lib/firestore/normalizers.ts` para usar exclusivamente o campo `role` como oficial, mantendo campos legados (`perfil`, `access_level`) apenas para compatibilidade de regras de segurança.

### 2. Fluxo de Autenticação Hardened
- **AuthContext**: Reestruturação para distinguir `authLoading` de `profileLoading`. O sistema agora informará claramente se o usuário está autenticado mas sem perfil operacional.
- **Segurança**: Remoção de todos os overrides baseados em strings (nickname/email) para privilégios de GOD. O nível de acesso virá estritamente do Firestore.

### 3. Sistema de Permissões Granulares
- **Matriz de Acesso**: Atualização do `src/lib/permissions/permissions.ts` para separar as capacidades de GOD e ADMINISTRADOR.
- **Gestão de Usuários**: Expansão do `UsuarioForm` para permitir a edição de permissões individuais por usuário (checkboxes), além do role padrão.

### 4. Operações de Agenda e Frota
- **Fonte Única**: Garantir que a `ReservaList` utilize exclusivamente o listener em tempo real do Firestore.
- **Transações**: Implementação de `runTransaction` em todas as mudanças de status da agenda para garantir a atualização atômica do status da frota (DISPONÍVEL <-> ALOCADO) e evitar conflitos.
- **Diferenciação**: Separação clara entre **LOCAR** (operação direta, status 'Iniciado') e **AGENDAR** (administrativo, status 'Pendente'/'Agendado').

### 5. Diagnóstico e Auditoria
- **Painel GOD**: Adição de uma área temporária de diagnóstico visual para identificar inconsistências de UID.
- **Audit Logs**: Padronização dos registros de auditoria com campos detalhados de `entity`, `action` e `details`.

## Experiência do Usuário (UI/UX)
- Mensagens de erro informativas em vez de "Acesso Interrompido" genérico.
- Exibição do UID e Role no rodapé de erro para facilitar o suporte técnico.
- Modal de edição de usuário profissional com controle de permissões por módulo.
- Preservação total do tema "Cyber Glass" e branding da Usina Pitangueiras.

## Validação de Segurança
- Novas Firestore Security Rules baseadas no campo `role`.
- Proteção de rotas no frontend e backend contra acessos não autorizados.
- Bloqueio de exclusão ou alteração de perfis GOD por outros usuários.
