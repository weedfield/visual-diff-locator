import * as vscode from 'vscode';

export function showPixelDiffView(context: vscode.ExtensionContext, diffPath: string) {
  const panel = vscode.window.createWebviewPanel(
    'visualDiff',
    'Pixel Diff View',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  const diffImageUri = panel.webview.asWebviewUri(vscode.Uri.file(diffPath));

  panel.webview.html = getPixelDiffHtml(diffImageUri);
}

function getPixelDiffHtml(imageUri: vscode.Uri): string {
  const uri = imageUri.toString();

  return `
    <html>
      <head>
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${uri} vscode-resource:; style-src 'unsafe-inline';" />
        <style>
            body { padding: 0 20px; }
            img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <h2>比較結果</h2>
        <img src="${uri}" alt="Diff Image">
      </body>
    </html>
  `;
}
