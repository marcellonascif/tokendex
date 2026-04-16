import {createClient} from '@supabase/supabase-js';
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';

const SUPABASE_URL = 'https://dlbfntpmwnndalyivknx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsYmZudHBtd25uZGFseWl2a254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Mjk2MTksImV4cCI6MjA5MTUwNTYxOX0.wl0tlwzPTYdXhvn0jAt7d1Tsp-Rl0cpDXUjY0V7heuc';

const tokendexDir = join(homedir(), '.tokendex');
const authFile = join(tokendexDir, 'credentials.json');

const fileStorage = {
	getItem(_key: string): string | null {
		if (!existsSync(authFile)) return null;
		try {
			return readFileSync(authFile, 'utf8');
		} catch {
			return null;
		}
	},
	setItem(_key: string, value: string): void {
		if (!existsSync(tokendexDir)) {
			mkdirSync(tokendexDir, {recursive: true});
		}

		writeFileSync(authFile, value, 'utf8');
	},
	removeItem(_key: string): void {
		if (existsSync(authFile)) {
			writeFileSync(authFile, '', 'utf8');
		}
	},
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		storage: fileStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});
