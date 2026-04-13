# tokendex

Collect pets and rewards based on your AI token usage.

## Installation

```bash
npm install -g tokendex
```

## Usage

Open the interactive menu:

```bash
tokendex
```

Or run a command directly:

```bash
tokendex login
```

## Commands

| Command | Description |
|---------|-------------|
| `tokendex login` | Authenticate with GitHub via Supabase OAuth |

## Local files

tokendex stores data in `~/.tokendex/`:

| File | Contents |
|------|----------|
| `~/.tokendex/auth.json` | Authentication tokens (`access_token`, `refresh_token`, `expires_at`) |
| `~/.tokendex/state.json` | Your current state (`tokens_wallet`, `total_tokens`, `active_pet`) |

To log out, delete `~/.tokendex/auth.json`.

## Requirements

- Node.js >= 16
