import React, {useState} from 'react';
import {Menu} from './components/Menu.js';
import {Login} from './commands/login.js';

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

	return <Menu onCommand={(cmd) => setActiveCommand(cmd)} />;
}