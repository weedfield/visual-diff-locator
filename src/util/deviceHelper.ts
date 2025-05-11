/**
 * 優先キーワードを使ってデバイス名を並び替え
 */
export function sortDevicesByKeyword(devices: string[], keywords: string[]): string[] {
  const prioritized = devices.filter(name =>
    keywords.some(k => name.toLowerCase().includes(k.toLowerCase()))
  );

  if (prioritized.length === 0) {
    console.warn('[VisualDiff] 優先キーワードにマッチするデバイスが見つかりません。アルファベット順で表示します。');
    return devices.sort();
  }

  const others = devices.filter(name => !prioritized.includes(name)).sort();
  return [...prioritized, ...others];
}