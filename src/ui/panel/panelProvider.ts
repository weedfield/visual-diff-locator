import * as vscode from "vscode";
import { DeviceCategory } from "../../config/types";
import { CUSTOM_DEVICES } from "../../config/devices";

export class DiffPanelProvider implements vscode.WebviewViewProvider {
  constructor(
    private readonly onRunCommand: (message: any) => void
  ) {}

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === "submit") {
        this.onRunCommand(message);
      }
    });
  }

  private getHtml(): string {
    const categories: DeviceCategory[] = ['PC', 'Mobile'];
    const deviceOptions = (category: DeviceCategory) => {
      return Object.keys(CUSTOM_DEVICES[category])
        .map(name => `<option value="${name}">${name}</option>`)
        .join('\n');
    };
    
    return `
      <!DOCTYPE html>
      <html lang="ja">
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              padding: 10px;
              font-family: sans-serif;
            }
            input, select, button {
              width: 100%;
              box-sizing: border-box;
              margin-bottom: 10px;
              padding: 5px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <h3>Visual Diff</h3>
          <input type="text" id="demoUrl" placeholder="デモ環境 URL" />
          <input type="text" id="prodUrl" placeholder="本番環境 URL" />
          <select id="mode">
            <option value="auto">自動で撮影</option>
            <option value="manual">手動で撮影</option>
          </select>

          <select id="category">
            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
          </select>

          <select id="deviceName" id="deviceSelect">
            ${deviceOptions('PC')}
          </select>

          <button onclick="submit()">比較を開始</button>

          <script>
            const vscode = acquireVsCodeApi();

            const devices = ${JSON.stringify(CUSTOM_DEVICES)};

            document.getElementById('category').addEventListener('change', () => {
              const category = document.getElementById('category').value;
              const deviceSelect = document.getElementById('deviceName');
              deviceSelect.innerHTML = Object.keys(devices[category])
                .map(name => \`<option value="\${name}">\${name}</option>\`)
                .join('');
            });

            function submit() {
              vscode.postMessage({
                command: 'submit',
                demoUrl: document.getElementById('demoUrl').value,
                prodUrl: document.getElementById('prodUrl').value,
                mode: document.getElementById('mode').value,
                deviceCategory: document.getElementById('category').value,
                deviceName: document.getElementById('deviceName').value
              });
            }
          </script>
        </body>
      </html>
    `;
  }
}
