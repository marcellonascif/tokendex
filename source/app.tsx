import React, {useState} from 'react';
import {Menu} from './components/Menu.js';
import {commands} from './lib/commands.js';

type Props = {
	command?: string;
};

export default function App({command}: Props) {
	const [activeCommand, setActiveCommand] = useState<string | undefined>(command);

	const active = commands.find((c) => c.id === activeCommand);

	if (active) {
		return <active.component onBack={() => setActiveCommand(undefined)} />;
	}

	return <Menu onCommand={(cmd) => setActiveCommand(cmd)} />;
}
