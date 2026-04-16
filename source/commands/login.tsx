import React, {useState, useEffect} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {TextInput} from '@inkjs/ui';
import {writeAuth} from '../lib/auth.js';
import {type CommandProps} from '../lib/commands.js';

const supabaseUrl = 'https://dlbfntpmwnndalyivknx.supabase.co';

function parseHashFragment(url: string): Record<string, string> {
	const hashIndex = url.indexOf('#');
	if (hashIndex === -1) return {};
	const hash = url.slice(hashIndex + 1);
	return Object.fromEntries(new URLSearchParams(hash).entries());
}


type Step = 'show-link' | 'paste-url' | 'success' | 'error';

export function Login({onBack}: CommandProps) {
	const {exit} = useApp();
	const [step, setStep] = useState<Step>('show-link');
	const [errorMessage, setErrorMessage] = useState('');

	const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=github&redirect_to=http://localhost:8080/callback`;

	useInput((_input, key) => {
		if (key.backspace || key.delete) {
			onBack();
		}
	});

	useEffect(() => {
		if (step !== 'success') return;
		const timer = setTimeout(() => {
			exit();
		}, 1000);
		return () => {
			clearTimeout(timer);
		};
	}, [step, exit]);

	function handleUrlSubmit(url: string) {
		const params = parseHashFragment(url);
		const {access_token, refresh_token, expires_at} = params;

		if (!access_token || !refresh_token) {
			setErrorMessage('Could not find required tokens in URL. Please try again.');
			setStep('error');
			return;
		}

		writeAuth({
			access_token,
			refresh_token,
			expires_at: expires_at
				? Number(expires_at)
				: Math.floor(Date.now() / 1000) + 3600,
		});

		setStep('success');
	}

	if (step === 'show-link') {
		return (
			<Box flexDirection="column" gap={1}>
				<Text>Open the link below to authorize with GitHub:</Text>
				<Text color="cyan">{authUrl}</Text>
				<Text>After authorizing, you will be redirected to a URL. Copy that URL and press <Text bold>Enter</Text> below to continue.</Text>
				<TextInput placeholder="" onSubmit={() => setStep('paste-url')} />
			</Box>
		);
	}

	if (step === 'paste-url') {
		return (
			<Box flexDirection="column" gap={1}>
				<Text>Paste the callback URL and press <Text bold>Enter</Text>:</Text>
				<TextInput placeholder="" onSubmit={handleUrlSubmit} />
			</Box>
		);
	}

	if (step === 'success') {
		return <Text color="green">Logged in successfully!</Text>;
	}

	if (step === 'error') {
		return <Text color="red">Error: {errorMessage}</Text>;
	}

	return null;
}
