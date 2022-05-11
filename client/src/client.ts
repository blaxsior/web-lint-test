/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { LanguageClientOptions } from 'vscode-languageclient';

import { LanguageClient } from 'vscode-languageclient/browser';
import { getInitOptions } from './common';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	console.log('web lint activated!');

	const documentSelector = [
	{ language: 'python' },
	{ language: 'java' },
	{ language: 'c' },
	{ language: 'cpp' }];
	const InitOptions = getInitOptions(context);

	const clientOptions: LanguageClientOptions = {
		documentSelector,
		synchronize: {},
		initializationOptions: InitOptions
	};

	const client = createWorkerLanguageClient(context, clientOptions);
	const disposable = client.start();
	context.subscriptions.push(disposable);

	client.onReady().then(() => {
		console.log('lsp-web-extension-sample server is ready');
	});

	const disposable2 = vscode.commands.registerCommand('web-lint.helloWorld', () => {
		vscode.window.showWarningMessage('Hello, World!');
	});
	context.subscriptions.push(disposable2);

}

function createWorkerLanguageClient(context: vscode.ExtensionContext, clientOptions: LanguageClientOptions) {
	const serverMain = vscode.Uri.joinPath(context.extensionUri, 'dist/server.js');
	const worker = new Worker(serverMain.toString(true));
	return new LanguageClient('web lint', 'web lint', clientOptions, worker);
}
