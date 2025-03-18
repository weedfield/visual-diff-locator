import * as puppeteer from 'puppeteer';
import * as path from 'path';

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
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
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
 */
export async function captureScreenshots(
    demoUrl: string, 
    prodUrl: string, 
    outputDir: string, 
    authCredentials?: { username: string; password: string },
    useManualLogin: boolean = false
) {
    const demoScreenshotPath = path.join(outputDir, 'demo.png');
    const prodScreenshotPath = path.join(outputDir, 'prod.png');

    const browser = await puppeteer.launch({
        headless: !useManualLogin, 
        executablePath: puppeteer.executablePath(),
        defaultViewport: null, // デフォルトのViewportをoffにする
        args: ['--proxy-auto-detect'] // VPN や社内プロキシを継承
    });

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