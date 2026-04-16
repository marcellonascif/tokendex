import React, {useState, useEffect} from 'react';
import {Menu} from './components/Menu.js';
import {commands} from './lib/commands.js';
import {supabase} from './lib/supabase.js';

type Props = {
	command?: string;
};

export default function App({command}: Props) {
	const [activeCommand, setActiveCommand] = useState<string | undefined>(command);
	const [loggedIn, setLoggedIn] = useState(false);

	const checkSession = () => {
		supabase.auth.getSession().then(({data}) => {
			setLoggedIn(data.session !== null);
		}).catch(() => {
			setLoggedIn(false);
		});
	};

	useEffect(() => { checkSession(); }, []);

	const active = commands.find((c) => c.id === activeCommand);

	if (active) {
		return <active.component title={active.label} onBack={(loggedIn) => {
			if (loggedIn !== undefined) setLoggedIn(loggedIn);
			setActiveCommand(undefined);
		}} />;
	}

	return <Menu loggedIn={loggedIn} onCommand={(cmd) => setActiveCommand(cmd)} />;
}
