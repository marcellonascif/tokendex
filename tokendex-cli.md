# tokendex

Produto principal do tokendex. CLI onde o usuário gerencia tudo — autenticação, pets, carteira e funcionalidades futuras. Roda diretamente no terminal, sem passar pelo modelo.

Plugins (Claude Code, VS Code, Antigravity, etc.) são conectores que integram o tokendex em ambientes específicos. Eles dependem desta CLI e dos arquivos locais que ela gerencia.

---

## Stack

- Node.js puro (sem framework)
- Publicado no npm como `tokendex`

---

## Versão inicial — responsabilidades

- **Login:** fluxo OAuth com GitHub via browser, armazena token em `~/.tokendex/auth.json`

Comandos como `hatch` e `status` serão adicionados em versões futuras, quando o backend tiver as Edge Functions correspondentes.

---

## Estrutura do repo

```
tokendex-cli/
├── bin/
│   └── tokendex.js        # entrypoint do CLI
├── src/
│   ├── commands/
│   │   └── login.js
│   └── lib/
│       ├── auth.js        # leitura/escrita do token em ~/.tokendex/auth.json
│       └── state.js       # leitura/escrita do state.json
└── package.json
```

---

## Comandos

| Comando | O que faz |
|---------|-----------|
| `tokendex login` | Abre browser para OAuth com GitHub, salva token |

---

## Fluxo de login

1. CLI sobe um servidor HTTP local em uma porta aleatória
2. Abre o browser em:
   `https://dlbfntpmwnndalyivknx.supabase.co/auth/v1/authorize?provider=github&redirect_to=http://localhost:PORT/callback`
3. Usuário autoriza no GitHub
4. Supabase redireciona para `http://localhost:PORT/callback` com o token na URL
5. CLI captura o `access_token`, `refresh_token` e `expires_at` do callback
6. Salva em `~/.tokendex/auth.json` e encerra o servidor local
7. Exibe confirmação no terminal

---

## Arquivos locais

| Arquivo | Conteúdo |
|---------|----------|
| `~/.tokendex/auth.json` | `{ access_token, refresh_token, expires_at }` |
| `~/.tokendex/state.json` | `{ tokens_wallet, total_tokens, active_pet }` — lido pela statusline do plugin |

---

## Publicação

```bash
npm publish --access public
```

Instalado automaticamente pelo plugin via `SessionStart`, ou manualmente:

```bash
npm install -g tokendex-cli
```

---

## Futuro

| Comando | Endpoint | Método |
|---------|----------|--------|
| `tokendex hatch` | `/hatch-egg` | POST |
| `tokendex status` | `/status` | GET |
