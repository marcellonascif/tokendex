import React from 'react';
import {Text} from 'ink';

type Props = {
	hints: string[];
};

export function Footer({hints}: Props) {
	return <Text color="gray">{hints.join('  |  ')}</Text>;
}
