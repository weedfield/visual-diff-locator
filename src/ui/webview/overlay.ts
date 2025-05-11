import * as vscode from 'vscode';

export function showOverlayView(
  context: vscode.ExtensionContext,
  baseImagePath: string,
  overlayImagePath: string
) {
  const panel = vscode.window.createWebviewPanel(
    'imageOverlay',
    'Overlay View',
    vscode.ViewColumn.Two,
    { enableScripts: true }
  );

  const baseImageUri = panel.webview.asWebviewUri(
    vscode.Uri.file(baseImagePath)
  );
  const overlayImageUri = panel.webview.asWebviewUri(
    vscode.Uri.file(overlayImagePath)
  );

  panel.webview.html = getOverlayHtml(baseImageUri, overlayImageUri);
}

function getOverlayHtml(baseUri: vscode.Uri, overlayUri: vscode.Uri): string {
  const base = baseUri.toString();
  const overlay = overlayUri.toString();

  return `
    <html>
      <head>
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${base} ${overlay} vscode-resource:; script-src 'unsafe-inline'; style-src 'unsafe-inline';" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          img { max-width: none; max-height: none; display: block; }
          body { height: 100vh; display: flex; flex-direction: column; overflow: visible; }
          .controls-container {
            padding: 16px 10px;
            display: flex;
            justify-content: center;
            gap: 12px;
            z-index: 999;
            background: #1f1f1f;
          }
          .control-item {
            display: flex;
            align-items: center;
            gap: 5px;
            color: #fff;
          }
          .control-item label { white-space: nowrap; }
          input[type="range"] { max-width: 100px; }
          button { padding: 4px 12px; }
          .image-container {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { position: relative; }
          img {
            all: unset;
            width: 100%;
            height: auto;
            display: block;
          }
          .overlay {
            position: absolute;
            top: 0;
            left: 0;
            opacity: 0.5;
            cursor: move;
            filter: none;
          }
        </style>
      </head>
      <body>
        <div class="controls-container">
          <div class="control-item">
            <label>Opacity:</label>
            <input type="range" id="opacitySlider" min="0" max="1" step="0.01" value="0.5">
          </div>
          <div class="control-item">
            <label>Invert:</label>
            <input type="checkbox" id="invertCheckbox">
          </div>
          <div class="control-item">
            <label>Lock Scroll:</label>
            <input type="checkbox" id="scrollLockCheckbox">
          </div>
          <button id="resetBtn">Reset</button>
        </div>

        <div class="image-container">
          <div class="container">
            <img src="${base}">
            <img src="${overlay}" id="overlayImage" class="overlay" >
          </div>
        </div>

        <script>
          const overlay = document.getElementById('overlayImage');
          const opacitySlider = document.getElementById('opacitySlider');
          const invertCheckbox = document.getElementById('invertCheckbox');
          const scrollLockCheckbox = document.getElementById('scrollLockCheckbox');
          const resetBtn = document.getElementById('resetBtn');

          let offsetX = 0, offsetY = 0, isDragging = false;

          overlay.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - overlay.offsetLeft;
            offsetY = e.clientY - overlay.offsetTop;
          });

          document.addEventListener('mousemove', (e) => {
            if (isDragging) {
              overlay.style.left = (e.clientX - offsetX) + 'px';
              overlay.style.top = (e.clientY - offsetY) + 'px';
            }
          });

          document.addEventListener('mouseup', () => isDragging = false);

          document.addEventListener('keydown', (event) => {
            if (scrollLockCheckbox.checked) event.preventDefault();

            const move = event.shiftKey ? 10 : 1;
            const currentLeft = parseInt(overlay.style.left || '0', 10);
            const currentTop = parseInt(overlay.style.top || '0', 10);

            switch (event.key) {
              case 'ArrowUp': overlay.style.top = (currentTop - move) + 'px'; break;
              case 'ArrowDown': overlay.style.top = (currentTop + move) + 'px'; break;
              case 'ArrowLeft': overlay.style.left = (currentLeft - move) + 'px'; break;
              case 'ArrowRight': overlay.style.left = (currentLeft + move) + 'px'; break;
            }
          });

          scrollLockCheckbox.addEventListener('change', () => {
            document.body.style.overflow = scrollLockCheckbox.checked ? 'hidden' : '';
          });

          opacitySlider.addEventListener('input', updateOverlayStyle);
          invertCheckbox.addEventListener('change', updateOverlayStyle);

          function updateOverlayStyle() {
            overlay.style.opacity = opacitySlider.value;
            overlay.style.filter = invertCheckbox.checked ? 'invert(100%)' : 'none';
          }

          resetBtn.addEventListener('click', () => {
            overlay.style.left = '0px';
            overlay.style.top = '0px';
            opacitySlider.value = '0.5';
            invertCheckbox.checked = false;
            updateOverlayStyle();
          });

          updateOverlayStyle();
        </script>
      </body>
    </html>
  `;
}
