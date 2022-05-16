export interface ILint {
    /**메시지 타입 */ 
    type : 'error'|'hint'|'information'|'warning'; 
    /**출력할 메시지 */  
    message: string;
    /**tree-sitter query에 대응되는 쿼리 */     
    query: string;
    /** query에서 잡히는 이름. 해당 이름을 기반으로 나중에 동작하며, 쿼리상의 이름과 같아야 함*/ 
    node_name : string;
}

export interface ILangLint {
    /** 타겟이 되는 언어 */
    target : string;
    
    lints : ILint[];
}