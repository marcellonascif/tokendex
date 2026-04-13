import {execSync} from 'node:child_process';

export type Integration = {
	id: string;
	label: string;
	detect: () => boolean;
	install: () => void;
};

export function detectClaudeCode(): boolean {
	try {
		execSync('claude --version', {stdio: 'ignore'});
		return true;
	} catch {
		return false;
	}
}

export function installClaudeCode(): void {
	execSync('claude plugin install tokendex', {stdio: 'inherit'});
}

export const integrations: Integration[] = [
	{
		id: 'claude-code',
		label: 'Claude Code',
		detect: detectClaudeCode,
		install: installClaudeCode,
	},
];
