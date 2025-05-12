import * as puppeteer from 'puppeteer';
import * as path from 'path';
import { applyCookies, saveCookies } from './cookieService';
import { applyBasicAuthIfAvailable } from './basicAuthService';

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
 * Basic認証が必要な場合に備えた goto のラッパー関数
 */
async function safeGotoWithFallback(
  page: puppeteer.Page,
  url: string
): Promise<void> {
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
  } catch (error: any) {
    if (
      error.message.includes('net::ERR_INVALID_AUTH_CREDENTIALS') ||
      error.message.includes('ERR_ACCESS_DENIED')
    ) {
      console.warn(`[Visual Diff] 認証エラーを検出しました: ${url}`);
      // 手動で認証できるように画面を保持
    } else {
      throw new Error(`ページ遷移エラー: ${url}\n${error}`);
    }
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
      applyBasicAuthIfAvailable(demoPage, demoUrl, workspaceRoot),
      applyBasicAuthIfAvailable(prodPage, prodUrl, workspaceRoot)
    ]);

    await Promise.all([
      safeGotoWithFallback(demoPage, demoUrl),
      safeGotoWithFallback(prodPage, prodUrl)
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
