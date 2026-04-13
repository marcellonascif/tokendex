import React, {useEffect, useState} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import {MultiSelect, Spinner} from '@inkjs/ui';
import {integrations, type Integration} from '../lib/integrations.js';

type ToolStatus = 'idle' | 'running' | 'success' | 'not-found' | 'error';

type ToolResult = {
	integration: Integration;
	status: ToolStatus;
};

type Screen = 'select' | 'results';

export function InstallPlugin() {
	const {exit} = useApp();
	const [screen, setScreen] = useState<Screen>('select');
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [results, setResults] = useState<ToolResult[]>([]);

	useInput((input, key) => {
		if (input.toLowerCase() === 'q') {
			exit();
		}

		if ((key.backspace || key.delete) && screen === 'select') {
			// Signal to parent to go back to menu
			exit();
		}
	});

	useEffect(() => {
		if (screen !== 'results') return;

		const selected = integrations.filter((i) => selectedIds.includes(i.id));

		// Initialize all as running
		setResults(selected.map((integration) => ({integration, status: 'running'})));

		// Run each concurrently
		for (const integration of selected) {
			void (async () => {
				const detected = integration.detect();

				if (!detected) {
					setResults((prev) =>
						prev.map((r) =>
							r.integration.id === integration.id
								? {...r, status: 'not-found'}
								: r,
						),
					);
					return;
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
			})();
		}
	}, [screen, selectedIds]);

	const allDone =
		results.length > 0 &&
		results.every((r) => r.status !== 'running' && r.status !== 'idle');

	if (screen === 'select') {
		return (
			<Box flexDirection="column" gap={1}>
				<Text bold>Install plugin</Text>
				<MultiSelect
					options={integrations.map((i) => ({label: i.label, value: i.id}))}
					onSubmit={(values) => {
						if (values.length === 0) return;
						setSelectedIds(values);
						setScreen('results');
					}}
				/>
				<Text color="gray">Space: toggle  |  Enter: install  |  ⌫: back</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" gap={1}>
			<Text bold>Install plugin</Text>
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
			{allDone && <Text color="gray">⌫: back  |  Q: quit</Text>}
		</Box>
	);
}
