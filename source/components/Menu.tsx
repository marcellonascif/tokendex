import React, {useState} from 'react';
import {Box, Text, useInput, useApp, useWindowSize} from 'ink';
import {Select} from '@inkjs/ui';
import {isLoggedIn} from '../lib/auth.js';

const logo = `████████╗ ██████╗ ██╗  ██╗███████╗███╗   ██╗██████╗ ███████╗██╗  ██╗
╚══██╔══╝██╔═══██╗██║ ██╔╝██╔════╝████╗  ██║██╔══██╗██╔════╝╚██╗██╔╝
   ██║   ██║   ██║█████╔╝ █████╗  ██╔██╗ ██║██║  ██║█████╗   ╚███╔╝
   ██║   ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╗██║██║  ██║██╔══╝   ██╔██╗
   ██║   ╚██████╔╝██║  ██╗███████╗██║ ╚████║██████╔╝███████╗██╔╝ ██╗
   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝`;

type Screen = 'main' | 'confirm-relogin' | 'login-providers';

type Props = {
	onCommand: (command: string) => void;
};

export function Menu({onCommand}: Props) {
	const {exit} = useApp();
	const {columns} = useWindowSize();
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
		<Box flexDirection="column" gap={1} width={columns}>
			{/* Header */}
			<Box flexDirection="column" overflow="hidden" width={columns}>
				<Text color="yellow">{logo}</Text>
				<Text color="cyan" bold>
					https://github.com/marcellonascif/tokendex
				</Text>
				<Text color="gray">Collect pets based on your token usage</Text>
			</Box>

			{/* Menu */}
			{screen === 'main' && (
				<Select
					key="main"
					options={[{label: loggedIn ? 'Login  ✓' : 'Login', value: 'login'}]}
					onChange={(value) => {
						if (value === 'login') {
							setScreen(loggedIn ? 'confirm-relogin' : 'login-providers');
						}
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
