/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { createConnection, BrowserMessageReader, BrowserMessageWriter, DiagnosticSeverity, Diagnostic } from 'vscode-languageserver/browser';

import { Color, ColorInformation, Range, InitializeParams, InitializeResult, ServerCapabilities, TextDocuments, ColorPresentation, TextEdit, TextDocumentIdentifier } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Languages } from './languages';
import { Tree } from './tree';

console.log('running server lsp-web-extension-sample');

/* browser specific setup code */

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
	console.log(initData.treeSitterWasmUri);

	await Tree.init(initData.treeSitterWasmUri); // 트리 시터 초기화
	await Languages.init(initData.lang_uri); // 언어 목록 초기화.

	Tree.attach_lang('python'); // 파이썬 장착...

	const capabilities: ServerCapabilities = {
		colorProvider: {} // provide a color provider
	};
	return { capabilities };
});

// 클라언트가 린트 바뀌었다고 메시지 보내면 해당 메시지 받아서 query를 전부 새로 만든다.
connection.onNotification('lint-config-change', (val) => {
	console.log(val);	
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

	const diagnostic: Diagnostic[] = [];
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