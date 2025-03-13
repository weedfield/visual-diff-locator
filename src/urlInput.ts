import * as vscode from 'vscode';

export async function getUrls(): Promise<{ demoUrl: string, prodUrl: string } | null> {
    const demoUrl = await vscode.window.showInputBox({ prompt: 'デモ環境のURLを入力', placeHolder: 'http://localhost:3000' });
    if (!demoUrl) { return null; }

    const prodUrl = await vscode.window.showInputBox({ prompt: '本番環境のURLを入力', placeHolder: 'https://example.com' });
    if (!prodUrl) { return null; }

    return { demoUrl, prodUrl };
}
