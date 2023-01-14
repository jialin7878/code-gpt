// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config({ path: __dirname + "/../.env" });

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const MODEL = "text-davinci-003";
const MAX_OPENAI_TOKENS = 200;

function getSelectedText(): string {
  const editor = vscode.window.activeTextEditor;
  const selectedText = editor?.document.getText(editor.selection);
  // Should not be undefined
  return selectedText!;
}

// inserts input text before current line
function insertText(text: string) {
  console.log(text);
  const editor = vscode.window.activeTextEditor;
  const startPosition = editor?.selection.start;
  const startLine = editor?.document.lineAt(startPosition!).lineNumber;
  editor?.edit((editBuilder) => {
    editBuilder.insert(new vscode.Position(startLine!, 0), "\n" + text + "\n");
  });
}

// replace selection with input text
function replaceText(text: string) {
  const editor = vscode.window.activeTextEditor;
  editor?.edit((editBuilder) => {
    editBuilder.replace(editor?.selection, text);
  });
}

async function explainCode(code: string): Promise<string> {  
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Explain this function:\n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
  });
  return output.data.choices[0].text.trim();
}

async function writeDocumentation(code: string): Promise<string> {
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Insert documentation for this function: \n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
  });
  return output.data.choices[0].text.trim();
}

async function simplifyCode(code: string): Promise<string> {
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Simplify this code: \n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
  });
  return output.data.choices[0].text.trim();
}

async function standardiseCode(code: string): Promise<string> {
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Rewrite this code based on language style guide: \n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
  });
  return output.data.choices[0].text.trim();
}

async function generateTestcases(code: string): Promise<string> {
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Generate testcases for this function: \n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
  });
  return output.data.choices[0].text.trim();
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "code-gpt" is now active!');

  // Create Webview
  const provider = new CodeGPTOutputView(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CodeGPTOutputView.viewType,
      provider
    )
  );

  let explainCodeCommand = vscode.commands.registerCommand(
    "code-gpt.explainCode",
    async () => {
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to explain this code..."
      );
      const code = getSelectedText();
      const output = (await explainCode(code)).trim();
      provider.displayOutput(
        "The explanation for the code is:",
        code,
        output
      );
    }
  );

  let writeDocumentationCommand = vscode.commands.registerCommand(
    "code-gpt.writeDocumentation",
    async () => {
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to write documentation for this code..."
      );
      const code = getSelectedText();
      const output = await writeDocumentation(code);
      insertText(output);
    }
  );

  let simplifyCodeCommand = vscode.commands.registerCommand(
    "code-gpt.simplifyCode",
    async () => {
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to check for simplifications..."
      );
      const code = getSelectedText();
      const output = await simplifyCode(code);
      replaceText(output);
    }
  );

  let standardiseCodeCommand = vscode.commands.registerCommand(
    "code-gpt.standardiseCode",
    async () => {
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to rewrite code based on language style guide..."
      );
      const code = getSelectedText();
      const output = await standardiseCode(code);
      replaceText(output);
    }
  );

  let generateTestcasesCommand = vscode.commands.registerCommand(
    "code-gpt.generateTestcases",
    async () => {
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to generate testcases..."
      );
      const code = getSelectedText();
      const output = await generateTestcases(code);
      provider.displayOutput(
        "Testcases generated for this function are:",
        code,
        output
      );
    }
  );

  context.subscriptions.push(
    explainCodeCommand,
    writeDocumentationCommand,
    simplifyCodeCommand,
    standardiseCodeCommand,
    generateTestcasesCommand
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

class CodeGPTOutputView implements vscode.WebviewViewProvider {
  public static readonly viewType = "codegpt.output";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  public displayOutput(title: string, code: string, output: string) {
    if (this._view) {
      this._view.webview.postMessage(
        {
          title: title,
          code: code,
          output: output
        }
      );
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
    );

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleMainUri}" rel="stylesheet">
				<title>CodeGPT</title>
			</head>
			<body>
        <div class="main">
          <h3 class="title">Hi, I am ChatGPT.</h3>
          <hr/>
          <div id="output">
          </div>
        </div>
        <script src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}
