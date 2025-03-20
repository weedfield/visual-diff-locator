import * as vscode from 'vscode';
import * as path from 'path';
import { isAuthenticationRequired } from './util/authCheck';
import { captureScreenshots, CUSTOM_DEVICES, DeviceCategory } from './util/capture';
import { compareScreenshots } from './util/diff';
import { showPixelDiffView } from './webview/pixelDiff';
import { showOverlayView } from './webview/overlay';
import { getAvailableChromeProfiles } from './util/chromeProfile';
import { mkdirSync } from 'fs';
import * as puppeteer from 'puppeteer';

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

    let authCredentials: { username: string; password: string } | undefined;
    let useManualLogin = false;

    // **認証が必要かチェック**
    if (await isAuthenticationRequired(urls.demoUrl) || await isAuthenticationRequired(urls.prodUrl)) {
        const authMethod = await chooseAuthMethod();
        if (!authMethod) {
            vscode.window.showErrorMessage('認証方法の選択がキャンセルされました。');
            return;
        }

        if (authMethod === 'input') {
            authCredentials = await getAuthCredentials();
            if (!authCredentials) {
                vscode.window.showErrorMessage('認証情報の入力がキャンセルされました。');
                return;
            }
        } else if (authMethod === 'manual') {
            useManualLogin = true;
        }
    }

    // **Chrome プロファイルを選択**
    const chromeProfile = await selectChromeProfile();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath || __dirname;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]; // `YYYY-MM-DDTHH-MM-SS`
    const outputDir = path.join(workspaceFolder, 'screenshots', timestamp);
    mkdirSync(outputDir, { recursive: true });

    try {
        const selectedCategory = await chooseDeviceCategory();
        if (!selectedCategory) {
            vscode.window.showErrorMessage('デバイスカテゴリの選択がキャンセルされました。');
            return;
        }

        const selectedDevice = await chooseDevice(selectedCategory);
        if (!selectedDevice) {
            vscode.window.showErrorMessage('デバイス選択がキャンセルされました。');
            return;
        }

        vscode.window.showInformationMessage(`スクリーンショットを取得中... (デバイス: ${selectedDevice})`);
        const { demoScreenshot, prodScreenshot } = await captureScreenshots(
            urls.demoUrl, 
            urls.prodUrl, 
            outputDir, 
            useManualLogin, 
            selectedDevice,
            authCredentials, 
            chromeProfile, 
        );

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

/**
 * デバイスカテゴリを選択
 */
async function chooseDeviceCategory(): Promise<DeviceCategory | undefined> {
    const categories = Object.keys(CUSTOM_DEVICES);
    return await vscode.window.showQuickPick(categories, { placeHolder: 'PC または モバイル を選択してください' }) as DeviceCategory;
}

/**
 * 選択したカテゴリの中からデバイスを選択
 */
async function chooseDevice(category: DeviceCategory): Promise<puppeteer.Device | undefined> {
    const devices = Object.keys(CUSTOM_DEVICES[category]);
    const selectedDeviceName = await vscode.window.showQuickPick(devices, { placeHolder: 'デバイスを選択してください' });

    if (!selectedDeviceName) { return undefined; }

    const selectedDevice = CUSTOM_DEVICES[category][selectedDeviceName];

    if (!selectedDevice) {
        vscode.window.showErrorMessage(`選択されたデバイス (${selectedDeviceName}) が見つかりませんでした。`);
        return undefined;
    }

    return selectedDevice;
}


/**
 * URL の入力を受け取る
 */
async function getUrls(): Promise<{ demoUrl: string, prodUrl: string } | null> {
    const demoUrl = await vscode.window.showInputBox({ prompt: 'デモ環境のURLを入力', placeHolder: 'http://localhost:3000' });
    if (!demoUrl) { return null; }

    const prodUrl = await vscode.window.showInputBox({ prompt: '本番環境のURLを入力', placeHolder: 'https://example.com' });
    if (!prodUrl) { return null; }

    return { demoUrl, prodUrl };
}

/**
 * 認証方法を選択する（手動入力 or 自動ログイン）
 */
async function chooseAuthMethod(): Promise<'manual' | 'input' | undefined> {
    const options = ['認証情報を入力する', '手動でログインする'];
    const selected = await vscode.window.showQuickPick(options, { placeHolder: '認証方法を選択してください' });

    if (selected === '認証情報を入力する') { return 'input'; }; 
    if (selected === '手動でログインする') { return 'manual'; } ;
    return undefined;
}

/**
 * Basic 認証が必要な場合に認証情報を取得する
 */
async function getAuthCredentials(): Promise<{ username: string; password: string } | undefined> {
    const username = await vscode.window.showInputBox({ prompt: 'Basic 認証のユーザー名を入力' });
    if (!username) { return undefined; };

    const password = await vscode.window.showInputBox({ prompt: 'Basic 認証のパスワードを入力', password: true });
    if (!password) { return undefined; };

    return { username, password };
}

/**
 * Chrome プロファイルを選択する
 */
async function selectChromeProfile(): Promise<string | undefined> {
    const profiles = getAvailableChromeProfiles();
    if (profiles.length === 0) {
        vscode.window.showErrorMessage('Chrome のプロファイルが見つかりません。');
        return undefined;
    }

    return await vscode.window.showQuickPick(profiles, { placeHolder: '使用する Chrome プロファイルを選択' });
}
