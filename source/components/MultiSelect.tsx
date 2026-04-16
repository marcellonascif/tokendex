import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';

type Option = {
	label: string;
	value: string;
};

type Props = {
	options: Option[];
	onSubmit: (values: string[]) => void;
};

export function MultiSelect({options, onSubmit}: Props) {
	const [cursor, setCursor] = useState(0);
	const [selected, setSelected] = useState<Set<string>>(new Set());

	useInput((input, key) => {
		if (key.upArrow) {
			setCursor((c) => (c - 1 + options.length) % options.length);
		}

		if (key.downArrow) {
			setCursor((c) => (c + 1) % options.length);
		}

		if (key.return) {
			onSubmit([...selected]);
		}

		if (input === ' ') {
			const value = options[cursor]!.value;
			setSelected((prev) => {
				const next = new Set(prev);
				if (next.has(value)) {
					next.delete(value);
				} else {
					next.add(value);
				}

				return next;
			});
		}
	});

	return (
		<Box flexDirection="column">
			{options.map((option, index) => {
				const isSelected = selected.has(option.value);
				const isFocused = index === cursor;

				return (
					<Box key={option.value} gap={1}>
						<Text color={isFocused ? 'white' : 'gray'}>
							{isFocused ? '›' : ' '}
						</Text>
						<Text color={isSelected ? 'green' : 'gray'}>
							{isSelected ? '●' : '○'}
						</Text>
						<Text color={isFocused ? 'white' : undefined}>
							{option.label}
						</Text>
					</Box>
				);
			})}
		</Box>
	);
}
