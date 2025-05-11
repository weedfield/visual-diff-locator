import * as fs from 'fs';
import * as path from 'path';
import { Page } from 'puppeteer';

/**
 * Cookie ファイルの保存パスを取得
 * @param workspaceRoot ワークスペースのルートディレクトリ
 */
function getCookieFilePath(workspaceRoot: string): string {
  return path.join(workspaceRoot, '.vscode', 'visual-diff', 'cookies.json');
}

/**
 * Cookie を Puppeteer ページに適用する
 * @param page 対象の Puppeteer ページ
 * @param workspaceRoot ワークスペースルートパス
 */
export async function applyCookies(
  page: Page,
  workspaceRoot: string
): Promise<void> {
  const cookiePath = getCookieFilePath(workspaceRoot);
  if (!fs.existsSync(cookiePath)) return;

  try {
    const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf-8'));
    await page.setCookie(...cookies);
    console.log('[Visual Diff] Cookie を適用:', cookiePath);
  } catch (error) {
    console.warn('[Visual Diff] Cookie の読み込みに失敗:', error);
  }
}

/**
 * 現在の Cookie を保存する（主に手動モードで使用）
 * @param page 対象の Puppeteer ページ
 * @param workspaceRoot ワークスペースルートパス
 */
export async function saveCookies(
  page: Page,
  workspaceRoot: string
): Promise<void> {
  const cookieDir = path.join(workspaceRoot, '.vscode', 'visual-diff');
  const cookiePath = getCookieFilePath(workspaceRoot);

  try {
    fs.mkdirSync(cookieDir, { recursive: true });
    const cookies = await page.cookies();
    fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2), 'utf-8');
    console.log('[Visual Diff] Cookie を保存:', cookiePath);
  } catch (error) {
    console.warn('[Visual Diff] Cookie の保存に失敗:', error);
  }
}
