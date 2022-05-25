import * as Parser from 'web-tree-sitter';
import { ILint } from './lint';

export class Languages {
	private static readonly _languages = new Map<string, Parser.Language>();
	private static readonly _queries = new Map<string, Parser.Query[]>();
	private static _linter: Map<string, ILint[]>;
	/**
	 * wasm을 읽어서 각 언어에 대한 파서를 생성한다.
	 */
	public static async init(lang_uri: Map<string, string>) {
		for (const [lang, uri] of lang_uri) {
			console.log(uri);
			const tree_lang = await Parser.Language.load(uri);
			this._languages.set(lang, tree_lang);
			// console.log(this._languages.get(lang));
		} // language 들을 삽입한다.
	}

	/**
	 * 요청한 언어를 가져온다. 
	 */
	public static getLang(lang_Id: string) {
		const lang = this._languages.get(lang_Id);
		if (lang) {
			return lang;
		}
		else {
			console.warn(`There is no lang ${lang_Id}`);
			return null;
		}
	}

	/**
	 * 린터 객체를 설정한다.
	 */
	public static setLinter(linters: Map<string, ILint[]>) {
		this._linter = linters;
	}

	/**
	 * 린터 작업과 쿼리 작업 동시에 수행.
	 */
	public static setLintQueries(linters: Map<string, ILint[]>) {
		this.setLinter(linters);
		this.setQueries();
	}

	/**
	 * 쿼리를 지정한다.
	 */
	public static setQueries() {
		this._queries.clear(); // 이전에 있었던 내용을 모두 날린다.

		// console.log(this._linter);
		for (const [target, lints] of this._linter) {
			const queries: Parser.Query[] = [];

			const lang = this.getLang(target); // 언어 가져오기
			if (lang) {
				for (const lint_info of lints) {
					try {
						const query = lang.query(lint_info.query);
						queries.push(query);
					}
					catch(e) {
						console.log(e);
						continue;
					}
				}
				this._queries.set(target, queries);
			}
		}
	}
	/**
	 * 원하는 언어에 대한 쿼리 객체 반환.
	 * @param lang_Id 원하는 언어
	 */
	public static getQueries(lang_Id: string) {
		const query = this._queries.get(lang_Id);

		if (query) {
			return query;
		}
		else {
			this.setQueries(); // 쿼리 설정
			return this._queries.get(lang_Id);
		}
	}

	/**
	 * 설정된 쿼리 조건에 맞는 패턴을 반환
	 * @param lang_Id 원하는 언어
	 */
	public static getQueryCaptures(lang_Id: string, tree: Parser.Tree | null) {
		const queries = this.getQueries(lang_Id);
		const queryCaptures: Parser.QueryCapture[] = [];

		// 대응되는 쿼리와 트리가 존재할 때
		if (queries && tree) {
			// 각각의 쿼리에 대한 캡쳐 결과 삽입.
			for (const query of queries) {
				try {
					const qc = query.captures(tree.rootNode);
					queryCaptures.push(...qc); // 쿼리가 잘못될 수도 있음.
				}
				catch(e) {
					console.log(e);
				}
				
			}

			return queryCaptures;
		}
		else {
			return null;
		}
	}
}

// ,
//             {
//                 "type": "error",
//                 "message": "right = 0 인 binary operator 입니다.",
//                 "query": "(((binary_operator(_) @left(_) @right (#eq? @right 0) )@divide0) (#match? @divide0 \"/\")",
//                 "node_name": "divide0"
//             }