import * as puppeteer from 'puppeteer';
import * as path from 'path';
import { applyCookies, saveCookies } from './cookieService';

/**
 * 指定したページのスクリーンショットを撮影し、保存する
 * @param page Puppeteerのページインスタンス
 * @param outputPath スクリーンショットの保存先
 */
async function takeScreenshot(page: puppeteer.Page, outputPath: string) {
  try {
    await page.screenshot({ path: outputPath, fullPage: true });
  } catch (error) {
    throw new Error(`スクリーンショット取得失敗: ${outputPath}\n${error}`);
  }
}

/**
 * デモ環境と本番環境のスクリーンショットを撮影
 * @param demoUrl デモ環境のURL
 * @param prodUrl 本番環境のURL
 * @param outputDir 画像の保存ディレクトリ
 * @param isManualShot 手動スクリーンショットフラグ
 * @param selectedDevice 使用するデバイス
 * @param workspaceRoot ワークスペースルートパス（Cookie保存のため）
 * @param waitForUser 任意でスクリーンショット前に待機処理を挟める（手動モード用）
 */
export async function captureScreenshots(
  demoUrl: string,
  prodUrl: string,
  outputDir: string,
  isManualShot: boolean,
  selectedDevice: puppeteer.Device,
  workspaceRoot: string,
  waitForUser?: () => Promise<void>
) {
  const demoScreenshotPath = path.join(outputDir, 'demo.png');
  const prodScreenshotPath = path.join(outputDir, 'prod.png');

  const launchOptions: puppeteer.LaunchOptions = {
    headless: !isManualShot,
    executablePath: puppeteer.executablePath(),
    defaultViewport: null,
    args: ['--proxy-auto-detect']
  };

  if (isManualShot && selectedDevice.viewport) {
    const { width, height } = selectedDevice.viewport;
    launchOptions.args?.push(`--window-size=${width},${height}`);
  }

  const browser = await puppeteer.launch(launchOptions);

  // puppeteer.launchで生成される about:blank ページを閉じる
  const pages = await browser.pages();
  if (pages.length === 1 && pages[0].url() === 'about:blank') {
    await pages[0].close();
  }

  try {
    const demoPage = await browser.newPage();
    const prodPage = await browser.newPage();

    await Promise.all([
      demoPage.emulate(selectedDevice),
      prodPage.emulate(selectedDevice)
    ]);

    await Promise.all([
      applyCookies(demoPage, workspaceRoot),
      applyCookies(prodPage, workspaceRoot)
    ]);

    await Promise.all([
      demoPage.goto(demoUrl, { waitUntil: 'networkidle2' }),
      prodPage.goto(prodUrl, { waitUntil: 'networkidle2' })
    ]);

    if (waitForUser) {
      await waitForUser();
    }

    await Promise.all([
      takeScreenshot(demoPage, demoScreenshotPath),
      takeScreenshot(prodPage, prodScreenshotPath)
    ]);

    if (isManualShot) {
      await saveCookies(demoPage, workspaceRoot);
    }

    return {
      demoScreenshot: demoScreenshotPath,
      prodScreenshot: prodScreenshotPath
    };
  } finally {
    await browser.close();
  }
}
