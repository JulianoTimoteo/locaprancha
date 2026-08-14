# Locaprancha - Gestão de Frota e Agendamento

Sistema inteligente de gestão de frota e transporte de equipamentos para a Usina Pitangueiras.

## 🚀 Stack Tecnológica

- **Frontend**: React 19 + Vite 8 + TypeScript
- **Estilização**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Firebase (Authentication & Firestore)
- **Hospedagem**: GitHub Pages
- **CI/CD**: GitHub Actions

## 🔐 Segurança (Zero Trust)

O sistema implementa uma arquitetura de segurança onde a autoridade reside no servidor (Firestore Security Rules).

- **Identidade**: Validada via Firebase Auth.
- **Autorização**: Baseada em Perfis (GOD, ADMINISTRADOR, LIDER, MOTORISTA, SOLICITANTE).
- **Integridade**: Logs de auditoria imutáveis e transações atômicas para mudanças de estado.

## 🛠️ Desenvolvimento e Build

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Comandos

```sh
npm install      # Instalar dependências
npm run dev      # Iniciar ambiente de desenvolvimento
npm run build    # Gerar build de produção (dist/)
npm run preview  # Testar o build localmente
```

## 📦 Deploy

O deploy é automatizado via GitHub Actions. Sempre que um push é feito na branch `main`, o sistema executa:

1. Lint e Typecheck
2. Testes automatizados
3. Build de produção
4. Upload para o GitHub Pages

URL de Produção: [https://julianotimoteo.github.io/locaprancha/](https://julianotimoteo.github.io/locaprancha/)
