import * as path from 'path';

/**
 * 利用可能な Chrome プロファイルを取得
 */
export function getAvailableChromeProfiles(): string[] {
    const basePath = getChromeProfilePath();
    if (!basePath) return [];

    return require('fs').readdirSync(basePath)
        .filter((dir: string) => dir.startsWith('Profile') || dir === 'Default')
        .map((dir: string) => path.join(basePath, dir));
}

/**
 * Chrome プロファイルのパスを取得
 */
function getChromeProfilePath(): string | undefined { 
    const homeDir = require('os').homedir();
    let profilePath: string;

    if (require('os').platform() === 'win32') {
        profilePath = path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data');
    } else if (require('os').platform() === 'darwin') {
        profilePath = path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome');
    } else {
        profilePath = path.join(homeDir, '.config', 'google-chrome');
    }

    return require('fs').existsSync(profilePath) ? profilePath : undefined;
}