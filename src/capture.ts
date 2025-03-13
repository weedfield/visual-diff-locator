import puppeteer from 'puppeteer';
import * as path from 'path';

/**
 * 指定したURLのスクリーンショットを撮影し、保存する
 * @param url キャプチャするページのURL
 * @param outputPath スクリーンショットの保存先
 */
async function takeScreenshot(url: string, outputPath: string) {
    const browser = await puppeteer.launch({
        headless: true, 
        defaultViewport: null // デフォルトのビューポートを無効化
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // ページの実際のサイズを取得
    const dimensions = await page.evaluate(() => {
        return {
            width: document.body.scrollWidth,  // ページ全体の幅
            height: document.body.scrollHeight // ページ全体の高さ
        };
    });

    // ビューポートのサイズをページ全体に設定
    await page.setViewport({
        width: dimensions.width,
        height: dimensions.height
    });

    await page.screenshot({ path: outputPath, fullPage: true });

    await browser.close();
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

    await takeScreenshot(demoUrl, demoScreenshotPath);
    await takeScreenshot(prodUrl, prodScreenshotPath);

    return { demoScreenshot: demoScreenshotPath, prodScreenshot: prodScreenshotPath };
}
