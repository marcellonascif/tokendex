import React from 'react';
import {Login} from '../commands/login.js';
import {InstallPlugin} from '../commands/install-plugin.js';
import {Uninstall} from '../commands/uninstall.js';

export type Command = {
	id: string;
	label: string;
	component: React.FC;
};

function toId(label: string): string {
	return label.toLowerCase().split(' ').join('-');
}

function command(label: string, component: React.FC): Command {
	return {id: toId(label), label, component};
}

export const commands: Command[] = [
	command('Login', Login),
	command('Install plugin', InstallPlugin),
	command('Uninstall plugin', Uninstall),
];
