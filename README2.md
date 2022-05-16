# 명령 등록
```
"contributes": {
  "configuration": [
    {
      "id": "web lint",
      "title": "web lint",
      "properties": {
        "lsp-web-extension-sample.trace.server": {
          "type": "string",
          "scope": "window",
          "enum": [
            "off",
            "messages",
            "verbose"
          ],
          "default": "verbose",
          "description": "Traces the communication between VS Code and the lsp-web-extension-sample language server."
        }
      },
      "commands": [
        {
          "command": "web-lint.helloWorld",
          "title": "Hello World"
        }
      ]
    }
    
  ]
},
```

```
// client.activate 안에서.
let disposable2 = vscode.commands.registerCommand('web-lint.helloWorld', () => {
		vscode.window.showWarningMessage('Hello, World!');
	});
```

```
// 이벤트 등록
	"activationEvents": [
		"onLanguage:python",
		"onLanguage:c",
		"onLanguage:cpp",
		"onLanguage:java",
		"onCommand:web-lint.helloWorld"
	],
```