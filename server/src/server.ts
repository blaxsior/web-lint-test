/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { createConnection, BrowserMessageReader, BrowserMessageWriter, DiagnosticSeverity, Diagnostic } from 'vscode-languageserver/browser';

import { InitializeParams, InitializeResult, ServerCapabilities, TextDocuments, Range } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Languages } from './languages';
import { Tree } from './tree';
import { ILangLint, ILint } from './lint';

console.log('running server');

/* browser specific setup code */

let linter: Map<string, ILint[]>;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

/* from here on, all code is non-browser specific and could be shared with a regular extension */

interface InitOptions {
	treeSitterWasmUri: string;
	lang_uri: Map<string, string>
}

// 모두 초기화하는 코드

connection.onInitialize(async (params: InitializeParams): Promise<InitializeResult> => {
	const initData: InitOptions = params.initializationOptions;
	console.log('tree-sitter : ', initData.lang_uri);

	await Tree.init(initData.treeSitterWasmUri); // 트리 시터 초기화
	await Languages.init(initData.lang_uri); // 언어 목록 초기화.

	const capabilities: ServerCapabilities = {
	};
	console.log("server ready");
	return { capabilities };
});

// 클라언트가 린트 바뀌었다고 메시지 보내면 해당 메시지 받아서 query를 전부 새로 만든다.
connection.onNotification('lint-config-change', (val: ILangLint[]) => {
	console.log(`서버 린터 설정`);
	// for (const v of val) {
	// 	console.log(v.target);
	// 	for (const lint of v.lints) {
	// 		console.log(`${lint.node_name} ${lint.type} ${lint.message} ${lint.query}`);
	// 	}
	// }

	const temp = new Map<string, ILint[]>();

	val.forEach(
		(lint) => {
			lint.lints.forEach(
				l => {
					let bef = l.query;
					let cur = l.query.replace('\\', '');
					while (bef !== cur) {
						bef = cur;
						cur = cur.replace('\\', '');
					} // \ 이 더 이상 없을 때까지 모두 제거한다.

					l.query = bef;
				}
			);
			temp.set(lint.target, lint.lints);
		}
	);

	linter = temp;

	Languages.setLintQueries(temp); // 쿼리 설정.
});

// Track open, change and close text document events
const documents = new TextDocuments(TextDocument);
documents.listen(connection);
// Register providers

//https://code.visualstudio.com/api/language-extensions/language-server-extension-guide#adding-a-simple-validation
// 여기다가 트리 파서 과정 적용!

documents.onDidChangeContent(async change => {
	const doc = change.document;
	const lang_id = doc.languageId;
	const text = doc.getText();

	Tree.attach_lang(lang_id); // 언어 교체
	Tree.parse(text); // 트리 파싱

	const tree = Tree.get_tree(); // 트리 가져오기
	console.log(tree);

	// tree?.rootNode.

	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	// 패턴 매칭이 되는 놈이 있으면 찾아서 없앤다는 마인드.
	
	let problems = 0;
	const diagnostics: Diagnostic[] = [];
	// 패턴에 맞는게 있으면 안됨!

	const captures = Languages.getQueryCaptures(lang_id, tree);
	console.log(captures);

	if (captures) // captures 객체가 실제로 존재하는 경우
	{
		for (const cap of captures) {
			problems += 1;
			if(problems > 100) // 최대 문제 개수 제한
			{
				break;
			}
			const name = cap.name;
			const node = cap.node;
			let message = '';
			let severty: DiagnosticSeverity = DiagnosticSeverity.Warning;
			const range = Range.create(node.startPosition.row, node.startPosition.column, node.endPosition.row, node.endPosition.column);
			const lints = linter.get(lang_id); // lang_id에 대응되는 린터 가져오기.
			if (lints) { // 린터 객체가 존재할 때
				for (const l of lints) { // 각각의 린터에 대해 
					console.log(`${name}, ${l.node_name}`);

					if (name === l.node_name) { // 대응되는 린터를 발견한 경우
						// 대응되는 린터가 없는 경우는 관여 X
						message = l.message;
						switch (l.type) { // 린터의 타입을 읽어 와서 설정.
							case 'error':
								severty = DiagnosticSeverity.Error;
								break;
							case 'hint':
								severty = DiagnosticSeverity.Hint;
								break;
							case 'warning':
								severty = DiagnosticSeverity.Warning;
								break;
							case 'information':
								severty = DiagnosticSeverity.Information;
								break;
						}

						// 린터를 문제 창에 출력하기 위해 Diagnostic 객체 생성.
						const diagnostic: Diagnostic = {
							severity: severty,
							range: range,
							message: message,
							source: 'web-lint'
						};
						diagnostics.push(diagnostic); // 객체를 삽입한다
						break; // 린터가 중복될 수는 없음.
					}
				}
			}
		}
	}
	connection.sendDiagnostics({ uri: doc.uri, diagnostics });
});

// Listen on the connection
connection.listen();
