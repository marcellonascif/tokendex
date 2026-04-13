#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ tokendex [command]

	Commands
	  login   Authenticate with GitHub

	Examples
	  $ tokendex
	  $ tokendex login
`,
	{
		importMeta: import.meta,
	},
);

const command = cli.input[0];

render(<App command={command} />);