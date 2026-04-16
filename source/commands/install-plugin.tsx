import React, {useEffect, useState} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import {Spinner} from '@inkjs/ui';
import {MultiSelect} from '../components/MultiSelect.js';
import {integrations, type Integration} from '../lib/integrations.js';
import {type CommandProps} from '../lib/commands.js';
import {Footer} from '../components/Footer.js';

type ToolStatus = 'running' | 'success' | 'not-found' | 'error';

type ToolResult = {
	integration: Integration;
	status: ToolStatus;
};

type Screen = 'select' | 'results';

export function InstallPlugin({title, onBack}: CommandProps) {
	const {exit} = useApp();
	const [screen, setScreen] = useState<Screen>('select');
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [results, setResults] = useState<ToolResult[]>([]);

	const allDone =
		results.length > 0 &&
		results.every((r) => r.status !== 'running');

	useInput((input, key) => {
		if (input.toLowerCase() === 'q' && (screen === 'select' || allDone)) {
			exit();
		}

		if ((key.backspace || key.delete) && (screen === 'select' || allDone)) {
			onBack();
		}
	});

	useEffect(() => {
		if (screen !== 'results' || selectedIds.length === 0) return;

		const selected = integrations.filter((i) => selectedIds.includes(i.id));

		setResults(selected.map((integration) => ({integration, status: 'running'})));

		setTimeout(() => {
			for (const integration of selected) {
				const detected = integration.detect();

				if (!detected) {
					setResults((prev) =>
						prev.map((r) =>
							r.integration.id === integration.id
								? {...r, status: 'not-found'}
								: r,
						),
					);
					continue;
				}

				try {
					integration.install();
					setResults((prev) =>
						prev.map((r) =>
							r.integration.id === integration.id
								? {...r, status: 'success'}
								: r,
						),
					);
				} catch {
					setResults((prev) =>
						prev.map((r) =>
							r.integration.id === integration.id
								? {...r, status: 'error'}
								: r,
						),
					);
				}
			}
		}, 0);
	}, [screen, selectedIds]);

	if (screen === 'select') {
		return (
			<Box flexDirection="column" gap={1}>
				<Text bold>{title}</Text>
				<MultiSelect
					options={integrations.map((i) => ({label: i.label, value: i.id}))}
					onSubmit={(values) => {
						if (values.length === 0) return;
						setSelectedIds(values);
						setScreen('results');
					}}
				/>
				<Footer hints={['Space: toggle', 'Enter: install', '⌫: Back', 'Q: Quit']} />
			</Box>
		);
	}

	return (
		<Box flexDirection="column" gap={1}>
			<Text bold>{title}</Text>
			<Box flexDirection="column" gap={1}>
				{results.map((r) => (
					<Box key={r.integration.id} flexDirection="column">
						<Text bold>{r.integration.label}</Text>
						{r.status === 'running' && <Spinner label="Installing..." />}
						{r.status === 'success' && (
							<Text color="green">✓ Plugin installed successfully</Text>
						)}
						{r.status === 'not-found' && (
							<Text color="red">✗ Not found</Text>
						)}
						{r.status === 'error' && (
							<Text color="red">✗ Installation failed</Text>
						)}
					</Box>
				))}
			</Box>
			{allDone && <Footer hints={['⌫: Back', 'Q: Quit']} />}
		</Box>
	);
}
