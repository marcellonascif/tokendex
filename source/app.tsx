import React, {useState} from 'react';
import {Menu} from './components/Menu.js';
import {Login} from './commands/login.js';
import {InstallPlugin} from './commands/install-plugin.js';

type Props = {
	command?: string;
};

export default function App({command}: Props) {
	const [activeCommand, setActiveCommand] = useState<string | undefined>(
		command,
	);

	if (activeCommand === 'login') {
		return <Login />;
	}

	if (activeCommand === 'install-plugin') {
		return <InstallPlugin />;
	}

	return <Menu onCommand={(cmd) => setActiveCommand(cmd)} />;
}