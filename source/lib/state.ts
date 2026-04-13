import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';

const tokendexDir = join(homedir(), '.tokendex');
const stateFile = join(tokendexDir, 'state.json');

export type StateData = {
	tokens_wallet: number;
	total_tokens: number;
	active_pet: string;
};

export function readState(): StateData | null {
	if (!existsSync(stateFile)) return null;
	try {
		return JSON.parse(readFileSync(stateFile, 'utf8')) as StateData;
	} catch {
		return null;
	}
}

export function writeState(data: StateData): void {
	if (!existsSync(tokendexDir)) {
		mkdirSync(tokendexDir, {recursive: true});
	}

	writeFileSync(stateFile, JSON.stringify(data, null, 2), 'utf8');
}
