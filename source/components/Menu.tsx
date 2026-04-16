import React, {useState} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import {Select} from '@inkjs/ui';
import {isLoggedIn} from '../lib/auth.js';
import {commands} from '../lib/commands.js';

const logo = `  _        _                  _
 | |_ ___ | | _____ _ __   __| | _____  __
 | __/ _ \\| |/ / _ \\ '_ \\ / _\` |/ _ \\ \\/ /
 | || (_) |   <  __/ | | | (_| |  __/>  <
  \\__\\___/|_|\\_\\___|_| |_|\\__,_|\\___/_/\\_\\`;

type Screen = 'main' | 'confirm-relogin' | 'login-providers';

type Props = {
	onCommand: (command: string) => void;
};

export function Menu({onCommand}: Props) {
	const {exit} = useApp();
	const [screen, setScreen] = useState<Screen>('main');
	const loggedIn = isLoggedIn();

	useInput((input, key) => {
		if (input.toLowerCase() === 'q') {
			exit();
		}

		if (key.backspace || key.delete) {
			setScreen('main');
		}

		if (screen === 'confirm-relogin') {
			if (input.toLowerCase() === 'y') {
				setScreen('login-providers');
			} else if (key.return || input.toLowerCase() === 'n') {
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
				<Select
					key="main"
					options={commands.map((c) => ({
						label: c.id === 'login' && loggedIn ? `${c.label}  ✓` : c.label,
						value: c.id,
					}))}
					onChange={(value) => {
						if (value === 'login') {
							setScreen(loggedIn ? 'confirm-relogin' : 'login-providers');
							return;
						}

						onCommand(value);
					}}
				/>
			)}

			{screen === 'confirm-relogin' && (
				<Text>You are already logged in. Login again? (y/N)</Text>
			)}

			{screen === 'login-providers' && (
				<Box flexDirection="column">
					<Text bold>Login</Text>
					<Select
						key="providers"
						options={[{label: 'GitHub', value: 'github'}]}
						onChange={(value) => {
							if (value === 'github') onCommand('login');
						}}
					/>
				</Box>
			)}

			{/* Footer */}
			<Text color="gray">↑↓: Navigate  |  Enter: Select  |  ⌫: Back  |  Q: Quit</Text>
		</Box>
	);
}
