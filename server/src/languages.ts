import * as Parser from 'web-tree-sitter';

export class Languages {
	private static readonly _languages = new Map<string, Parser.Language>();

	public static async init(lang_uri: Map<string,string>) {
		for(let [lang,uri] of lang_uri)
		{
			console.log(uri);
			const tree_lang = await Parser.Language.load(uri);
			this._languages.set(lang, tree_lang);
		} // language 들을 삽입한다.
	}
	/**
	 * 요청한 언어를 가져온다. 
	 */
	public static getLang (lang_Id : string) {
		let lang = this._languages.get(lang_Id);
		if (lang)
		{
			return lang;
		}
		else {
			console.warn(`There is no lang ${lang_Id}`);
			return undefined;
		}
	}
}