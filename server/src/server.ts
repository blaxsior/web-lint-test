/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { createConnection, BrowserMessageReader, BrowserMessageWriter, DiagnosticSeverity, Diagnostic } from 'vscode-languageserver/browser';

import { Color, ColorInformation, Range, InitializeParams, InitializeResult, ServerCapabilities, TextDocuments, ColorPresentation, TextEdit, TextDocumentIdentifier, LinkedEditingRangeRequest } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Languages } from './languages';
import { Tree } from './tree';
import { ILangLint } from './lint';

console.log('running server');

/* browser specific setup code */

let linter : ILangLint[] = [];

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
	return { capabilities };
});

// 클라언트가 린트 바뀌었다고 메시지 보내면 해당 메시지 받아서 query를 전부 새로 만든다.
connection.onNotification('lint-config-change', (val : ILangLint[]) => {
	console.log(`서버 린터 설정`);
	for(const v of val)
	{
		console.log(v.target);
		for(const lint of v.lints)
		{
			console.log(`${lint.node_name} ${lint.type} ${lint.message} ${lint.query}`);
		}
	}

	linter = val;
	console.log(linter);

	Languages.setQueries(linter); // 쿼리를 설정
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
	Tree.parse(text);

	const tree = Tree.get_tree(); // 트리 가져오기
	console.log(tree);
	
	// tree?.rootNode.

	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	// 패턴 매칭이 되는 놈이 있으면 찾아서 없앤다는 마인드.

	let problems = 0;
	const diagnostics: Diagnostic[] = [];
	// 패턴에 맞는게 있으면 안됨!

	while ((m = pattern.exec(text)) && problems < 100) {
		problems++;
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: doc.positionAt(m.index),
				end: doc.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'web-lint'
		};
		diagnostics.push(diagnostic);
	}

	const captures = Languages.getQueryCaptures(lang_id, tree);
	console.log(captures);
	
	if(captures) // captures 객체가 실제로 존재할 때
	{
		for(const cap of captures)
		{
			const name = cap.name;
			const node = cap.node;
			let message = '';
			let severty : DiagnosticSeverity = DiagnosticSeverity.Warning;

			for(const lint of linter)
			{
				if(lint.target === name)
				{
					for(const l of lint.lints)
					{
						console.log(`${name}, ${l.node_name}`);
						if(name === l.node_name)
						{
							message = l.message;
							switch(l.type)
							{
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
							break;
						}
					}
					break;
				}
			}
			// 장기적으로는 딕셔너리 구조를 사용하는게 좋아보임...

			const diagnostic: Diagnostic = {
				severity: severty,
				range: {
					start:{
						character: node.startPosition.column,
						line : node.startPosition.row
					},
					end: {
						character: node.endPosition.column,
						line : node.endPosition.row
					}
				},
				message: message,
				source: 'web-lint'
			};
			diagnostics.push(diagnostic);
		}
	}

	console.log(lang_id);
	
	connection.sendDiagnostics({ uri: doc.uri, diagnostics });
});

// Listen on the connection
connection.listen();

// const createWebTreeSitter = async () => {
// 	const server = Uri.joinPath(context.extensionUri, 'dist/server.js');
// 	await Parser.init(); // 트리 시터 초기화

// 	const parser = new Parser();
// 	parser.

// 	const jslang = await Parser.Language.load('')
// }

// function treeinit() {
// 	try {
// 		await Parser.init({
// 			locateFile() {
// 				return initData.treeSitterWasmUri;
// 			}
// 		}); // 트리 시터 초기화
// 		console.log("트리 시터 초기화 성공!");
// 	}
// 	catch (e) {
// 		console.log(e);
// 	}
// 	try {
// 		await Languages.init(initData.lang_uri); // Language 초기화
// 		console.log("language 초기화 됨!");
// 	}
// 	catch (e) {
// 		console.log("랭귀지 : ", e);
// 	}
// 	let parser: Parser;

// 	try {
// 		parser = new Parser(); // 파서 생성
// 		console.log("현재 언어 : ", parser.getLanguage());
// 		parser.setLanguage(Languages.getLang('python'));
// 		console.log("현재 언어 : ", parser.getLanguage());
// 		console.log("파이썬 언어 지정");
// 		const tree = parser.parse(`p = []
// 	p2 = 13`);
// 		console.log("파싱 성공");
// 		console.log(tree.rootNode.toString()); // 파싱이 제대로 수행되는지 확인
// 	}
// 	catch (e) {
// 		console.log("파싱 실패", e);
// 	}
// }