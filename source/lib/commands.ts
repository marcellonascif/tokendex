import React from 'react';
import {Login} from '../commands/login.js';
import {InstallPlugin} from '../commands/install-plugin.js';
import {UninstallPlugin} from '../commands/uninstall-plugin.js';

export type CommandProps = {
	title: string;
	onBack: (loggedIn?: boolean) => void;
};

export type Command = {
	id: string;
	label: string;
	component: React.FC<CommandProps>;
};

function toId(label: string): string {
	return label.toLowerCase().split(' ').join('-');
}

function command(label: string, component: React.FC<CommandProps>): Command {
	return {id: toId(label), label, component};
}

export const commands: Command[] = [
	command('Login', Login),
	command('Install plugin', InstallPlugin),
	command('Uninstall plugin', UninstallPlugin),
];
