import React from 'react';
import {Login} from '../commands/login.js';
import {InstallPlugin} from '../commands/install-plugin.js';
import {Uninstall} from '../commands/uninstall.js';

export type Command = {
	id: string;
	label: string;
	component: React.FC;
};

export const commands: Command[] = [
	{id: 'login', label: 'Login', component: Login},
	{id: 'setup', label: 'Setup', component: InstallPlugin},
	{id: 'uninstall', label: 'Uninstall', component: Uninstall},
];
