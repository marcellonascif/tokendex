import {execSync} from 'node:child_process';
import {
	readFileSync,
	writeFileSync,
	existsSync,
	mkdirSync,
	copyFileSync,
} from 'node:fs';
import {join, dirname} from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';

export type Integration = {
	id: string;
	label: string;
	detect: () => boolean;
	install: () => void;
};

// ── helpers ────────────────────────────────────────────────────────────────

function copyScripts(): void {
	// dist/lib/integrations.js → duas pastas acima = package root
	const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
	const srcDir = join(packageRoot, 'dist', 'integrations', 'claude-code');
	const destDir = join(homedir(), '.tokendex', 'integrations', 'claude-code');

	mkdirSync(destDir, {recursive: true});
	copyFileSync(join(srcDir, 'report-tokens.js'), join(destDir, 'report-tokens.js'));
	copyFileSync(join(srcDir, 'statusline.js'), join(destDir, 'statusline.js'));
}

function injectStopHook(): void {
	const settingsFile = join(homedir(), '.claude', 'settings.json');
	const hookCommand = 'node ~/.tokendex/integrations/claude-code/report-tokens.js';

	const settings = existsSync(settingsFile)
		? (JSON.parse(readFileSync(settingsFile, 'utf8')) as Record<string, unknown>)
		: {};

	const hooks = (settings['hooks'] ?? {}) as Record<string, unknown>;
	const stopHooks = (hooks['Stop'] ?? []) as Array<{
		hooks: Array<{type: string; command: string}>;
	}>;

	// Idempotente: não adiciona se o comando já existir
	const alreadyAdded = stopHooks.some((group) =>
		group.hooks?.some((h) => h.command === hookCommand),
	);

	if (alreadyAdded) return;

	stopHooks.push({hooks: [{type: 'command', command: hookCommand}]});
	hooks['Stop'] = stopHooks;
	settings['hooks'] = hooks;

	writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

const STATUSLINE_MARKER_START =
	'# ── tokendex ──────────────────────────────────────────────';
const STATUSLINE_ANCHOR = "printf '%s' \"$out\"";
const STATUSLINE_BLOCK = `
${STATUSLINE_MARKER_START}
tokendex_out=$(node "$HOME/.tokendex/integrations/claude-code/statusline.js" 2>/dev/null)
if [ -n "$tokendex_out" ]; then
  out=$(printf '%s │ %s' "$out" "$tokendex_out")
fi
# ── /tokendex ─────────────────────────────────────────────

${STATUSLINE_ANCHOR}`;

function injectStatusline(): void {
	const statuslineFile = join(homedir(), '.claude', 'statusline.sh');

	if (!existsSync(statuslineFile)) return;

	const content = readFileSync(statuslineFile, 'utf8');

	// Idempotente: não modifica se marcador já existir
	if (content.includes(STATUSLINE_MARKER_START)) return;

	const updated = content.replace(STATUSLINE_ANCHOR, STATUSLINE_BLOCK);

	// Se o anchor não foi encontrado, não modifica
	if (updated === content) return;

	writeFileSync(statuslineFile, updated);
}

// ── exports ────────────────────────────────────────────────────────────────

export function detectClaudeCode(): boolean {
	try {
		execSync('claude --version', {stdio: 'ignore'});
		return true;
	} catch {
		return false;
	}
}

export function installClaudeCode(): void {
	copyScripts();
	injectStopHook();
	injectStatusline();
}

export const integrations: Integration[] = [
	{
		id: 'claude-code',
		label: 'Claude Code',
		detect: detectClaudeCode,
		install: installClaudeCode,
	},
];
