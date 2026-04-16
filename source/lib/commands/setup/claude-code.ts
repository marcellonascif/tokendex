import {
	readFileSync,
	writeFileSync,
	existsSync,
	mkdirSync,
	copyFileSync,
	rmSync,
} from 'node:fs';
import {join, dirname} from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';

const HOOK_COMMAND = 'node ~/.tokendex/integrations/claude-code/report-tokens.js';

const STATUSLINE_MARKER_START =
	'# ── tokendex ──────────────────────────────────────────────';
const STATUSLINE_MARKER_END =
	'# ── /tokendex ─────────────────────────────────────────────';
const STATUSLINE_ANCHOR = "printf '%s' \"$out\"";
const STATUSLINE_BLOCK = `
${STATUSLINE_MARKER_START}
tokendex_out=$(node "$HOME/.tokendex/integrations/claude-code/statusline.js" 2>/dev/null)
if [ -n "$tokendex_out" ]; then
  out=$(printf '%s │ %s' "$out" "$tokendex_out")
fi
${STATUSLINE_MARKER_END}

${STATUSLINE_ANCHOR}`;

// ── install ────────────────────────────────────────────────────────────────

function copyScripts(): void {
	const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
	const srcDir = join(packageRoot, 'dist', 'integrations', 'claude-code');
	const destDir = join(homedir(), '.tokendex', 'integrations', 'claude-code');

	mkdirSync(destDir, {recursive: true});
	copyFileSync(join(srcDir, 'report-tokens.js'), join(destDir, 'report-tokens.js'));
	copyFileSync(join(srcDir, 'statusline.js'), join(destDir, 'statusline.js'));
}

function injectStopHook(): void {
	const settingsFile = join(homedir(), '.claude', 'settings.json');

	const settings = existsSync(settingsFile)
		? (JSON.parse(readFileSync(settingsFile, 'utf8')) as Record<string, unknown>)
		: {};

	const hooks = (settings['hooks'] ?? {}) as Record<string, unknown>;
	const stopHooks = (hooks['Stop'] ?? []) as Array<{
		hooks: Array<{type: string; command: string}>;
	}>;

	const alreadyAdded = stopHooks.some((group) =>
		group.hooks?.some((h) => h.command === HOOK_COMMAND),
	);
	if (alreadyAdded) return;

	stopHooks.push({hooks: [{type: 'command', command: HOOK_COMMAND}]});
	hooks['Stop'] = stopHooks;
	settings['hooks'] = hooks;

	writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

function injectStatusline(): void {
	const statuslineFile = join(homedir(), '.claude', 'statusline.sh');
	if (!existsSync(statuslineFile)) return;

	const content = readFileSync(statuslineFile, 'utf8');
	if (content.includes(STATUSLINE_MARKER_START)) return;

	const updated = content.replace(STATUSLINE_ANCHOR, STATUSLINE_BLOCK);
	if (updated === content) return;

	writeFileSync(statuslineFile, updated);
}

// ── uninstall ──────────────────────────────────────────────────────────────

function removeStopHook(): void {
	const settingsFile = join(homedir(), '.claude', 'settings.json');
	if (!existsSync(settingsFile)) return;

	const settings = JSON.parse(readFileSync(settingsFile, 'utf8')) as Record<string, unknown>;
	const hooks = settings['hooks'] as Record<string, unknown> | undefined;
	if (!hooks) return;

	const stopHooks = (hooks['Stop'] ?? []) as Array<{
		hooks: Array<{type: string; command: string}>;
	}>;

	hooks['Stop'] = stopHooks.filter(
		(group) => !group.hooks?.some((h) => h.command === HOOK_COMMAND),
	);

	if ((hooks['Stop'] as unknown[]).length === 0) {
		delete hooks['Stop'];
	}

	if (Object.keys(hooks).length === 0) {
		delete settings['hooks'];
	}

	writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

function removeStatuslineBlock(): void {
	const statuslineFile = join(homedir(), '.claude', 'statusline.sh');
	if (!existsSync(statuslineFile)) return;

	const content = readFileSync(statuslineFile, 'utf8');
	if (!content.includes(STATUSLINE_MARKER_START)) return;

	// Remove o bloco entre os marcadores (inclusive) e a linha em branco extra antes
	const lines = content.split('\n');
	const result: string[] = [];
	let inside = false;
	let skipNextBlank = false;

	for (const line of lines) {
		if (line.trim() === STATUSLINE_MARKER_START) {
			inside = true;
			// Remove linha em branco que precede o bloco
			if (result[result.length - 1] === '') result.pop();
			continue;
		}

		if (line.trim() === STATUSLINE_MARKER_END) {
			inside = false;
			skipNextBlank = true;
			continue;
		}

		if (skipNextBlank && line === '') {
			skipNextBlank = false;
			continue;
		}

		if (!inside) result.push(line);
	}

	writeFileSync(statuslineFile, result.join('\n'));
}

// ── exports ────────────────────────────────────────────────────────────────

export function install(): void {
	copyScripts();
	injectStopHook();
	injectStatusline();
}

export function uninstall(): void {
	removeStopHook();
	removeStatuslineBlock();
	rmSync(join(homedir(), '.tokendex', 'integrations', 'claude-code'), {
		recursive: true,
		force: true,
	});
}
