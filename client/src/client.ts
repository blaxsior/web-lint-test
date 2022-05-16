/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { LanguageClientOptions } from 'vscode-languageclient';

import { LanguageClient } from 'vscode-languageclient/browser';
import { getInitOptions } from './common';
import { ILangLint, ILint } from './lint';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	console.log('web lint activated!');

	const languages = ['python', 'java', 'c', 'cpp'];

	const documentSelector = languages.map(lang => { return { language: lang }; });
	const InitOptions = getInitOptions(context);

	const clientOptions: LanguageClientOptions = {
		documentSelector,
		synchronize: {},
		initializationOptions: InitOptions
	};

	const client = createWorkerLanguageClient(context, clientOptions);
	const disposable = client.start();
	context.subscriptions.push(disposable);

	// lint 설정하기
	const disposable2 = vscode.commands.registerCommand('web-lint.setlint', async () => {
		await getUserInput(context);
		vscode.window.showInformationMessage('린트 설정 성공');
	});
	context.subscriptions.push(disposable2);

	// lint 로드하기
	const disposable3 = vscode.commands.registerCommand('web-lint.loadlint', async () => {
		const lints = await getqueries(context,languages);
		client.sendNotification('lint-config-change', lints);
		vscode.window.showInformationMessage('린트 로드 성공');
		// 클라이언트 측에서 서버측으로 메시지를 보내도록 만든다.
	});
	context.subscriptions.push(disposable3);

	// 클라이언트 로딩
	client.onReady().then(() => {
		vscode.window.showInformationMessage('클라이언트 준비. 이제 set lint 명령으로 린터를 설정하세요!');
		vscode.commands.executeCommand('web-lint.loadlint')
		.then();
	});
}

function createWorkerLanguageClient(context: vscode.ExtensionContext, clientOptions: LanguageClientOptions) {
	const serverMain = vscode.Uri.joinPath(context.extensionUri, 'dist/server.js');
	const worker = new Worker(serverMain.toString(true));
	return new LanguageClient('web lint', 'web lint', clientOptions, worker);
}

async function getqueries(context: vscode.ExtensionContext, langs : string[]) {

	const all_lints : ILangLint[] = [];

	for(const lang of langs) // 각 언어에 대한 정보 저장.
	{ // 언어 가져오기
		const lints : ILint[] = await context.globalState.get(lang);
		if(lints)
		{
			all_lints.push({target: lang, lints});
		}
	}

	return all_lints; // 린트 모두 반환.
}

async function getUserInput(context: vscode.ExtensionContext) {
	const input = await vscode.window.showInputBox({ placeHolder: 'json 내용을 복사!' });
	
	const json_lint : ILangLint[] = JSON.parse(input); // ILint 타입으로 파싱.
	// 이거에 안맞는거 들어오면 에러로 취급되서 진행 자체가 안됨.

	for(const lang_lint of json_lint) // 각 언어에 대한 정보 저장.
	{
		await context.globalState.update(lang_lint.target, lang_lint.lints);
	}

	await vscode.commands.executeCommand('web-lint.loadlint');
}