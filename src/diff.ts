import * as fs from "fs";
import { PNG } from "pngjs";

/**
 * 非同期で PNG 画像を読み込む
 * @param filePath 読み込む画像のパス
 * @returns PNG インスタンス
 */
function loadPng(filePath: string): Promise<PNG> {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(new PNG())
      .on("parsed", function () {
        resolve(this);
      })
      .on("error", reject);
  });
}

/**
 * PNG 画像をファイルに非同期で保存する
 * @param png PNG インスタンス
 * @param filePath 保存するファイルのパス
 */
function savePng(png: PNG, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    png.pack().pipe(fs.createWriteStream(filePath)).on("finish", resolve).on("error", reject);
  });
}

/**
 * 小さい画像の下部に透明な余白を追加し、縦幅を揃える
 * @param img1 画像1
 * @param img2 画像2
 * @returns 縦幅を統一した画像オブジェクト
 */
function alignImages(img1: PNG, img2: PNG): { img1: PNG; img2: PNG } {
  const width = img1.width; // TODO: 横幅も動的に統一できるようにする?
  const height = Math.max(img1.height, img2.height);  

  const createAlignedImage = (src: PNG): PNG => {
    const aligned = new PNG({ width, height });
    aligned.data.fill(0); // 背景を透明化
    const copyWidth = Math.min(src.width, width);
    const copyHeight = Math.min(src.height, height);

    src.bitblt(aligned, 0, 0, copyWidth, copyHeight, 0, 0); 
    return aligned;
  };

  return { img1: createAlignedImage(img1), img2: createAlignedImage(img2) };
}

/**
 * 画像の差分を比較し、結果を保存する
 * @param demoPath デモ環境のスクリーンショット
 * @param prodPath 本番環境のスクリーンショット
 * @param outputPath 差分画像の保存先
 * @returns 差分画像のパス
 */
export async function compareScreenshots(demoPath: string, prodPath: string, outputPath: string): Promise<string> {
const { default: pixelmatch } = await import('pixelmatch'); // TODO: import周りを修正する

  try {
    const [img1, img2] = await Promise.all([loadPng(demoPath), loadPng(prodPath)]);

    // 画像サイズを統一
    const { img1: alignedImg1, img2: alignedImg2 } = alignImages(img1, img2);
    const { width, height } = alignedImg1;

    // 差分画像を生成
    const diff = new PNG({ width, height });
    pixelmatch(alignedImg1.data, alignedImg2.data, diff.data, width, height, {
      threshold: 0.1, 
      diffColor: [255, 0, 0], // 変更箇所を赤色で強調
      diffColorAlt: [0, 255, 0], // 追加部分を緑色で強調
    });

    // 結果を保存
    await savePng(diff, outputPath);
    return outputPath;
  } catch (error) {
    console.error("画像比較中にエラーが発生しました:", error);
    throw error;
  }
}
