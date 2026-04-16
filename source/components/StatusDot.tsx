import React from 'react';
import {Text} from 'ink';

type Props = {
	active: boolean;
};

export function StatusDot({active}: Props) {
	return <Text color={active ? 'green' : 'gray'}>{active ? '●' : '○'}</Text>;
}
