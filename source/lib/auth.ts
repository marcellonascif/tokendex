import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';

const tokendexDir = join(homedir(), '.tokendex');
const authFile = join(tokendexDir, 'auth.json');

export type AuthData = {
	access_token: string;
	refresh_token: string;
	expires_at: number;
};

export function readAuth(): AuthData | null {
	if (!existsSync(authFile)) return null;
	try {
		return JSON.parse(readFileSync(authFile, 'utf8')) as AuthData;
	} catch {
		return null;
	}
}

export function writeAuth(data: AuthData): void {
	if (!existsSync(tokendexDir)) {
		mkdirSync(tokendexDir, {recursive: true});
	}

	writeFileSync(authFile, JSON.stringify(data, null, 2), 'utf8');
}

export function isLoggedIn(): boolean {
	return readAuth() !== null;
}
