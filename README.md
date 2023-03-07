# web-lint-test

현재 문서는 [microsoft 에서 제공하는 예제](https://github.com/microsoft/vscode-extension-samples/tree/main/lsp-web-extension-sample/client/src)의 설정 및 구조를 활용하고 있습니다.
처음에는 예제의 설정을 사용하는 대신에 직접 client-server 모델을 구축하려고 했으나, 동일하게 코드를 작성해도 설정 차이로 인해 다른 결과가 나와 예제의 설정을 사용하게 되었습니다.

## 주요 라이브러리

### [web-tree-sitter](https://www.npmjs.com/package/web-tree-sitter)

web-tree-sitter 은 [tree-sitter](https://tree-sitter.github.io/tree-sitter/) 의 wasm 바인딩입니다.  
tree-sitter 라이브러리는 다양한 언어에 대한 파서를 제공하는 C 언어 기반의 파서 라이브러리로, 다양한 언어에 대한 파서(C, C++, Python, Java 등) 를 제공하고 있으며, [S-expression 형식의 쿼리](https://tree-sitter.github.io/tree-sitter/using-parsers#pattern-matching-with-queries) 를 이용하여 패턴 매칭도 수행할 수 있다는 특징이 있습니다.  
web-lint-test 에서는 wasm 바인딩에 기반한 web-tree-sitter을 이용하여 S-expression 기반의 패턴 매칭을 통해 lint 기능을 구현하고 있습니다.

## wasm 파일 추출

tree-sitter에서 제공하는 [특정 언어들에 대한 파서](https://tree-sitter.github.io/tree-sitter/#available-parsers)들은 기본적으로 wasm으로 작성되어 있지 않으므로, 이를 vscode.dev 에서 사용하기 위해서는 해당 코드들을 전부 wasm으로 변환해줘야 합니다. 변환 과정은 다음 링크를 참고하세요.

https://github.com/CreatCodeBuild/tgde/blob/master/tree-sitter-gsql/readme.md

혹은 제 [블로그](https://blaxsior-repository.tistory.com/123)를 참고할 수 있습니다.

현재 문서는 **리눅스** 환경 기준 emscripten 라이브러리를 설치하는 방법을 설명하고 있으나, [emscripten 공식 github page](https://github.com/emscripten-core/emsdk) 에서 다른 환경에서의 설치 방법을 볼 수 있습니다.

1. ```npm install tree-sitter- ~``` 형태로 구성된, 자신이 원하는 파서들을 npm에서 다운로드.
2. ```npm install tree-sitter-cli```
3. 다음 코드를 실행하여 emscripten 설치

    ```shell
    git clone https://github.com/emscripten-core/emsdk.git emsdk
    cd emsdk
    git checkout 2.0.17 # 2.0.17 버전으로 이동
    ./emsdk install latest # 최신버전 설치
    ./emsdk activate latest # 최신 버전 activate
    source ./emsdk_env.sh # 잠깐 환경변수에 emcc 등록

    emcc --version # emscripten 라이브러리가 설치되어 있는지 볼 수 있음!
    ```
4. ```npx tree-sitter build-wasm node_modules/tree-sitter- ~```

### wasm 을 추출하는데 emscripten 2.0.17 버전을 사용하는 이유

web-tree-sitter 문서가 작성된 시점은 2022년 5월 중순 기준으로 2020년 12월이 마지막입니다. 해당 시점 이후로 emscripten 은 버전업을 거쳤는데, 버전업 된 emscripten 을 이용하여 tree-sitter parser들을 wasm 컴파일하면 버전 차이로 인한 오류가 발생합니다. 따라서 이 문서가 작성되는 시점에서는 web-tree-sitter 공식문서가 작성된 시점에 사용되었던 emscripten 2.0.17 버전을 이용해야만 제대로 된 동작을 기대할 수 있습니다.

## 확장 추가 방법
1. 현재 문서를 클론.
2. ```npm run install```
3. ```npm run watch```
4. 별개의 터미널에서 ```npx serve --cors -l 5000```
5. 별개의 터미널에서 ```npx localtunnel -p 5000``` 후 터미널에 표시된 주소로 들어가 버튼 클릭
6. [vscode.dev](https://vscode.dev) 로 이동
7. ```ctrl + shift + p``` 후  ```Install web extension``` 입력
8. localtunnel에서 표시된 주소를 7에서 뜬 창에 입력
9. 확장 추가 성공!

## 지원하는 명령어
명령은 ```ctrl + shift + p``` 를 입력하여 실행할 수 있다.
- ```Load Lint``` : vscode.globalState 상에 기록된 lint 설정을 불러온다.
- ```Set Lint``` : vscode.globalState 에 언어별로 lint 설정을 기록해둔다.

## 확장이 활성화되는 시점

```
activationEvents": [
        "onLanguage:python",
        "onLanguage:c",
        "onLanguage:cpp",
        "onLanguage:java",
        "onCommand:web-lint.setlint",
        "onCommand:web-lint.loadlint"
    ]  
```
c, cpp, java, python 확장자의 파일을 열거나, ```Set Lint``` / ```Load Lint``` 명령 수행

## linter 실행 방법

위 언급된 확장자의 파일을 열면, 일정 시간이 지난 후 준비가 되었다는 메시지가 출력된다.  
해당 시점 이후 ```Set Lint``` 또는 ```Load Lint``` 명령을 이용하여 lint 들을 입력한다.  
이후 시점부터 Problem tab (```ctrl + shift + m```) 및 밑줄 등을 통해 lint의 동작을 볼 수 있다. 

## lint 입력 포맷

현재 확장에서 lint 입력 포맷은 다음과 같습니다.
```typescript
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
```
json에는 ``` ILangLint[]``` 형식으로 각 lint 가 입력됩니다.
- type : server의 DiagnosticSeverity 와 대응되며, 어떤 종류의 lint인지 알려줍니다.
- message : lint 에 대한 메시지입니다.
- query : 해당 lint rule 에 대한 S-expression 형태의 쿼리로, [tree-sitter 사이트](https://tree-sitter.github.io/tree-sitter/using-parsers#pattern-matching-with-queries)를 참조하세요.
- node_name : 쿼리에서 캡처되는 lint rule 의 이름으로, query 상에 지정한 이름과 동일해야 합니다.

예시는 test.json에 입력되어 있습니다.  
  
현재 프로젝트와 관련된 보고서는 [여기](https://github.com/blaxsior/web-lint-test/blob/master/docs/%EC%B5%9C%EC%A2%85%EB%B3%B4%EA%B3%A0%EC%84%9C.pdf)를 참고해주세요.
