import * as puppeteer from 'puppeteer';

/**
 * 指定した URL にアクセスし、認証が必要かを確認する
 * @param url チェックする URL
 * @returns Basic 認証が必要なら true、不要なら false
 */
export async function isAuthenticationRequired(url: string): Promise<boolean> {
    const browser = await puppeteer.launch({
        headless: true, 
        args: ['--proxy-auto-detect'] // VPN や社内プロキシを継承
    });

    const page = await browser.newPage();
    let requiresAuth = false;

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

    } catch (error: any) {
        if (error.message.includes('net::ERR_INVALID_AUTH_CREDENTIALS')) {
            console.log(`Basic 認証が必要: ${url}`);
            requiresAuth = true;
        } else {
            console.error(`URL チェック中にエラー発生: ${url}`, error);
        }
    } finally {
        await browser.close();
    }

    return requiresAuth;
}
