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
	  login      Authenticate with GitHub
	  setup      Install tokendex integrations
	  uninstall  Remove tokendex integrations

	Examples
	  $ tokendex
	  $ tokendex login
	  $ tokendex setup
	  $ tokendex uninstall
`,
	{
		importMeta: import.meta,
	},
);

const command = cli.input[0];

render(<App command={command} />, {alternateScreen: !command});