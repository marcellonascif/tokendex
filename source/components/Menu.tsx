import React, {useState} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import {commands} from '../lib/commands.js';
import {Footer} from './Footer.js';
import {SingleSelect} from './SingleSelect.js';
import {StatusDot} from './StatusDot.js';

const logo = `  _        _                  _
 | |_ ___ | | _____ _ __   __| | _____  __
 | __/ _ \\| |/ / _ \\ '_ \\ / _\` |/ _ \\ \\/ /
 | || (_) |   <  __/ | | | (_| |  __/>  <
  \\__\\___/|_|\\_\\___|_| |_|\\__,_|\\___/_/\\_\\`;

type Screen = 'main' | 'confirm-relogin';

type Props = {
	loggedIn: boolean;
	onCommand: (command: string) => void;
};

export function Menu({loggedIn, onCommand}: Props) {
	const {exit} = useApp();
	const [screen, setScreen] = useState<Screen>('main');

	useInput((input, key) => {
		if (input.toLowerCase() === 'q') {
			exit();
		}

		if (screen === 'confirm-relogin') {
			if (key.return) {
				onCommand('login');
			} else if (key.backspace || key.delete) {
				setScreen('main');
			}
		}
	});

	return (
		<Box flexDirection="column" gap={1}>
			{/* Header */}
			<Box flexDirection="column" overflow="hidden">
				<Text color="yellow">{logo}</Text>
				<Text> </Text>
				<Text color="gray">Collect pets and rewards based on your AI token usage</Text>
				<Text color="cyan" bold>https://github.com/marcellonascif/tokendex</Text>
			</Box>

			{/* Menu */}
			{screen === 'main' && (
				<SingleSelect
					options={commands.map((c) => ({
						label: c.label,
						value: c.id,
						suffix: c.id === 'login' ? <StatusDot active={loggedIn} /> : undefined,
					}))}
					onChange={(value) => {
						if (value === 'login' && loggedIn) {
							setScreen('confirm-relogin');
							return;
						}

						onCommand(value);
					}}
				/>
			)}

			{screen === 'confirm-relogin' && (
				<Text>You are already logged in. Login again?</Text>
			)}

			{/* Footer */}
			{screen === 'main'
				? <Footer hints={['↑↓: Navigate', 'Enter: Select', 'Q: Quit']} />
				: <Footer hints={['Enter: Confirm', '⌫: Back', 'Q: Quit']} />
			}
		</Box>
	);
}
