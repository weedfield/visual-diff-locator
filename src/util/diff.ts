import * as fs from "fs";
import { PNG } from "pngjs";

/**
 * PNG 画像を非同期で読み込む
 * @param filePath 読み込む画像のパス
 * @returns PNG インスタンス
 * @throws ファイルの読み込みに失敗した場合、エラーを投げる
 */
async function loadPng(filePath: string): Promise<PNG> {
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(new PNG())
            .on("parsed", function () {
                resolve(this);
            })
            .on("error", (error) => {
                reject(new Error(`画像の読み込み失敗: ${filePath}\n${error}`));
            });
    });
}

/**
 * PNG 画像を非同期で保存する
 * @param png PNG インスタンス
 * @param filePath 保存するファイルのパス
 * @throws ファイルの保存に失敗した場合、エラーを投げる
 */
async function savePng(png: PNG, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        png.pack()
            .pipe(fs.createWriteStream(filePath))
            .on("finish", resolve)
            .on("error", (error) => {
                reject(new Error(`画像の保存失敗: ${filePath}\n${error}`));
            });
    });
}

/**
 * 画像のサイズを統一し、比較可能な状態にする
 * @param img1 画像1
 * @param img2 画像2
 * @param unifyWidth 横幅も統一するか（デフォルト: true）
 * @returns 統一後の画像
 */
function alignImages(img1: PNG, img2: PNG, unifyWidth: boolean = true): { img1: PNG; img2: PNG } {
    const width = unifyWidth ? Math.max(img1.width, img2.width) : img1.width;
    const height = Math.max(img1.height, img2.height);

    const createAlignedImage = (src: PNG): PNG => {
        const aligned = new PNG({ width, height });
        aligned.data.fill(0);
        src.bitblt(aligned, 0, 0, src.width, src.height, 0, 0);
        return aligned;
    };

    return { img1: createAlignedImage(img1), img2: createAlignedImage(img2) };
}

/**
 * 画像の差分を比較し、結果を保存する
 * @param demoPath デモ環境のスクリーンショット
 * @param prodPath 本番環境のスクリーンショット
 * @param outputPath 差分画像の保存先
 * @param unifyWidth 横幅も統一するか（デフォルト: true）
 * @throws 画像の比較に失敗した場合、エラーを投げる
 * @returns 差分画像のパス
 */
export async function compareScreenshots(
    demoPath: string,
    prodPath: string,
    outputPath: string,
    unifyWidth: boolean = true
): Promise<string> {
    try {
        const { default: pixelmatch } = await import('pixelmatch');
        const [img1, img2] = await Promise.all([loadPng(demoPath), loadPng(prodPath)]);

        // 画像サイズを統一
        const { img1: alignedImg1, img2: alignedImg2 } = alignImages(img1, img2, unifyWidth);
        const { width, height } = alignedImg1;

        // 差分画像を生成
        const diff = new PNG({ width, height });

        pixelmatch(alignedImg1.data, alignedImg2.data, diff.data, width, height, {
            threshold: 0.1,
            diffColor: [255, 0, 0],
            diffColorAlt: [0, 255, 0],
        });

        await savePng(diff, outputPath);
        return outputPath;
    } catch (error) {
        throw new Error(`画像比較エラー:\nデモ: ${demoPath}\n本番: ${prodPath}\n出力: ${outputPath}\n${error}`);
    }
}
