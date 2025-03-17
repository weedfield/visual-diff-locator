# Visual Diff Locator

デモ環境と本番環境の Web ページのスクリーンショットを取得し、視覚的な差分を検出・表示するツールです。

## 機能概要

- **スクリーンショットの取得**：デモ環境と本番環境のページをキャプチャ
- **画像の比較**：PixelMatch を使用して視覚的な差分を検出
- **結果の表示**：
  - **Pixel Diff View**：差分を強調表示
  - **Overlay View**：画像を重ねて比較可能
    - ドラッグまたはカーソルキーでオーバーレイ画像を移動できます。
    - opacity: 透過度の変更
    - invert: 色調の反転
    - lock scroll: カーソルキー使用時に画像のスクロールを抑えます。

---

## 📂 ディレクトリ構成

```plaintext
visual-diff-locator/
│── src/
│   ├── extension.ts    # VSCode拡張のエントリーポイント
│   ├── util/
│   │   ├── capture.ts  # Puppeteerを使用したスクリーンショット撮影処理
│   │   ├── diff.ts     # PixelMatchを使用した画像比較処理
│   ├── webview/
│   │   ├── pixelDiff.ts  # ピクセル差分ビューのUI
│   │   ├── overlay.ts    # オーバーレイ比較ビューのUI
│── package.json          # 拡張機能のメタデータ
│── tsconfig.json         # TypeScript設定
│── README.md
│── .vscode/
│   ├── launch.json
│   ├── tasks.json
│── screenshots/          # 取得したスクリーンショットの保存フォルダ
│── node_modules/
```

## セットアップ手順

リポジトリをクローン後、root で下記を実行

```sh
npm install
npm run compile
```

## 開発手順

#### 1. コードの実行、オートコンパイル

```
npm run watch
```

---

#### 2. デバッグモードで拡張機能を起動

・`F5` を押下、または実行とデバッグタブより `Run Extension`を押下
<img width="504" alt="Image" src="https://github.com/user-attachments/assets/cf3f2ff1-1eb2-44eb-9228-5bea584d981e" />

**_コードを修正した場合、オートコンパイル後に`F5`で再起動する必要があります。_**

---

#### 3. VsCode のコマンドパレットでコードを実行

・(`Cmd` + `Shift` + `P`) を押下<br>
・`visual diff locate`と入力・実行する。
<img width="929" alt="Image" src="https://github.com/user-attachments/assets/6c4e92b1-fc68-4c71-925f-fd64e02eca4e" />

・比較したいページの URL を指示に従って入力する
<img width="845" alt="Image" src="https://github.com/user-attachments/assets/5787eb73-4c50-4557-9624-3ee5a535e694" />
<img width="878" alt="Image" src="https://github.com/user-attachments/assets/60af27e7-7de2-4252-b395-1f162c32dc58" />

・結果が出力される
<img width="1440" alt="Image" src="https://github.com/user-attachments/assets/e2349d83-9298-4b6d-b13b-d9dbd0c1d785" />
