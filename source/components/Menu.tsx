import React, {useState} from 'react';
import {Box, Text} from 'ink';
import {Select} from '@inkjs/ui';

const logo = `  _        _                  _
 | |_ ___ | | _____ _ __   __| | _____  __
 | __/ _ \\| |/ / _ \\ '_ \\ / _\` |/ _ \\ \\/ /
 | || (_) |   <  __/ | | | (_| |  __/>  <
  \\__\\___/|_|\\_\\___|_| |_|\\__,_|\\___/_/\\_\\`;

type Screen = 'main' | 'login-providers';

type Props = {
	onCommand: (command: string) => void;
};

export function Menu({onCommand}: Props) {
	const [screen, setScreen] = useState<Screen>('main');

	return (
		<Box flexDirection="column" gap={1}>
			{/* Header */}
			<Box flexDirection="row" gap={2}>
				<Text color="green">{logo}</Text>
				<Box flexDirection="column" justifyContent="flex-end">
					<Text color="cyan" bold>
						https://github.com/marcellonascif/tokendex
					</Text>
					<Text color="gray">Collect pets based on your token usage</Text>
				</Box>
			</Box>

			{/* Menu */}
			{screen === 'main' ? (
				<Select
					options={[{label: 'Login', value: 'login'}]}
					onChange={(value) => {
						if (value === 'login') setScreen('login-providers');
					}}
				/>
			) : (
				<Box flexDirection="column">
					<Text bold>Login</Text>
					<Select
						options={[{label: 'GitHub', value: 'github'}]}
						onChange={(value) => {
							if (value === 'github') onCommand('login');
						}}
					/>
				</Box>
			)}

			{/* Footer */}
			<Text color="gray">↑↓ Navigate  |  Enter Select  |  Q Quit</Text>
		</Box>
	);
}