import React, {useState} from 'react';
import {Box, Text} from 'ink';
import {Select} from '@inkjs/ui';

type Screen = 'main' | 'login-providers';

type Props = {
	onCommand: (command: string) => void;
};

export function Menu({onCommand}: Props) {
	const [screen, setScreen] = useState<Screen>('main');

	if (screen === 'main') {
		return (
			<Box flexDirection="column">
				<Text bold>tokendex</Text>
				<Select
					options={[{label: 'Login', value: 'login'}]}
					onChange={(value) => {
						if (value === 'login') setScreen('login-providers');
					}}
				/>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text bold>Login</Text>
			<Select
				options={[{label: 'GitHub', value: 'github'}]}
				onChange={(value) => {
					if (value === 'github') onCommand('login');
				}}
			/>
		</Box>
	);
}