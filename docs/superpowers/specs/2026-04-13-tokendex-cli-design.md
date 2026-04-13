# tokendex — Design Spec

**Date:** 2026-04-13

---

## Overview

The main tokendex product. A CLI where the user manages everything — authentication, pets, wallet, and future features. Runs directly in the terminal, without going through the model.

Plugins (Claude Code, VS Code, Antigravity, etc.) are connectors that integrate tokendex into specific environments. They depend on this CLI and the local files it manages.

---

## Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **TUI:** `ink` + `ink-ui` (Select, Spinner, TextInput components)
- **Args parsing:** `meow`
- **Dev/Build:** `tsx` for development, `tsc` for build
- **Published as:** `tokendex` on npm

---

## Project Structure

```
tokendex/
├── bin/
│   └── tokendex.js          # shebang entrypoint, calls src/cli.tsx
├── src/
│   ├── cli.tsx              # parse args with meow, dispatch to app
│   ├── app.tsx              # root component: interactive menu or direct command
│   ├── components/
│   │   └── Menu.tsx         # arrow-key navigation menu (ink-ui Select)
│   ├── commands/
│   │   └── login.tsx        # login flow component + logic
│   └── lib/
│       ├── auth.ts          # read/write ~/.tokendex/auth.json
│       └── state.ts         # read/write ~/.tokendex/state.json
├── tsconfig.json
└── package.json
```

---

## Commands

### `tokendex` (no arguments)

Opens interactive TUI menu:

```
Login
  > GitHub
```

Top-level menu shows available commands. Selecting "Login" opens a sub-menu with providers. Currently only GitHub. Structure supports adding more providers in the future.

### `tokendex login`

Runs the login flow directly without opening the interactive menu.

---

## Login Flow

1. Check `~/.tokendex/auth.json` — if it exists, prompt:
   `"You are already logged in. Login again? (y/N)"`
   - If user answers N (or Enter): exit
   - If user answers Y: proceed with login flow
2. Open browser at Supabase OAuth URL:
   `https://dlbfntpmwnndalyivknx.supabase.co/auth/v1/authorize?provider=github&redirect_to=http://localhost:PORT/callback`
3. Display: `"Paste the callback URL from your browser:"`
4. User copies the full URL from the browser address bar (contains `#access_token=...` hash fragment)
5. CLI parses the hash fragment, extracts: `access_token`, `refresh_token`, `expires_at`
6. Saves to `~/.tokendex/auth.json`
7. Displays: `"Logged in successfully!"`

**Note:** The Supabase OAuth callback returns tokens in the URL hash fragment (`#access_token=...`). Since hash fragments are not sent to the server, the CLI does not use a local HTTP server to capture the callback. Instead, the user pastes the full callback URL manually.

---

## Local Files

| File | Content |
|------|---------|
| `~/.tokendex/auth.json` | `{ access_token, refresh_token, expires_at }` |
| `~/.tokendex/state.json` | `{ tokens_wallet, total_tokens, active_pet }` — read by the plugin statusline |

---

## All text is in English

All terminal output, prompts, and messages must be in English.

---

## Future Commands

| Command | Endpoint | Method | Notes |
|---------|----------|--------|-------|
| `tokendex hatch` | `/hatch-egg` | POST | Will include animation and character movement |
| `tokendex status` | `/status` | GET | |

---

## Out of Scope (v1)

- Token refresh logic
- Logout command
- Error retry logic beyond basic messaging
- Any commands beyond `login`
