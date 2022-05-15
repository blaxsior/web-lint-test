import * as Parser from 'web-tree-sitter';
import { ILangLint } from './lint';
import { Tree } from './tree';

export class Languages {
	private static readonly _languages = new Map<string, Parser.Language>();
	private static readonly _queries = new Map<string, Parser.Query>();

	/**
	 * wasm을 읽어서 각 언어에 대한 파서를 생성한다.
	 */
	public static async init(lang_uri: Map<string,string>) {
		for(const [lang,uri] of lang_uri)
		{
			console.log(uri);
			const tree_lang = await Parser.Language.load(uri);
			this._languages.set(lang, tree_lang);
			console.log(this._languages.get(lang));
		} // language 들을 삽입한다.
	}

	/**
	 * 요청한 언어를 가져온다. 
	 */
	public static getLang (lang_Id : string) {
		const lang = this._languages.get(lang_Id);
		if (lang)
		{
			return lang;
		}
		else {
			console.warn(`There is no lang ${lang_Id}`);
			return null;
		}
	}

	/**
	 * 쿼리를 지정한다.
	 */
	public static setQueries(linters: ILangLint[]) {
		// this._queries.clear(); // 이전에 있었던 내용을 모두 날린다.
		console.log(linters);
		for(const linter of linters)
		{
			// 언어의 쿼리를 하나로 묶는다.
			const qs = linter.lints.reduce((before, lint) => before.concat(lint.query), '');
			const lang = this.getLang(linter.target);
			console.log(linter.target);
			console.log(lang);
			if(lang)
			{
				const query = lang.query(qs);
				console.log("query", query);

				this._queries.set(linter.target, query); // 쿼리 실제로 지정.
			}
		}
	}
	/**
	 * 원하는 언어에 대한 쿼리 객체 반환.
	 * @param lang_Id 원하는 언어
	 */
	public static getQuery(lang_Id: string)
	{
		const query = this._queries.get(lang_Id);
		if (query)
		{
			return query;
		}
		else {
			console.warn(`There is no query for language ${lang_Id}`);
			return null;
		}
	}
	/**
	 * 설정된 쿼리 조건에 맞는 패턴을 반환
	 * @param lang_Id 원하는 언어
	 */
	public static getQueryCaptures(lang_Id : string, tree: Parser.Tree|null)
	{
		const query = this.getQuery(lang_Id);
		console.log("query {}", query);
		console.log("tree {}", tree);
		
		if(query && tree) { // 쿼리와 트리가 모두 존재할 때
			const queryCaptures = query.captures(tree.rootNode);
			return queryCaptures;
		}
		else {
			console.log("쿼리와 트리 중 하나는 없다...");
			return null;
		}
	}
}