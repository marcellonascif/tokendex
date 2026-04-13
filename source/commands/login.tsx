import React, {useState, useEffect} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import {TextInput} from '@inkjs/ui';
import {spawnSync} from 'child_process';
import {readAuth, writeAuth} from '../lib/auth.js';

const supabaseUrl = 'https://dlbfntpmwnndalyivknx.supabase.co';

function parseHashFragment(url: string): Record<string, string> {
	const hashIndex = url.indexOf('#');
	if (hashIndex === -1) return {};
	const hash = url.slice(hashIndex + 1);
	return Object.fromEntries(new URLSearchParams(hash).entries());
}

function openBrowser(url: string): void {
	const cmd =
		process.platform === 'darwin'
			? 'open'
			: process.platform === 'win32'
			? 'start'
			: 'xdg-open';
	try {
		spawnSync(cmd, [url]);
	} catch {}
}

type Step = 'confirm-relogin' | 'opening-browser' | 'paste-url' | 'success' | 'error';

export function Login() {
	const {exit} = useApp();
	const [existing] = useState(() => readAuth());

	const [step, setStep] = useState<Step>(
		existing ? 'confirm-relogin' : 'opening-browser',
	);
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		if (step !== 'opening-browser') return;
		const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=github&redirect_to=http://localhost:9999/callback`;
		openBrowser(authUrl);
		setStep('paste-url');
	}, [step]);

	useEffect(() => {
		if (step !== 'success') return;
		const timer = setTimeout(() => {
			exit();
		}, 1000);
		return () => {
			clearTimeout(timer);
		};
	}, [step, exit]);

	useInput((input) => {
		if (step !== 'confirm-relogin') return;
		if (input.toLowerCase() === 'y') {
			setStep('opening-browser');
		} else {
			exit();
		}
	});

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

	if (step === 'confirm-relogin') {
		return (
			<Box flexDirection="column">
				<Text>You are already logged in. Login again? (y/N)</Text>
			</Box>
		);
	}

	if (step === 'opening-browser') {
		return <Text>Opening browser...</Text>;
	}

	if (step === 'paste-url') {
		return (
			<Box flexDirection="column">
				<Text>
					Browser opened. After authorizing with GitHub, paste the callback URL
					here:
				</Text>
				<TextInput placeholder="https://..." onSubmit={handleUrlSubmit} />
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
