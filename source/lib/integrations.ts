import {execSync} from 'node:child_process';
import {install, uninstall} from './commands/setup/claude-code.js';

export type Integration = {
	id: string;
	label: string;
	detect: () => boolean;
	install: () => void;
	uninstall: () => void;
};

function detectClaudeCode(): boolean {
	try {
		execSync('claude --version', {stdio: 'ignore'});
		return true;
	} catch {
		return false;
	}
}

export const integrations: Integration[] = [
	{
		id: 'claude-code',
		label: 'Claude Code',
		detect: detectClaudeCode,
		install,
		uninstall,
	},
];
