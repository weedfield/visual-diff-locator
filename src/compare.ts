import * as vscode from 'vscode';
import * as path from 'path';
import { getUrls } from './urlInput';
import { captureScreenshots } from './capture';
import { compareScreenshots } from './diff';
import { showDiffView } from './webview';
import { mkdirSync } from 'fs';

export async function startComparison(context: vscode.ExtensionContext) {
    const urls = await getUrls();
    if (!urls) { return; }

    // const outputDir = path.join(context.globalStorageUri.fsPath, 'visual-diff');
    // await vscode.workspace.fs.createDirectory(vscode.Uri.file(outputDir));

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath || __dirname;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]; // `YYYY-MM-DDTHH-MM-SS`
    const outputDir = path.join(workspaceFolder, 'screenshots', timestamp);
    mkdirSync(outputDir, { recursive: true });

    vscode.window.showInformationMessage('スクリーンショットを取得中...');
    const { demoScreenshot, prodScreenshot } = await captureScreenshots(urls.demoUrl, urls.prodUrl, outputDir);

    const diffPath = path.join(outputDir, 'diff.png');
    await compareScreenshots(demoScreenshot, prodScreenshot, diffPath);

    vscode.window.showInformationMessage('比較完了！結果を表示します。');
    showDiffView(context, diffPath);
}
