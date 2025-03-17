import * as vscode from 'vscode';
import * as path from 'path';
import { captureScreenshots } from './util/capture';
import { compareScreenshots } from './util/diff';
import { showPixelDiffView } from './webview/pixelDiff';
import { showOverlayView } from './webview/overlay';
import { mkdirSync } from 'fs';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('visual-diff-locator.start', async () => {
        try {
            await startComparison(context);
        } catch (error) {
            vscode.window.showErrorMessage(`${error}`);
            console.error(error);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

/**
 * スクリーンショットの比較と結果の表示
 * @param context VS Code 拡張のコンテキスト
 */
async function startComparison(context: vscode.ExtensionContext) {
    const urls = await getUrls();
    if (!urls) {
        vscode.window.showErrorMessage('URL が入力されていません。処理を中断します。');
        return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath || __dirname;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]; // `YYYY-MM-DDTHH-MM-SS`
    const outputDir = path.join(workspaceFolder, 'screenshots', timestamp);
    mkdirSync(outputDir, { recursive: true });

    try {
        vscode.window.showInformationMessage('スクリーンショットを取得中...');
        const { demoScreenshot, prodScreenshot } = await captureScreenshots(urls.demoUrl, urls.prodUrl, outputDir);

        const diffPath = path.join(outputDir, 'diff.png');
        await compareScreenshots(demoScreenshot, prodScreenshot, diffPath);

        vscode.window.showInformationMessage('比較完了！結果を表示します。');

        await Promise.all([
            showPixelDiffView(context, diffPath),
            showOverlayView(context, demoScreenshot, prodScreenshot)
        ]);

    } catch (error) {
        vscode.window.showErrorMessage(`${error}`);
        console.error(error);
    }
}

async function getUrls(): Promise<{ demoUrl: string, prodUrl: string } | null> {
    const demoUrl = await vscode.window.showInputBox({ prompt: 'デモ環境のURLを入力', placeHolder: 'http://localhost:3000' });
    if (!demoUrl) { return null; }

    const prodUrl = await vscode.window.showInputBox({ prompt: '本番環境のURLを入力', placeHolder: 'https://example.com' });
    if (!prodUrl) { return null; }

    return { demoUrl, prodUrl };
}