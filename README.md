# Visual Diff Locator

デモ環境と本番環境など、2つの Web ページのスクリーンショットを取得し、視覚的な差分を検出・表示する VS Code 拡張機能です。

## 機能概要

- **スクリーンショットの取得**：Puppeteer を使用して、同一デバイス環境で2つのページをキャプチャ
- **画像の比較**：PixelMatch によるピクセル差分検出 + オーバーレイ比較表示
- **結果の表示**：
  - **Pixel Diff View**：差分ピクセルを強調した静的ビュー
  - **Overlay View**：画像を重ねて可視化。以下の操作が可能：
    - 透過度調整（opacity）
    - 色反転（invert）
    - カーソルキー or ドラッグによる画像移動
    - スクロールロック切り替え

---

## 認証対応

### Cookie を利用したログイン状態の再現

`.vscode/visual-diff/cookies.json` に Cookie を保存・適用することで、ログイン済みセッションを再現可能です。

- 保存：手動モード時、自動で保存されます
- 形式：Puppeteer 互換の Cookie JSON
- 取得：`EditThisCookie` などの Chrome 拡張で取得可能

### Basic認証

`.vscode/visual-diff/basic.json` にベーシック認証の情報を保存しておくと、認証ダイアログなしで自動ログインされます。

```json
{
  "example.com": { "username": "user", "password": "pass" },
  "dev.local": { "username": "dev", "password": "1234" }
}
```

---

## ディレクトリ構成

```plaintext
visual-diff-locator/
├── src/
│   ├── core/
│   │   ├── captureService.ts  # Puppeteer によるスクリーンショット取得処理
│   │   ├── diffService.ts     # 画像の差分検出処理
│   │   ├── cookieService.ts   # Cookie 読み込み・書き出し処理
│   ├── ui/                    # UI層（VS Code API を使用）
│   │   ├── extension.ts       # VSCode拡張のエントリーポイント
│   │   └── webview/
│   │       ├── overlay.ts     # オーバーレイ表示ビュー
│   │       └── pixelDiff.ts   # ピクセル差分ビュー
│   ├── config/
│   │   ├── devices.ts
│   │   └── types.ts
├── screenshots/               # 自動生成された比較画像の保存先
├── .vscode/
│   ├── visual-diff/           # Cookieファイル格納用
│   ├── launch.json
│   └── tasks.json
├── package.json　　　　　　　　　# 拡張機能の定義
├── tsconfig.json
└── README.md

```

---

## セットアップ手順

```bash
npm install
npm run compile
```

---

## 開発・デバッグ手順

### 1. 自動コンパイルの開始

```bash
npm run watch
```

---

### 2. 拡張機能の起動（デバッグ）

- `F5` を押下、または 実行タブから `Run Extension` を選択
- コード変更後は再度 `F5` 実行で再起動が必要です

---

### 3. コマンドパレットから実行

- `Cmd` + `Shift` + `P`
- `Visual Diff Locate` と入力して実行
- URL やデバイスを選択し、比較を開始

結果は PixelDiff View と Overlay View に表示されます。
