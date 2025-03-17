import * as vscode from 'vscode';

export function showPixelDiffView(context: vscode.ExtensionContext, diffPath: string) {
    const panel = vscode.window.createWebviewPanel(
        'visualDiff',
        'Pixel Diff View',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    const diffImageUri = panel.webview.asWebviewUri(vscode.Uri.file(diffPath));

    panel.webview.html = `
        <html>
            <head>
                <style>
                    body { padding: 0 20px; }
                    img { max-width: 100%; height: auto; }
                </style>
            </head>
            <body>
                <h2>比較結果</h2>
                <img src="${diffImageUri}" alt="Diff Image">
            </body>
        </html>
    `;
}
