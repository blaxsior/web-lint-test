import * as vscode from 'vscode';

interface InitOptions {
	treeSitterWasmUri: string;
	lang_uri : Map<string,string>
}

export const getInitOptions = (context: vscode.ExtensionContext) => {
    let _treeuri = vscode.Uri.joinPath(context.extensionUri,'wasm/tree-sitter.wasm');
    const treeSitterWasmUri = 'importScripts' in globalThis ? _treeuri.toString() :  _treeuri.fsPath;
    const paths = {
        c: 'wasm/tree-sitter-c.wasm',
        cpp:'wasm/tree-sitter-cpp.wasm',
        python:'wasm/tree-sitter-python.wasm',
        java:'wasm/tree-sitter-java.wasm'
    };

    const lang_uri = new Map<string,string>();

    for(let [lang, uri] of Object.entries(paths))
    {
        let pathuri = vscode.Uri.joinPath(context.extensionUri,uri);
        let str_uri = 'importScripts' in globalThis ? pathuri.toString() :  pathuri.fsPath
        lang_uri.set(lang,str_uri);
    }

    return {
        treeSitterWasmUri,
        lang_uri
    };

}