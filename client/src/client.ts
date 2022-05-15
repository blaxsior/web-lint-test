/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { LanguageClientOptions, ProtocolRequestType0 } from 'vscode-languageclient';

import { LanguageClient } from 'vscode-languageclient/browser';
import { getInitOptions } from './common';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	console.log('web lint activated!');

	const languages = ['python', 'java', 'c', 'cpp'];
	
	const documentSelector = languages.map(lang => {return {language: lang}; } );
	const InitOptions = getInitOptions(context);

	const clientOptions: LanguageClientOptions = {
		documentSelector,
		synchronize: {},
		initializationOptions: InitOptions
	};

	const client = createWorkerLanguageClient(context, clientOptions);
	const disposable = client.start();
	context.subscriptions.push(disposable);

	getQueryFiles(languages).then(() => {
		console.log('로딩 완료!');
	});

	client.onReady().then(() => {
		console.log('lsp-web-extension-sample server is ready');
	});

	client.sendNotification('lint-config-change', );
	// 클라이언트 측에서 서버측으로 메시지를 보내도록 만든다.

	const disposable2 = vscode.commands.registerCommand('web-lint.helloWorld', () => {
		vscode.window.showWarningMessage('Hello, World!');
	});
	context.subscriptions.push(disposable2);

	// lint 파일의 변경은 수동으로 알려줘야 한다.
	const disposable3 = vscode.commands.registerCommand('web-lint.loadlint', async () => {
		await getQueryFiles(languages);
	});
	context.subscriptions.push(disposable3);
}

async function getQueryFiles(languages: string[]) {
	const base_path = vscode.Uri.file('/_lint');
	if(base_path)
	{
		console.log(`경로 : ${base_path.toString()}`);
	}
	const lint_list = []; // lint를 위한 쿼리들.

	for(const lang of languages)
	{
		const lint_lang_path = vscode.Uri.joinPath(base_path,lang);

		const dirr = await vscode.workspace.fs.readDirectory(lint_lang_path);
		if(dirr.length > 0)
		{
			for(const [fname, type] of dirr)
			{
				if(type == vscode.FileType.File) // 파일이라면
				{
					console.log(fname);
				}
			}
		}
		else {
			console.log(`${lint_lang_path.toString()} 에 파일이 없음`);
		}
	}
	// const query_uri = vscode.workspace.fs.readDirectory(vscode.Uri.file('/'))
}

function createWorkerLanguageClient(context: vscode.ExtensionContext, clientOptions: LanguageClientOptions) {
	const serverMain = vscode.Uri.joinPath(context.extensionUri, 'dist/server.js');
	const worker = new Worker(serverMain.toString(true));
	return new LanguageClient('web lint', 'web lint', clientOptions, worker);
}