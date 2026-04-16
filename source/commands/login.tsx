import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {Spinner, TextInput} from '@inkjs/ui';
import {exec} from 'node:child_process';
import {supabase} from '../lib/supabase.js';
import {type CommandProps} from '../lib/commands.js';

type Step = 'loading' | 'waiting-url' | 'exchanging' | 'success' | 'error';

function parseHashFragment(url: string): Record<string, string> {
	const hashIndex = url.indexOf('#');
	if (hashIndex === -1) return {};
	return Object.fromEntries(new URLSearchParams(url.slice(hashIndex + 1)).entries());
}

export function Login({onBack}: CommandProps) {

	const [step, setStep] = useState<Step>('loading');
	const [authUrl, setAuthUrl] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	useInput((_input, key) => {
		if ((key.backspace || key.delete) && step !== 'loading' && step !== 'exchanging') {
			onBack();
		}
	});

	useEffect(() => {
		if (step !== 'success') return;
		const timer = setTimeout(() => { onBack(true); }, 1500);
		return () => { clearTimeout(timer); };
	}, [step, onBack]);

	useEffect(() => {
		supabase.auth
			.signInWithOAuth({
				provider: 'github',
				options: {
					redirectTo: 'http://localhost:54321/callback',
					skipBrowserRedirect: true,
				},
			})
			.then(({data, error}) => {
				if (error ?? !data.url) {
					setErrorMessage(error?.message ?? 'Failed to generate auth URL');
					setStep('error');
					return;
				}

				setAuthUrl(data.url!);
				exec(`open "${data.url!}"`);
				setStep('waiting-url');
			})
			.catch((err: Error) => {
				setErrorMessage(err.message);
				setStep('error');
			});
	}, []);

	async function handleUrlSubmit(url: string) {
		setStep('exchanging');

		const params = parseHashFragment(url);
		const {access_token, refresh_token, expires_at, expires_in} = params;

		if (!access_token || !refresh_token) {
			setErrorMessage('Could not find tokens in URL. Please try again.');
			setStep('error');
			return;
		}

		const {error} = await supabase.auth.setSession({
			access_token,
			refresh_token,
		});

		if (error) {
			setErrorMessage(error.message);
			setStep('error');
			return;
		}

		// Patch expires_at in storage since setSession may not persist it
		const expiresAt = expires_at
			? Number(expires_at)
			: Math.floor(Date.now() / 1000) + (expires_in ? Number(expires_in) : 3600);

		await supabase.auth.updateUser({});
		void expiresAt;

		setStep('success');
	}

	if (step === 'loading' || step === 'exchanging') {
		return <Spinner label={step === 'exchanging' ? 'Completing login...' : 'Preparing login...'} />;
	}

	if (step === 'waiting-url') {
		return (
			<Box flexDirection="column" gap={1}>
				<Text>Open the link below to authorize with GitHub:</Text>
				<Text color="cyan">{authUrl}</Text>
				<Text color="gray">After authorizing, paste the callback URL here:</Text>
				<TextInput placeholder="" onSubmit={handleUrlSubmit} />
			</Box>
		);
	}

	if (step === 'success') {
		return <Text color="green">Logged in successfully!</Text>;
	}

	if (step === 'error') {
		return (
			<Box flexDirection="column" gap={1}>
				<Text color="red">Error: {errorMessage}</Text>
				<Text color="gray">Press <Text bold>⌫</Text> to go back and try again.</Text>
			</Box>
		);
	}

	return null;
}
