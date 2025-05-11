import * as vscode from 'vscode';
import { CUSTOM_DEVICES } from '../../config/devices';
import { DeviceCategory } from '../../config/types';
import { InputParams } from './types';
import { sortDevicesByKeyword } from '../../util/deviceHelper';

export async function getInputFromCli(): Promise<InputParams | null> {
  const demoUrl = await vscode.window.showInputBox({
    prompt: 'デモ環境のURLを入力'
  });
  if (!demoUrl) return null;

  const prodUrl = await vscode.window.showInputBox({
    prompt: '本番環境のURLを入力'
  });
  if (!prodUrl) return null;

  const isManualShot =
    (await vscode.window.showQuickPick(['自動で撮影する', '手動で撮影する'], {
      placeHolder: 'スクリーンショットの撮影方法を選択してください'
    })) === '手動で撮影する';

  const category = (await vscode.window.showQuickPick(
    Object.keys(CUSTOM_DEVICES),
    {
      placeHolder: 'PC または モバイル を選択してください'
    }
  )) as DeviceCategory;
  if (!category) return null;

  const devices = CUSTOM_DEVICES[category];
  const sortedDevices = sortDevicesByKeyword(Object.keys(devices), [
    'iPhone',
    'Pixel'
  ]);
  const selectedDevice = await vscode.window.showQuickPick(sortedDevices, {
    placeHolder: 'デバイスを選択してください'
  });
  if (!selectedDevice) return null;

  return {
    demoUrl,
    prodUrl,
    isManualShot,
    selectedDevice: {
      name: selectedDevice,
      device: devices[selectedDevice]
    }
  };
}
