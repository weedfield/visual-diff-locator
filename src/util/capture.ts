import * as puppeteer from 'puppeteer';
import * as path from 'path';

/**
 * 指定したURLのスクリーンショットを撮影し、保存する
 * @param browser Puppeteerのブラウザインスタンス
 * @param url キャプチャするページのURL
 * @param outputPath スクリーンショットの保存先
 */
async function takeScreenshot(browser: puppeteer.Browser, url: string, outputPath: string) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // ページの実際のサイズを取得
    const dimensions = await page.evaluate(() => ({
        width: document.body.scrollWidth,
        height: document.body.scrollHeight
    }));

    // ビューポートのサイズをページ全体に設定
    await page.setViewport(dimensions);
    await page.screenshot({ path: outputPath, fullPage: true });

    await page.close();
}

/**
 * デモ環境と本番環境のスクリーンショットを撮影
 * @param demoUrl デモ環境のURL
 * @param prodUrl 本番環境のURL
 * @param outputDir 画像の保存ディレクトリ
 */
export async function captureScreenshots(demoUrl: string, prodUrl: string, outputDir: string) {
    const demoScreenshotPath = path.join(outputDir, 'demo.png');
    const prodScreenshotPath = path.join(outputDir, 'prod.png');

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null
    });

    try {
        await Promise.all([
            takeScreenshot(browser, demoUrl, demoScreenshotPath),
            takeScreenshot(browser, prodUrl, prodScreenshotPath)
        ]);
    } finally {
        await browser.close(); 
    }

    return { demoScreenshot: demoScreenshotPath, prodScreenshot: prodScreenshotPath };
}