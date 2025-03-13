import * as vscode from 'vscode';
import * as fs from 'fs';

export function showDiffView(context: vscode.ExtensionContext, diffPath: string) {
    const panel = vscode.window.createWebviewPanel(
        'visualDiff',
        'Visual Diff Result',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    const imageData = fs.readFileSync(diffPath).toString('base64');

    panel.webview.html = `
        <html>
            <body>
                <h2>比較結果</h2>
                <img src="data:image/png;base64,${imageData}" style="width: 100%;">
            </body>
        </html>
    `;
}
