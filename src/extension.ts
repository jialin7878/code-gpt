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

async function explainCode(): Promise<string> {
  const code = getSelectedText();
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Explain this function:\n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
  });
  return output.data.choices[0].text;
}

async function writeDocumentation(): Promise<string> {
  const code = getSelectedText();
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Insert documentation for this function: \n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
  });
  return output.data.choices[0].text;
}

async function simplifyCode(): Promise<string> {
  const code = getSelectedText();
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Simplify this code: \n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
  });
  return output.data.choices[0].text;
}

async function standardiseCode(): Promise<string> {
  const code = getSelectedText();
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Rewrite this code based on language style guide: \n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
  });
  return output.data.choices[0].text;
}

async function generateTestcases(): Promise<string> {
  const code = getSelectedText();
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Generate testcases for this function: \n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
  });
  return output.data.choices[0].text;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "code-gpt" is now active!');

  // Create Webview
  const provider = new CodeGPTOutputView(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CodeGPTOutputView.viewType,
      provider
    )
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let explainCodeCommand = vscode.commands.registerCommand(
    "code-gpt.explainCode",
    async () => {
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to explain this code..."
      );
      const output = await explainCode();
      provider.displayOutput(output);
    }
  );

  let writeDocumentationCommand = vscode.commands.registerCommand(
    "code-gpt.writeDocumentation",
    async () => {
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to write documentation for this code..."
      );
      const output = await writeDocumentation();
      insertText(output);
    }
  );

  let simplifyCodeCommand = vscode.commands.registerCommand(
    "code-gpt.simplifyCode",
    async () => {
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to check for simplifications..."
      );
      const output = await simplifyCode();
      replaceText(output);
    }
  );

  let standardiseCodeCommand = vscode.commands.registerCommand(
    "code-gpt.standardiseCode",
    async () => {
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to rewrite code based on language style guide..."
      );
      const output = await standardiseCode();
      replaceText(output);
    }
  );

  let generateTestcasesCommand = vscode.commands.registerCommand(
    "code-gpt.generateTestcases",
    async () => {
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to generate testcases..."
      );
      const output = await generateTestcases();
      // TODO: display output
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

  public displayOutput(output: string) {
    if (this._view) {
      this._view.webview.postMessage({ value: output });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>ChatGPT</title>
			</head>
			<body>
        <div id="output">
        </div>
        <script src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}
