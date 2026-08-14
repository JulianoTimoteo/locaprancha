# Guia de Deploy Definitivo — LOCAPRANCHA

Este documento detalha o processo de publicação da aplicação no GitHub Pages.

## 1. Configuração do Repositório (GitHub)

Certifique-se de que o repositório oficial seja: `https://github.com/JulianoTimoteo/locaprancha`.

## 2. GitHub Pages Settings

No GitHub:

1. Vá em **Settings** > **Pages**.
2. Em **Build and deployment** > **Source**, selecione **GitHub Actions**.

## 3. Variáveis de Ambiente (Secrets)

Para que o GitHub Actions consiga realizar o build com as chaves corretas, você deve adicionar os Segredos do Repositório (**Settings** > **Secrets and variables** > **Actions**):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## 4. Pipeline de CI/CD

O arquivo `.github/workflows/deploy.yml` gerencia o fluxo automático:

- **Trigger**: Push na branch `main` ou execução manual.
- **Node Version**: 22.
- **Processo**: `npm ci` -> `npm run build` -> `validate dist` -> `deploy`.

## 5. Verificação Pós-Deploy

Após o workflow terminar com sucesso, acesse:
[https://julianotimoteo.github.io/locaprancha/](https://julianotimoteo.github.io/locaprancha/)

Verifique:

1. Se o CSS e JS carregam corretamente (inspecione a rede para erros 404).
2. Se a conexão com o Firebase é estabelecida.
3. Se o login funciona.
