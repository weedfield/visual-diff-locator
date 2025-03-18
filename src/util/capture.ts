import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * 指定したURLのスクリーンショットを撮影し、保存する
 * @param browser Puppeteerのブラウザインスタンス
 * @param url キャプチャするページのURL
 * @param outputPath スクリーンショットの保存先
 * @param authCredentials 認証情報（オプション）
 * @param useManualLogin 手動ログインを使用する場合は true
 */
async function takeScreenshot(
    browser: puppeteer.Browser, 
    url: string, 
    outputPath: string, 
    authCredentials?: { username: string; password: string },
    useManualLogin: boolean = false
) {
    const page = await browser.newPage();

    if (authCredentials) {
        await page.authenticate(authCredentials);
    }

    try {
        if (useManualLogin) {
            try {
                // **認証エラーが出ても処理を継続できるように try-catch**
                await page.goto(url, { waitUntil: 'domcontentloaded' });
            } catch (error: any) {
                if (error.message.includes('ERR_INVALID_AUTH_CREDENTIALS')) {
                    console.warn('手動ログインを待機');
                } else {
                    throw error;
                }
            }
            
            // TODO: vscodeAPIの処理をこのファイルから除く

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

        // ページの実際のサイズを取得
        const dimensions = await page.evaluate(() => ({
            width: document.body.scrollWidth,
            height: document.body.scrollHeight
        }));

        // ビューポートのサイズをページ全体に設定
        await page.setViewport(dimensions);
        await page.screenshot({ path: outputPath, fullPage: true });
    } catch (error) {
        throw new Error(`スクリーンショット取得失敗: ${url} → ${outputPath}\n${error}`);
    } finally {
        await page.close();
    }
}

/**
 * デモ環境と本番環境のスクリーンショットを撮影
 * @param demoUrl デモ環境のURL
 * @param prodUrl 本番環境のURL
 * @param outputDir 画像の保存ディレクトリ
 * @param authCredentials 認証情報（オプション）
 * @param chromeProfile Chrome のプロファイルディレクトリ
 */
export async function captureScreenshots(
    demoUrl: string, 
    prodUrl: string, 
    outputDir: string, 
    authCredentials?: { username: string; password: string },
    useManualLogin: boolean = false,
    chromeProfile?: string
) {
    const demoScreenshotPath = path.join(outputDir, 'demo.png');
    const prodScreenshotPath = path.join(outputDir, 'prod.png');

    const launchOptions: puppeteer.LaunchOptions = {
        headless: !useManualLogin, 
        executablePath: puppeteer.executablePath(),
        defaultViewport: null, // デフォルトのViewportをoffにする
        args: ['--proxy-auto-detect'] // VPN や社内プロキシを継承
    };

    // **プロファイルが指定されている場合は適用**
    if (chromeProfile) {
        launchOptions.userDataDir = chromeProfile;
    }

    const browser = await puppeteer.launch(launchOptions);

    try {
        await Promise.all([
            takeScreenshot(browser, demoUrl, demoScreenshotPath, authCredentials, useManualLogin),
            takeScreenshot(browser, prodUrl, prodScreenshotPath, authCredentials, useManualLogin)
        ]);

        return { demoScreenshot: demoScreenshotPath, prodScreenshot: prodScreenshotPath };

    } finally {
        await browser.close();
    }
}