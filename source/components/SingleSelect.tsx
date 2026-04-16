import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';

type Option = {
	label: string;
	value: string;
	suffix?: React.ReactNode;
};

type Props = {
	options: Option[];
	onChange: (value: string) => void;
};

export function SingleSelect({options, onChange}: Props) {
	const [cursor, setCursor] = useState(0);

	useInput((_input, key) => {
		if (key.upArrow) {
			setCursor((c) => (c - 1 + options.length) % options.length);
		}

		if (key.downArrow) {
			setCursor((c) => (c + 1) % options.length);
		}

		if (key.return) {
			onChange(options[cursor]!.value);
		}
	});

	return (
		<Box flexDirection="column">
			{options.map((option, index) => {
				const isFocused = index === cursor;

				return (
					<Box key={option.value} gap={1}>
						<Text color={isFocused ? 'yellow' : 'gray'}>
							{isFocused ? '›' : ' '}
						</Text>
						<Text color={isFocused ? 'white' : undefined}>
							{option.label}
						</Text>
						{option.suffix}
					</Box>
				);
			})}
		</Box>
	);
}
