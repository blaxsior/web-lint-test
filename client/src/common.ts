import * as vscode from 'vscode';

interface InitOptions {
	treeSitterWasmUri: string;
	lang_uri : Map<string,string>
}

export const getInitOptions = (context: vscode.ExtensionContext) => {
    const treeSitterWasmUri = vscode.Uri.joinPath(context.extensionUri,'wasm/tree-sitter.wasm');

    const paths = {
        c: 'wasm/tree-sitter-c.wasm',
        cpp:'wasm/tree-sitter-cpp.wasm',
        python:'wasm/tree-sitter-python.wasm',
        java:'wasm/tree-sitter-java.wasm'
    };

    const lang_uri = new Map<string,string>();

    for(let [lang, uri] of Object.entries(paths))
    {
        lang_uri.set(lang,uri);
    }

    return {
        treeSitterWasmUri,
        lang_uri
    };

}