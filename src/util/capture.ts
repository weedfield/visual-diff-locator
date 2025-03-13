import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

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
 * ログイン済みCookieがあれば適用する
 */
async function applyCookiesIfAvailable(page: puppeteer.Page) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspaceRoot) return;

  const cookiePath = path.join(workspaceRoot, '.vscode', 'visual-diff', 'cookies.json');

  if (fs.existsSync(cookiePath)) {
    try {
      const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf-8'));
      await page.setCookie(...cookies);
      console.log('[Visual Diff] Cookie を適用しました:', cookiePath);
    } catch (error) {
      console.warn('[Visual Diff] Cookie の読み込みに失敗しました:', error);
    }
  }
}

/**
 * 現在のCookieを保存する（手動ログイン後）
 */
async function saveCookiesIfNeeded(page: puppeteer.Page) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspaceRoot) return;

  const dir = path.join(workspaceRoot, '.vscode', 'visual-diff');
  const file = path.join(dir, 'cookies.json');

  try {
    fs.mkdirSync(dir, { recursive: true });
    const cookies = await page.cookies();
    fs.writeFileSync(file, JSON.stringify(cookies, null, 2), 'utf-8');
    console.log('[Visual Diff] Cookie を保存しました:', file);
  } catch (error) {
    console.warn('[Visual Diff] Cookie の保存に失敗しました:', error);
  }
}

/**
 * デモ環境と本番環境のスクリーンショットを撮影
 * @param demoUrl デモ環境のURL
 * @param prodUrl 本番環境のURL
 * @param outputDir 画像の保存ディレクトリ
 * @param isManualShot 手動スクリーンショットフラグ
 * @param selectedDevice 使用するデバイス
 * @param waitForUser 任意でスクリーンショット前に待機処理を挟める（手動モード用）
 */
export async function captureScreenshots(
  demoUrl: string,
  prodUrl: string,
  outputDir: string,
  isManualShot: boolean,
  selectedDevice: puppeteer.Device,
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
      applyCookiesIfAvailable(demoPage),
      applyCookiesIfAvailable(prodPage)
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

    // ✅ 手動モード時のみCookie保存（ログインした場合）
    if (isManualShot) {
      await saveCookiesIfNeeded(demoPage);
    }

    return { demoScreenshot: demoScreenshotPath, prodScreenshot: prodScreenshotPath };
  } finally {
    await browser.close();
  }
}
