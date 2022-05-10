import * as Parser from "web-tree-sitter";
import { Languages } from "./languages";

class Tree {
    private static _parser : Parser;
    private static _tree : Parser.Tree|null;

    static async init(uri : string)
    {
        await Parser.init({
			locateFile() {
				return uri;
			}
		});

        this._parser = new Parser(); // 파서 생성
    }

    // 트리 파싱
    static parse_tree(str: string)
    {
        if(this._tree)
        {
            this._tree = this._parser.parse(str, this._tree);
        }
        else {
            this._tree = this._parser.parse(str);
        }
    }

    //
    static attach_lang(lang_Id : string)
    {

        const lang = Languages.getLang(lang_Id);
        this._tree = null; // 트리 초기화
        // 동일 언어라도 현재 id 바뀌면 다른 부분이니까.

        this._parser.setLanguage(lang); // 언어 갈아 끼기
    }

    static get_tree() : Readonly<Tree|null> {
        return this._tree;
    }
}