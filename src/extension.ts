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
const MAX_OPENAI_TOKENS = 1000;
const TEMPERATURE = 0;

function getSelectedText(): string {
  const editor = vscode.window.activeTextEditor;
  const selectedText = editor?.document.getText(editor.selection);
  // Should not be undefined
  return selectedText!;
}

function getLanguageOfDocument(): string {
  const editor = vscode.window.activeTextEditor;
  const languageId = editor?.document.languageId;
  console.log(languageId);
  return languageId!;
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
    temperature: TEMPERATURE,
  });
  return output.data.choices[0].text.trim();
}

async function writeDocumentation(code: string): Promise<string> {
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Insert documentation for this function: \n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
    temperature: TEMPERATURE,
  });
  return output.data.choices[0].text.trim();
}

async function simplifyCode(code: string): Promise<string> {
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Simplify this code: \n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
    temperature: TEMPERATURE,
  });
  return output.data.choices[0].text.trim();
}

async function standardiseCode(
  code: string,
  language: string
): Promise<string> {
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: `Rewrite this code based on ${language} style guide:\n ${code}`,
    max_tokens: MAX_OPENAI_TOKENS,
    temperature: TEMPERATURE,
  });
  return output.data.choices[0].text.trim();
}

async function generateTestcases(code: string): Promise<string> {
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Generate testcases for this function: \n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
    temperature: TEMPERATURE,
  });
  return output.data.choices[0].text.trim();
}

async function analyzeTimeComplexity(code: string): Promise<string> {
  const output = await openai.createCompletion({
    model: MODEL,
    prompt: "Analyze the time complexity for this function: \n" + code,
    max_tokens: MAX_OPENAI_TOKENS,
    temperature: TEMPERATURE,
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
      provider,
      {
        webviewOptions: { retainContextWhenHidden: true },
      }
    )
  );

  let explainCodeCommand = vscode.commands.registerCommand(
    "code-gpt.explainCode",
    async () => {
      provider.show();
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to explain this code..."
      );
      provider.displayLoader();
      const code = getSelectedText();
      const output = (await explainCode(code)).trim();
      provider.displayOutput("The explanation for the code is:", code, output);
    }
  );

  let writeDocumentationCommand = vscode.commands.registerCommand(
    "code-gpt.writeDocumentation",
    async () => {
      provider.show();
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to write documentation for this code..."
      );
      provider.displayLoader();
      const code = getSelectedText();
      const output = await writeDocumentation(code);
      insertText(output);
      provider.displayModified();
    }
  );

  let simplifyCodeCommand = vscode.commands.registerCommand(
    "code-gpt.simplifyCode",
    async () => {
      provider.show();
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to check for simplifications..."
      );
      provider.displayLoader();
      const code = getSelectedText();
      const output = await simplifyCode(code);
      replaceText(output);
      provider.displayModified();
    }
  );

  let standardiseCodeCommand = vscode.commands.registerCommand(
    "code-gpt.standardiseCode",
    async () => {
      provider.show();
      const language = getLanguageOfDocument();
      vscode.window.showInformationMessage(
        `Pinging ChatGPT to rewrite code based on ${language} style guide...`
      );
      provider.displayLoader();
      const code = getSelectedText();
      const output = await standardiseCode(code, language);
      replaceText(output);
      provider.displayModified();
    }
  );

  let generateTestcasesCommand = vscode.commands.registerCommand(
    "code-gpt.generateTestcases",
    async () => {
      provider.show();
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to generate testcases..."
      );
      provider.displayLoader();
      const code = getSelectedText();
      const output = await generateTestcases(code);
      provider.displayOutput(
        "Testcases generated for this function are:",
        code,
        output
      );
    }
  );

  let analyzeTimeComplexityCommand = vscode.commands.registerCommand(
    "code-gpt.analyzeTimeComplexity",
    async () => {
      provider.show();
      vscode.window.showInformationMessage(
        "Pinging ChatGPT to analyze time complexity of this function..."
      );
      provider.displayLoader();
      const code = getSelectedText();
      const output = await analyzeTimeComplexity(code);
      provider.displayOutput(
        "The time complexity of this function is:",
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
    generateTestcasesCommand,
    analyzeTimeComplexityCommand
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
      this._view.webview.postMessage({
        type: "OUTPUT",
        title: title,
        code: code,
        output: output,
      });
    }
  }

  public displayLoader() {
    if (this._view) {
      this._view.webview.postMessage({
        type: "LOAD",
      });
    }
  }

  public displayModified() {
    if (this._view) {
      this._view.webview.postMessage({
        type: "MODIFIED",
      });
    }
  }

  public show() {
    this._view?.show();
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.css")
    );
    const loadingIconUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "static", "chatgpt_white.png")
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
          <div id="loader">
            <img src=${loadingIconUri}
              style="width: 40px; height: 40px;" 
              class="rotating"
            />
          </div>       
        </div>
        <script src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}
