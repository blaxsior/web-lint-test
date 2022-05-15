import * as Parser from "web-tree-sitter";
import { Languages } from "./languages";

export class Tree {
    private static _parser: Parser;
    private static _tree: Parser.Tree | null;
    private static _langid: string;

    static async init(uri: string) // 트리시터 초기화
    {
        await Parser.init({
            locateFile() {
                return uri;
            }
        });

        this._parser = new Parser(); // 파서 생성 
    }

    // 트리 파싱
    static parse(str: string) {
        // if(this._tree) // 트리 이미 있으면 해당 트리 사용
        // {
        //     this._tree = this._parser.parse(str, this._tree);
        // }
        // else { // 없으면 그냥 초기화
        this._tree = this._parser.parse(str);
        // }
    }

    // 언어 붙이기
    static attach_lang(lang_Id: string) {
        // if(lang_Id != this._langid)
        // {
        const lang = Languages.getLang(lang_Id);
        this.clear_tree(); // 트리 초기화
        this._parser.setLanguage(lang); // 언어 갈아 끼기
        // }
        // 같으면 여기서 초기화하는거 아님.
    }

    static get_tree() {
        return this._tree;
    }

    static clear_tree() {
        this._tree = null; // 트리 초기화
    }
}