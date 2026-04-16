import {readFileSync, writeFileSync, existsSync, openSync, readSync, closeSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';

const SUPABASE_URL = 'https://dlbfntpmwnndalyivknx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsYmZudHBtd25uZGFseWl2a254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Mjk2MTksImV4cCI6MjA5MTUwNTYxOX0.wl0tlwzPTYdXhvn0jAt7d1Tsp-Rl0cpDXUjY0V7heuc';
const REPORT_TOKENS_URL = `${SUPABASE_URL}/functions/v1/report-tokens`;
const REFRESH_TOKEN_URL = `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`;

const tokendexDir = join(homedir(), '.tokendex');
const authFile = join(tokendexDir, 'credentials.json');
const stateFile = join(tokendexDir, 'state.json');

type AuthData = {
	access_token: string;
	refresh_token: string;
	expires_at: number;
};

type TokenUsage = {
	input_tokens: number;
	output_tokens: number;
	cache_creation_input_tokens: number;
	cache_read_input_tokens: number;
	model: string;
};

// ── auth ───────────────────────────────────────────────────────────────────

function readAuth(): AuthData | null {
	if (!existsSync(authFile)) return null;
	return JSON.parse(readFileSync(authFile, 'utf8')) as AuthData;
}

function saveAuth(auth: AuthData): void {
	writeFileSync(authFile, JSON.stringify(auth, null, 2), 'utf8');
}

async function refreshToken(refreshToken: string): Promise<AuthData> {
	const res = await fetch(REFRESH_TOKEN_URL, {
		method: 'POST',
		headers: {'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY},
		body: JSON.stringify({refresh_token: refreshToken}),
	});

	if (!res.ok) throw new Error('session expired, please run tokendex login');

	const data = (await res.json()) as {
		access_token: string;
		refresh_token: string;
		expires_in: number;
	};

	return {
		access_token: data.access_token,
		refresh_token: data.refresh_token,
		expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
	};
}

async function getValidToken(): Promise<string> {
	const auth = readAuth();
	if (!auth) throw new Error('not logged in, please run tokendex login');

	const isExpired = Math.floor(Date.now() / 1000) >= auth.expires_at;
	if (!isExpired) return auth.access_token;

	const refreshed = await refreshToken(auth.refresh_token);
	saveAuth(refreshed);
	return refreshed.access_token;
}

// ── transcript ─────────────────────────────────────────────────────────────

function readStdin(): Promise<string> {
	return new Promise((resolve, reject) => {
		let data = '';
		process.stdin.on('data', (chunk: string) => { data += chunk; });
		process.stdin.on('end', () => { resolve(data); });
		process.stdin.on('error', reject);
	});
}

function readOffsets(): Record<string, number> {
	const state = existsSync(stateFile)
		? (JSON.parse(readFileSync(stateFile, 'utf8')) as Record<string, unknown>)
		: {};
	return (state['transcript_offsets'] as Record<string, number> | undefined) ?? {};
}

function saveOffset(transcriptPath: string, offset: number): void {
	const state = existsSync(stateFile)
		? (JSON.parse(readFileSync(stateFile, 'utf8')) as Record<string, unknown>)
		: {};
	const offsets = (state['transcript_offsets'] as Record<string, number> | undefined) ?? {};
	offsets[transcriptPath] = offset;
	writeFileSync(stateFile, JSON.stringify({...state, transcript_offsets: offsets}));
}

function readNewLines(transcriptPath: string, fromOffset: number): {lines: string[]; newOffset: number} {
	const fileSize = statSync(transcriptPath).size;
	if (fileSize <= fromOffset) return {lines: [], newOffset: fromOffset};

	const length = fileSize - fromOffset;
	const buffer = Buffer.alloc(length);
	const fd = openSync(transcriptPath, 'r');
	readSync(fd, buffer, 0, length, fromOffset);
	closeSync(fd);

	const lines = buffer.toString('utf8').split('\n').filter((l) => l.trim());
	return {lines, newOffset: fileSize};
}

function parseNewUsage(transcriptPath: string): TokenUsage | null {
	const offsets = readOffsets();
	const fromOffset = offsets[transcriptPath] ?? 0;

	const {lines, newOffset} = readNewLines(transcriptPath, fromOffset);
	if (lines.length === 0) return null;

	type Entry = {
		message?: {
			id?: string;
			model?: string;
			usage?: {
				input_tokens: number;
				output_tokens: number;
				cache_creation_input_tokens: number;
				cache_read_input_tokens: number;
			};
		};
		requestId?: string;
	};

	// Deduplicate by messageId:requestId, keep max values
	const seen = new Map<string, {usage: NonNullable<Entry['message']>['usage']; model: string}>();

	for (const line of lines) {
		let entry: Entry;
		try {
			entry = JSON.parse(line) as Entry;
		} catch {
			continue;
		}

		const usage = entry.message?.usage;
		if (!usage) continue;

		const key = `${entry.message?.id ?? ''}:${entry.requestId ?? ''}`;
		const existing = seen.get(key);

		if (!existing) {
			seen.set(key, {usage: {...usage}, model: entry.message?.model ?? 'unknown'});
		} else {
			existing.usage!.input_tokens = Math.max(existing.usage!.input_tokens, usage.input_tokens);
			existing.usage!.output_tokens = Math.max(existing.usage!.output_tokens, usage.output_tokens);
			existing.usage!.cache_creation_input_tokens = Math.max(existing.usage!.cache_creation_input_tokens, usage.cache_creation_input_tokens);
			existing.usage!.cache_read_input_tokens = Math.max(existing.usage!.cache_read_input_tokens, usage.cache_read_input_tokens);
		}
	}

	if (seen.size === 0) return null;

	let input_tokens = 0;
	let output_tokens = 0;
	let cache_creation_input_tokens = 0;
	let cache_read_input_tokens = 0;
	let model = 'unknown';

	for (const entry of seen.values()) {
		input_tokens += entry.usage!.input_tokens;
		output_tokens += entry.usage!.output_tokens;
		cache_creation_input_tokens += entry.usage!.cache_creation_input_tokens;
		cache_read_input_tokens += entry.usage!.cache_read_input_tokens;
		model = entry.model;
	}

	if (!input_tokens && !output_tokens && !cache_creation_input_tokens && !cache_read_input_tokens) return null;

	saveOffset(transcriptPath, newOffset);

	return {input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens, model};
}

// ── backend ────────────────────────────────────────────────────────────────

type BackendResponse = {
	tokens_wallet: number;
	active_pet?: {rarity: string; element: string; name: string};
};

async function reportUsage(token: string, usage: TokenUsage): Promise<BackendResponse> {
	const res = await fetch(REPORT_TOKENS_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			model: usage.model,
			provider: 'claude_code',
			input_tokens: usage.input_tokens,
			output_tokens: usage.output_tokens,
			cache_creation_input_tokens: usage.cache_creation_input_tokens,
			cache_read_input_tokens: usage.cache_read_input_tokens,
		}),
	});

	if (!res.ok) throw new Error(`backend error ${res.status}`);

	const data = (await res.json()) as BackendResponse;
	if (data.tokens_wallet === undefined) throw new Error('backend did not return tokens_wallet');

	return data;
}

// ── state ──────────────────────────────────────────────────────────────────

function updateState(response: BackendResponse): void {
	const state = existsSync(stateFile)
		? (JSON.parse(readFileSync(stateFile, 'utf8')) as Record<string, unknown>)
		: {};

	writeFileSync(stateFile, JSON.stringify({
		...state,
		tokens_wallet: response.tokens_wallet,
		active_pet: response.active_pet,
	}));
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
	const raw = await readStdin();
	const {transcript_path} = JSON.parse(raw) as {transcript_path?: string};
	if (!transcript_path) return;

	const usage = parseNewUsage(transcript_path);
	if (!usage) return;

	const token = await getValidToken();
	const response = await reportUsage(token, usage);
	updateState(response);
}

main().catch((err: Error) => {
	process.stderr.write(`tokendex: ${err.message}\n`);
});
