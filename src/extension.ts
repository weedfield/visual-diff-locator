import * as vscode from 'vscode';
import * as path from 'path';
import { captureScreenshots } from './util/capture';
import { compareScreenshots } from './util/diff';
import { showPixelDiffView } from './webview/pixelDiff';
import { showOverlayView } from './webview/overlay';
import { mkdirSync } from 'fs';
import * as puppeteer from 'puppeteer';
import { DeviceCategory } from './types';
import { CUSTOM_DEVICES } from './config/devices';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('visual-diff-locator.start', async () => {
        try {
            await startComparison(context);
        } catch (error) {
            vscode.window.showErrorMessage('比較処理に失敗しました。');
            console.error('startComparison 実行中にエラー:', error);
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
        vscode.window.showErrorMessage('URL が入力されていません。');
        return;
    }

    const isManualShot = await chooseScreenshotMode();
    if (isManualShot === undefined) {
        vscode.window.showErrorMessage('モード選択がキャンセルされました。');
        return;
    }

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

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath || __dirname;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const outputDir = path.join(workspaceFolder, 'screenshots', timestamp);
    mkdirSync(outputDir, { recursive: true });

    // 手動モードの場合の待機関数
    const waitForUser = isManualShot
        ? async () => {
            const response = await vscode.window.showInformationMessage(
                'スクリーンショットを撮影する準備ができたら「OK」を押してください。', 'OK'
            );
            if (!response) {
                throw new Error('スクリーンショットの撮影がキャンセルされました。');
            }
        }
        : undefined;

    vscode.window.showInformationMessage(`スクリーンショットを取得中... (デバイス: ${selectedDevice})`);

    const { demoScreenshot, prodScreenshot } = await captureScreenshots(
        urls.demoUrl,
        urls.prodUrl,
        outputDir,
        isManualShot,
        selectedDevice,
        waitForUser
    );

    const diffPath = path.join(outputDir, 'diff.png');
    await compareScreenshots(demoScreenshot, prodScreenshot, diffPath);

    vscode.window.showInformationMessage('比較完了！結果を表示します。');

    await Promise.all([
        showPixelDiffView(context, diffPath),
        showOverlayView(context, demoScreenshot, prodScreenshot)
    ]);
}

/**
 * スクリーンショット取得方法の選択
 */
async function chooseScreenshotMode(): Promise<boolean | undefined> {
    const options = ['自動で撮影する', '手動で撮影する'];
    const selected = await vscode.window.showQuickPick(options, { placeHolder: 'スクリーンショットの撮影方法を選択してください' });
    if (selected === '自動で撮影する') { return false; }
    if (selected === '手動で撮影する') { return true; }
    return undefined;
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
    const allDevices = CUSTOM_DEVICES[category];
    const allNames = Object.keys(allDevices);

    const keywords = ['iPhone', 'Pixel'];
    const sortedNames = sortDevicesByKeyword(allNames, keywords);

    const selectedDeviceName = await vscode.window.showQuickPick(sortedNames, {
        placeHolder: 'デバイスを選択してください'
    });

    if (!selectedDeviceName) { return undefined; };
    return allDevices[selectedDeviceName];
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
 * デバイスの優先表示
 */
function sortDevicesByKeyword(devices: string[], keywords: string[]): string[] {
    const prioritized = devices.filter(name =>
        keywords.some(k => name.toLowerCase().includes(k.toLowerCase()))
    );

    if (prioritized.length === 0) {
        console.warn('[VisualDiff] 優先キーワードにマッチするデバイスが見つかりませんでした。アルファベット順で表示します。');
        return devices.sort();
    }

    const others = devices.filter(name => !prioritized.includes(name)).sort();
    return [...prioritized, ...others];
}

