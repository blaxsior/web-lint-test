/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { createConnection, BrowserMessageReader, BrowserMessageWriter, DiagnosticSeverity, Diagnostic } from 'vscode-languageserver/browser';

import { Color, ColorInformation, Range, InitializeParams, InitializeResult, ServerCapabilities, TextDocuments, ColorPresentation, TextEdit, TextDocumentIdentifier } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as Parser from 'web-tree-sitter';
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

// Track open, change and close text document events
const documents = new TextDocuments(TextDocument);
documents.listen(connection);
// Register providers

connection.onDocumentColor(params => getColorInformation(params.textDocument));
connection.onColorPresentation(params => getColorPresentation(params.color, params.range));

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

	let problems = 0;
	const diagnostics: Diagnostic[] = [];
	// 패턴에 맞는게 있으면 안됨!
	while ((m = pattern.exec(text)) && problems) {
		problems++;
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: doc.positionAt(m.index),
				end: doc.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'ex'
		};
		diagnostics.push(diagnostic);
	}

	connection.sendDiagnostics({ uri: doc.uri, diagnostics });
});

// Listen on the connection
connection.listen();

const colorRegExp = /#([0-9A-Fa-f]{6})/g;

function getColorInformation(textDocument: TextDocumentIdentifier) {
	const colorInfos: ColorInformation[] = [];

	const document = documents.get(textDocument.uri);
	if (document) {
		const text = document.getText();

		colorRegExp.lastIndex = 0;
		let match;
		while ((match = colorRegExp.exec(text)) != null) {
			const offset = match.index;
			const length = match[0].length;

			const range = Range.create(document.positionAt(offset), document.positionAt(offset + length));
			const color = parseColor(text, offset);
			colorInfos.push({ color, range });
		}
	}

	return colorInfos;
}


function getColorPresentation(color: Color, range: Range) {
	const result: ColorPresentation[] = [];
	const red256 = Math.round(color.red * 255), green256 = Math.round(color.green * 255), blue256 = Math.round(color.blue * 255);

	function toTwoDigitHex(n: number): string {
		const r = n.toString(16);
		return r.length !== 2 ? '0' + r : r;
	}

	const label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}`;
	result.push({ label: label, textEdit: TextEdit.replace(range, label) });

	return result;
}


const enum CharCode {
	Digit0 = 48,
	Digit9 = 57,

	A = 65,
	F = 70,

	a = 97,
	f = 102,
}

function parseHexDigit(charCode: CharCode): number {
	if (charCode >= CharCode.Digit0 && charCode <= CharCode.Digit9) {
		return charCode - CharCode.Digit0;
	}
	if (charCode >= CharCode.A && charCode <= CharCode.F) {
		return charCode - CharCode.A + 10;
	}
	if (charCode >= CharCode.a && charCode <= CharCode.f) {
		return charCode - CharCode.a + 10;
	}
	return 0;
}
function parseColor(content: string, offset: number): Color {
	const r = (16 * parseHexDigit(content.charCodeAt(offset + 1)) + parseHexDigit(content.charCodeAt(offset + 2))) / 255;
	const g = (16 * parseHexDigit(content.charCodeAt(offset + 3)) + parseHexDigit(content.charCodeAt(offset + 4))) / 255;
	const b = (16 * parseHexDigit(content.charCodeAt(offset + 5)) + parseHexDigit(content.charCodeAt(offset + 6))) / 255;
	return Color.create(r, g, b, 1);
}


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