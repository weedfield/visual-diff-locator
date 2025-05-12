import * as fs from 'fs';
import * as path from 'path';
import { Page } from 'puppeteer';

type BasicAuthStore = Record<string, { username: string; password: string }>;

function getBasicAuthPath(workspaceRoot: string) {
  return path.join(workspaceRoot, '.vscode', 'visual-diff', 'basic.json');
}

export async function applyBasicAuthIfAvailable(
  page: Page,
  url: string,
  workspaceRoot: string
): Promise<void> {
  try {
    const { hostname } = new URL(url);
    const authPath = getBasicAuthPath(workspaceRoot);
    if (!fs.existsSync(authPath)) return;

    const raw = fs.readFileSync(authPath, 'utf-8');
    const auths: BasicAuthStore = JSON.parse(raw);

    if (auths[hostname]) {
      const { username, password } = auths[hostname];
      await page.authenticate({ username, password });
      console.log(`[VisualDiff] Basic認証を適用: ${hostname}`);
    }
  } catch (err) {
    console.warn('[VisualDiff] Basic認証の適用に失敗:', err);
  }
}
