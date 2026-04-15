import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';

const tokendexDir = join(homedir(), '.tokendex');
const authFile = join(tokendexDir, 'auth.json');
const stateFile = join(tokendexDir, 'state.json');
const BACKEND_URL = 'https://dlbfntpmwnndalyivknx.supabase.co/functions/v1/report-tokens';

type AuthData = {access_token: string};
type HookInput = {transcript_path: string};
type AssistantEntry = {
	message: {
		usage: {input_tokens: number; output_tokens: number};
		model: string;
	};
};

async function main() {
	// Lê input do stdin (JSON do hook)
	const raw = await new Promise<string>((resolve, reject) => {
		let data = '';
		process.stdin.on('data', (chunk: string) => {
			data += chunk;
		});
		process.stdin.on('end', () => {
			resolve(data);
		});
		process.stdin.on('error', reject);
	});

	const input = JSON.parse(raw) as HookInput;
	const {transcript_path} = input;
	if (!transcript_path) return;

	// Parseia o transcript JSONL
	const lines = readFileSync(transcript_path, 'utf8').trim().split('\n');
	const entries = lines
		.map((line) => {
			try {
				return JSON.parse(line) as unknown;
			} catch {
				return null;
			}
		})
		.filter(Boolean) as Array<Record<string, unknown>>;

	// Pega a última entrada assistant com usage
	const filtered = entries.filter(
		(e) => (e['message'] as Record<string, unknown> | undefined)?.['usage'],
	);
	const last = filtered[filtered.length - 1] as AssistantEntry | undefined;

	if (!last) return;

	const {input_tokens, output_tokens} = last.message.usage;
	const model = last.message.model || 'unknown';

	if (!input_tokens && !output_tokens) return;

	// Verifica auth
	if (!existsSync(authFile)) return;
	const {access_token} = JSON.parse(readFileSync(authFile, 'utf8')) as AuthData;
	if (!access_token) return;

	// Envia ao backend
	const res = await fetch(BACKEND_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${access_token}`,
		},
		body: JSON.stringify({
			model,
			provider: 'claude_code',
			input_tokens,
			output_tokens,
		}),
	});

	if (!res.ok) {
		process.stderr.write(`tokendex: backend error ${res.status}\n`);
		return;
	}

	const data = (await res.json()) as {tokens_wallet?: number};
	const {tokens_wallet} = data;

	if (tokens_wallet === undefined) {
		process.stderr.write('tokendex: backend did not return tokens_wallet\n');
		return;
	}

	// Atualiza state local
	const state = existsSync(stateFile)
		? (JSON.parse(readFileSync(stateFile, 'utf8')) as Record<string, unknown>)
		: {};

	writeFileSync(stateFile, JSON.stringify({...state, tokens_wallet}));
}

main().catch((err: Error) => {
	process.stderr.write(`tokendex: ${err.message}\n`);
});
