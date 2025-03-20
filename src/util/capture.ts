import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as vscode from 'vscode';

export type DeviceCategory = 'PC' | 'Mobile';
export type DeviceList = Record<string, puppeteer.Device>;

export const CUSTOM_DEVICES: Record<DeviceCategory, DeviceList> = {
    PC: {
        'Desktop Default': {
            name: 'Desktop PC',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            viewport: {
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
                isMobile: false,
                hasTouch: false
            }
        } as puppeteer.Device
    },
    Mobile: {
        ...puppeteer.KnownDevices
    }
};

/**
 * 指定したURLのスクリーンショットを撮影し、保存する
 * @param page Puppeteerのページインスタンス
 * @param url キャプチャするページのURL
 * @param outputPath スクリーンショットの保存先
 * @param useManualLogin 手動ログインを使用する場合は true
 * @param authCredentials 認証情報（オプション）
 */
async function takeScreenshot(
    page: puppeteer.Page,
    url: string,
    outputPath: string,
    useManualLogin: boolean = false,
    authCredentials?: { username: string; password: string }
) {
    if (authCredentials) {
        await page.authenticate(authCredentials);
    }

    try {
        if (useManualLogin) {
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded' });
            } catch (error: any) {
                if (error.message.includes('ERR_INVALID_AUTH_CREDENTIALS')) {
                    console.warn('手動ログインを待機');
                } else {
                    throw error;
                }
            }

            vscode.window.showInformationMessage('手動でログインを完了したら「OK」を押してください。');

            await new Promise<void>((resolve) => {
                const interval = setInterval(async () => {
                    const response = await vscode.window.showInformationMessage(
                        'ログインが完了しましたか？', 'はい'
                    );
                    if (response === 'はい') {
                        clearInterval(interval);
                        resolve();
                    }
                }, 3000);
            });
        } else {
            await page.goto(url, { waitUntil: 'networkidle2' });
        }

        const dimensions = await page.evaluate(() => ({
            width: document.body.scrollWidth,
            height: document.body.scrollHeight
        }));

        await page.setViewport(dimensions);
        await page.screenshot({ path: outputPath, fullPage: true });
    } catch (error) {
        throw new Error(`スクリーンショット取得失敗: ${url} → ${outputPath}\n${error}`);
    }
}

/**
 * デモ環境と本番環境のスクリーンショットを撮影
 * @param demoUrl デモ環境のURL
 * @param prodUrl 本番環境のURL
 * @param outputDir 画像の保存ディレクトリ
 * @param useManualLogin 手動ログインの有無
 * @param selectedDevice 使用するデバイス
 * @param authCredentials 認証情報（オプション）
 * @param chromeProfile Chrome のプロファイルディレクトリ
 */
export async function captureScreenshots(
    demoUrl: string,
    prodUrl: string,
    outputDir: string,
    useManualLogin: boolean = false,
    selectedDevice: puppeteer.Device,
    authCredentials?: { username: string; password: string },
    chromeProfile?: string,
) {
    const demoScreenshotPath = path.join(outputDir, 'demo.png');
    const prodScreenshotPath = path.join(outputDir, 'prod.png');

    const launchOptions: puppeteer.LaunchOptions = {
        headless: !useManualLogin,
        executablePath: puppeteer.executablePath(),
        defaultViewport: null,
        args: ['--proxy-auto-detect']
    };

    if (chromeProfile) {
        launchOptions.userDataDir = chromeProfile;
    }

    const browser = await puppeteer.launch(launchOptions);

    try {
        const page1 = await browser.newPage();
        const page2 = await browser.newPage();
        await Promise.all([page1.emulate(selectedDevice), page2.emulate(selectedDevice)]);

        await Promise.all([
            takeScreenshot(page1, demoUrl, demoScreenshotPath, useManualLogin, authCredentials),
            takeScreenshot(page2, prodUrl, prodScreenshotPath, useManualLogin, authCredentials)
        ]);

        return { demoScreenshot: demoScreenshotPath, prodScreenshot: prodScreenshotPath };

    } finally {
        await browser.close();
    }
}