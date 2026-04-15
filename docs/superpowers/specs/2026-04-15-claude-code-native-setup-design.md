# Claude Code Native Setup — Design

**Data:** 2026-04-15
**Parte:** 1 do port plugin → CLI

Substituir o hook `SessionStart` do plugin pelo comando `tokendex install-plugin` configurando o Claude Code diretamente, sem depender do sistema de plugins.

---

## Contexto

O plugin `tokendex@marcellonascif` hoje usa `SessionStart` para:
1. Instalar o CLI via npm
2. Inserir bloco no `~/.claude/statusline.sh`

Com o port, essas responsabilidades passam para o CLI. O plugin deixa de existir. O usuário roda `tokendex install-plugin`, seleciona Claude Code, e tudo é configurado de uma vez.

---

## Arquitetura

Três mudanças no CLI, todas em `source/integrations/claude-code/`:

1. **Scripts de integração** — `report-tokens.ts` e `statusline.ts` migram do plugin para `source/integrations/claude-code/`. São compilados para `dist/integrations/claude-code/` e publicados no npm junto com o pacote.

2. **Cópia dos scripts** — `installClaudeCode()` em `source/lib/integrations.ts` resolve o path do pacote instalado via `import.meta.url`, lê os `.js` compilados de `dist/integrations/claude-code/` e os copia para `~/.tokendex/integrations/claude-code/`. Operação idempotente: sobrescreve sempre (garante atualização).

3. **Configuração do ambiente** — após copiar, `installClaudeCode()` faz:
   - Insere hook `Stop` no `~/.claude/settings.json`
   - Insere bloco tokendex no `~/.claude/statusline.sh`
   Ambas as operações são idempotentes via marcadores/chaves.

---

## Scripts de integração

### `source/integrations/claude-code/report-tokens.ts`

Mesma lógica do plugin. Roda no hook `Stop` do Claude Code.

- Lê `transcript_path` do stdin (JSON do hook)
- Parseia o `.jsonl`, pega a última entrada `assistant` com `usage`
- Extrai `input_tokens`, `output_tokens`, `model`
- Verifica `~/.tokendex/auth.json` — encerra silenciosamente se não existir
- Envia ao backend via fetch
- Backend retorna `tokens_wallet` → salva em `~/.tokendex/state.json`
- Erros vão para stderr, nunca para stdout

### `source/integrations/claude-code/statusline.ts`

Mesma lógica do plugin. Chamado pelo `~/.claude/statusline.sh`.

- Sem chamadas de rede
- Lê `~/.tokendex/auth.json` e `~/.tokendex/state.json`
- Saídas: `🪙 login required` / `🪙 1,234` / `🪙 1,234  [cor]emoji nome[reset]`
- Falha silenciosa (try/catch global, nenhum output em caso de erro)

---

## `installClaudeCode()` — fluxo completo

```
1. Resolve PACKAGE_ROOT via import.meta.url
2. Cria ~/.tokendex/integrations/claude-code/ se não existir
3. Copia dist/integrations/claude-code/report-tokens.js → ~/.tokendex/integrations/claude-code/
4. Copia dist/integrations/claude-code/statusline.js → ~/.tokendex/integrations/claude-code/
5. Lê ~/.claude/settings.json (cria {} se não existir)
6. Adiciona hook Stop se não existir (chave hooks.Stop)
7. Escreve ~/.claude/settings.json
8. Lê ~/.claude/statusline.sh
9. Checa marcador # ── tokendex ── — pula se já existir
10. Insere bloco antes do printf '%s' "$out" final
11. Escreve ~/.claude/statusline.sh
```

### Hook Stop inserido no settings.json

```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "node ~/.tokendex/integrations/claude-code/report-tokens.js"
      }]
    }]
  }
}
```

A inserção é aditiva: se `hooks.Stop` já existir com outros hooks, adiciona o tokendex sem sobrescrever.

### Bloco inserido no statusline.sh

```sh
# ── tokendex ──────────────────────────────────────────────
tokendex_out=$(node "$HOME/.tokendex/integrations/claude-code/statusline.js" 2>/dev/null)
if [ -n "$tokendex_out" ]; then
  out=$(printf '%s │ %s' "$out" "$tokendex_out")
fi
# ── /tokendex ─────────────────────────────────────────────
```

Usa `$HOME` em vez de path absoluto para portabilidade.

---

## `detectClaudeCode()` — sem mudança

Continua checando `claude --version`. Se não encontrar, o `InstallPlugin` exibe "Not found".

---

## Idempotência

| Operação | Como garante idempotência |
|----------|--------------------------|
| Cópia dos scripts | Sempre sobrescreve — garante atualização ao re-rodar |
| Hook no settings.json | Checa se entrada idêntica já existe antes de adicionar |
| Bloco no statusline.sh | Checa marcador `# ── tokendex ──` antes de inserir |

---

## Estrutura de arquivos

```
tokendex/
└── source/
    ├── integrations/          ← novo
    │   └── claude-code/
    │       ├── report-tokens.ts
    │       └── statusline.ts
    └── lib/
        └── integrations.ts    ← installClaudeCode() reescrito
```

Compilado:
```
tokendex/
└── dist/
    └── integrations/
        └── claude-code/
            ├── report-tokens.js
            └── statusline.js
```

Instalado em `~/.tokendex/`:
```
~/.tokendex/
├── auth.json
├── state.json
└── integrations/
    └── claude-code/
        ├── report-tokens.js
        └── statusline.js
```

---

## Fora do escopo desta parte

- Remover/deprecar o plugin `tokendex-plugin` (parte futura)
- Comando `tokendex update` para atualizar scripts já instalados
- Outras integrações (VS Code, Cursor, etc.)
