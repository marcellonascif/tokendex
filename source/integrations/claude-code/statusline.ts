import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';

const tokendexDir = join(homedir(), '.tokendex');
const authFile = join(tokendexDir, 'auth.json');
const stateFile = join(tokendexDir, 'state.json');

const RARITY_COLORS: Record<string, string> = {
	legendary: '\u001B[33m',
	epic: '\u001B[35m',
	rare: '\u001B[34m',
	common: '\u001B[37m',
};
const RESET = '\u001B[0m';

try {
	if (!existsSync(authFile)) {
		process.stdout.write('🪙 login required');
		process.exit(0);
	}

	const state = existsSync(stateFile)
		? (JSON.parse(readFileSync(stateFile, 'utf8')) as Record<string, unknown>)
		: {};

	const wallet = ((state['tokens_wallet'] as number) || 0).toLocaleString('en-US');
	const pet = state['active_pet'] as {rarity: string; element: string; name: string} | undefined;

	let output = `🪙 ${wallet}`;

	if (pet) {
		const color = RARITY_COLORS[pet.rarity] ?? RESET;
		output += `  ${color}${pet.element} ${pet.name}${RESET}`;
	}

	process.stdout.write(output);
} catch {
	// falha silenciosa
}
