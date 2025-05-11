import { mkdirSync } from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { captureScreenshots } from '../core/captureService';
import { compareScreenshots } from '../core/diffService';
import { showPixelDiffView } from './webview/pixelDiff';
import { showOverlayView } from './webview/overlay';
import { DiffPanelProvider } from './panel/panelProvider';
import { getInputFromCli } from './input/cliInput';
import { getInputFromGui } from './input/guiInput';
import { InputParams } from './input/types';

export function activate(context: vscode.ExtensionContext) {
  // GUIパネル登録
  const panelProvider = new DiffPanelProvider(async (message) => {
    const input = await getInputFromGui(message);
    if (!input) {
      vscode.window.showErrorMessage('GUI入力が不正です。');
      return;
    }

    try {
      await startComparison(context, input);
    } catch (error) {
      vscode.window.showErrorMessage('比較処理に失敗しました。');
      console.error('[GUI] startComparison error:', error);
    }
  });

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('visualDiffSidebar', panelProvider)
  );

  // CLIコマンド登録
  const cliCallback = async () => {
    const input = await getInputFromCli();
    if (!input) {
      vscode.window.showErrorMessage('入力がキャンセルされました。');
      return;
    }

    try {
      await startComparison(context, input);
    } catch (error) {
      vscode.window.showErrorMessage('比較処理に失敗しました。');
      console.error('[CLI] startComparison error:', error);
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('visual-diff-locator.start', cliCallback)
  );
}

export function deactivate() {}

/**
 * 比較処理を実行する
 */
async function startComparison(context: vscode.ExtensionContext, input: InputParams) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('ワークスペースが開かれていません。');
    return;
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const outputDir = path.join(workspaceRoot, 'screenshots', timestamp);
  mkdirSync(outputDir, { recursive: true });

  const waitForUser = input.isManualShot
    ? async () => {
        const response = await vscode.window.showInformationMessage(
          'スクリーンショットを撮影する準備ができたら「OK」を押してください。', 'OK'
        );
        if (!response) {
          throw new Error('スクリーンショットの撮影がキャンセルされました。');
        }
      }
    : undefined;

  vscode.window.showInformationMessage(`スクリーンショットを取得中... (デバイス: ${input.selectedDevice.name})`);

  const { demoScreenshot, prodScreenshot } = await captureScreenshots(
    input.demoUrl,
    input.prodUrl,
    outputDir,
    input.isManualShot,
    input.selectedDevice.device,
    workspaceRoot,
    waitForUser
  );

  const diffPath = path.join(outputDir, 'diff.png');
  await compareScreenshots(demoScreenshot, prodScreenshot, diffPath);

  vscode.window.showInformationMessage('比較完了！結果を表示します。');

  await Promise.all([
    showPixelDiffView(context, diffPath),
    showOverlayView(context, demoScreenshot, prodScreenshot)
  ]);
}
